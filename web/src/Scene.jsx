import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, useVideoTexture, Stats } from '@react-three/drei';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { SSRPass } from 'three/addons/postprocessing/SSRPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ReflectorForSSRPass } from 'three/addons/objects/ReflectorForSSRPass.js';

function TVScreen({ visible = true, selects }) {
  const texture = useVideoTexture('/textures/video.mp4', {
    crossOrigin: 'Anonymous',
    loop: true,
    muted: true,
  });

  if (texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }

  const meshRef = useRef();

  useEffect(() => {
    if (meshRef.current && selects) {
      selects.current.push(meshRef.current);
    }
  }, [selects]);

  return (
    <mesh ref={meshRef} position={[-0.12, 1.1, 0.015]} visible={visible}>
      <boxGeometry args={[4, 2, 0.001]} />
      <meshPhongMaterial
        color="black"
        emissiveIntensity={.5}
        emissive="white"
        emissiveMap={texture}
      />
    </mesh>
  );
}

function Machine({ visible = true }) {
  const { scene } = useGLTF('/machine.gltf');

  scene.traverse((child) => {
    if (child.isMesh) {
      child.material = new THREE.MeshPhongMaterial({
        color: 'white',
        emissiveIntensity: 0.02,
        emissive: 'white',
      });
    }
  });

  return <primitive object={scene} visible={visible} />;
}

function SSRPostProcessing({ autoRotate, setAutoRotate, showOtherMeshes, setShowOtherMeshes, selects, floorColor, setFloorColor, setShowFloor }) {
  const { gl, scene, camera, size } = useThree();
  const [composer, setComposer] = useState();

  const ssrRef = useRef(null);
  const reflectorRef = useRef(null);

  useEffect(() => {
    const geometry = new THREE.PlaneGeometry(10, 10);
    const groundReflector = new ReflectorForSSRPass(geometry, {
      clipBias: 0.0003,
      textureWidth: size.width,
      textureHeight: size.height,
      color: 0x888888,
      useDepthTexture: true,
    });
    groundReflector.material.depthWrite = false;
    groundReflector.rotation.x = -Math.PI / 2;
    groundReflector.position.y = -0.01;
    groundReflector.visible = false;
    scene.add(groundReflector);
    reflectorRef.current = groundReflector;

    const ssrPass = new SSRPass({
      renderer: gl,
      scene,
      camera,
      width: size.width,
      height: size.height,
      groundReflector: groundReflector,
      selects: selects.current,
    });
    ssrRef.current = ssrPass;

    const comp = new EffectComposer(gl);
    comp.addPass(ssrPass);
    comp.addPass(new OutputPass());
    setComposer(comp);

    const gui = new GUI({ width: 260 });
    const params = {
      enableSSR: true,
      groundReflector: true,
      floorMesh: true,
      autoRotate: false,
      otherMeshes: showOtherMeshes,
    };

    gui.add(params, 'enableSSR').name('Enable SSR');
    gui.add(params, 'groundReflector').name('Enable Reflector').onChange(() => {
      if (params.groundReflector) {
        ssrPass.groundReflector = groundReflector;
        ssrPass.selects = selects.current;
      } else {
        ssrPass.groundReflector = null;
        ssrPass.selects = null;
      }
    });
    gui.add(params, 'floorMesh').name('Show Floor Mesh').onChange((v) => {
      setShowFloor(v);
    });
    gui.add(params, 'autoRotate').onChange((v) => setAutoRotate(v));

    const distFolder = gui.addFolder('Distance Controls');

    ssrPass.thickness = 0.1;
    distFolder.add(ssrPass, 'thickness').min(0).max(2).step(0.01).name('Thickness');

    distFolder.add(ssrPass, 'fresnel').name('Fresnel').onChange(() => {
      groundReflector.fresnel = ssrPass.fresnel;
    });

    distFolder.add(ssrPass, 'distanceAttenuation').name('Distance Attenuation').onChange(() => {
      groundReflector.distanceAttenuation = ssrPass.distanceAttenuation;
    });

    const distanceParams = {
      ssrMaxDistance: 0.55,
      reflectorMaxDistance: 0.55
    };
    ssrPass.maxDistance = distanceParams.ssrMaxDistance;
    groundReflector.maxDistance = distanceParams.reflectorMaxDistance;

    distFolder.add(distanceParams, 'ssrMaxDistance').min(0).max(10).step(0.01).name('SSR Distance').onChange((v) => {
      ssrPass.maxDistance = v;
    });
    distFolder.add(distanceParams, 'reflectorMaxDistance').min(0).max(10).step(0.01).name('Reflector Distance').onChange((v) => {
      groundReflector.maxDistance = v;
    });

    const colorFolder = gui.addFolder('Color & Tone Controls');

    const colorParams = {
      reflectorColor: groundReflector.color.getHex(),
      floorColor: floorColor
    };
    colorFolder.addColor(colorParams, 'reflectorColor').name('SSR Base Color').onChange((v) => {
      groundReflector.color.setHex(v);
    });
    // Removed floorColor from this useEffect to prevent closure staleness on floorColor changes
    colorFolder.addColor(colorParams, 'floorColor').name('Floor Mesh Color').onChange((v) => {
      setFloorColor(v);
    });

    const toneParams = {
      toneMapping: 1,
      exposure: 2.5
    };
    gl.toneMapping = toneParams.toneMapping;
    gl.toneMappingExposure = toneParams.exposure;
    gl.needsUpdate = true;
    colorFolder.add(toneParams, 'toneMapping', {
      'None': THREE.NoToneMapping,
      'Linear': THREE.LinearToneMapping,
      'Reinhard': THREE.ReinhardToneMapping,
      'Cineon': THREE.CineonToneMapping,
      'ACESFilmic': THREE.ACESFilmicToneMapping
    }).name('Tone Mapping').onChange((v) => {
      gl.toneMapping = Number(v);
      gl.needsUpdate = true;
    });
    colorFolder.add(toneParams, 'exposure').min(0).max(5).step(0.1).name('Exposure').onChange((v) => {
      gl.toneMappingExposure = v;
    });

    const folder = gui.addFolder('more settings');
    folder.add(params, 'otherMeshes').onChange((v) => setShowOtherMeshes(v));
    folder.add(ssrPass, 'bouncing');
    folder.add(ssrPass, 'output', {
      'Default': SSRPass.OUTPUT.Default,
      'SSR Only': SSRPass.OUTPUT.SSR,
      'Beauty': SSRPass.OUTPUT.Beauty,
      'Depth': SSRPass.OUTPUT.Depth,
      'Normal': SSRPass.OUTPUT.Normal,
      'Metalness': SSRPass.OUTPUT.Metalness,
    }).onChange((value) => { ssrPass.output = value; });

    ssrPass.opacity = .1;
    groundReflector.opacity = ssrPass.opacity;
    folder.add(ssrPass, 'opacity').min(0).max(1).onChange(() => {
      groundReflector.opacity = ssrPass.opacity;
    });
    folder.add(ssrPass, 'blur');

    comp.userData = { params, gui };

    return () => {
      gui.destroy();
      scene.remove(groundReflector);
      groundReflector.dispose();
      ssrPass.dispose();
    };
  }, [gl, scene, camera]);

  useEffect(() => {
    if (composer && ssrRef.current && reflectorRef.current) {
      composer.setSize(size.width, size.height);
      ssrRef.current.setSize(size.width, size.height);
      reflectorRef.current.getRenderTarget().setSize(size.width, size.height);
      reflectorRef.current.resolution.set(size.width, size.height);
    }
  }, [size, composer]);

  useFrame(() => {
    if (composer && composer.userData.params.enableSSR) {
      composer.render();
    } else {
      gl.render(scene, camera);
    }
  }, 1);

  return null;
}

export default function Scene() {
  const lightTexture = useLoader(THREE.TextureLoader, '/textures/flashlight2.jpg');

  const [autoRotate, setAutoRotate] = useState(false);
  const [otherMeshes, setOtherMeshes] = useState(true);
  const [floorColor, setFloorColor] = useState('#808080');
  const [showFloor, setShowFloor] = useState(false);
  const selects = useRef([]);

  const [target1] = useState(() => { const o = new THREE.Object3D(); o.position.set(1, 1, 2); return o; });
  const [target2] = useState(() => { const o = new THREE.Object3D(); o.position.set(0.5, 0, 1); return o; });
  const [target3] = useState(() => { const o = new THREE.Object3D(); o.position.set(-0.4, 0, 1.5); return o; });

  return (
    <>
      <OrbitControls
        makeDefault
        enableDamping
        autoRotate={autoRotate}
        target={[-0.3, 0.75, 1]}
      />
      <Stats />

      <primitive object={target1} />
      <spotLight
        color={0xBFE4FF}
        intensity={40}
        position={[8, 9, 8]}
        angle={Math.PI / 30}
        penumbra={1}
        decay={2}
        distance={50}
        map={lightTexture}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={10}
        shadow-focus={1}
        target={target1}
      />

      <primitive object={target2} />
      <spotLight
        color={0xFFC77F}
        intensity={150}
        position={[3, 18, 6]}
        angle={Math.PI / 75}
        penumbra={1}
        decay={2}
        distance={50}
        map={lightTexture}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={10}
        shadow-focus={1}
        target={target2}
      />

      <primitive object={target3} />
      <spotLight
        color={0xFFC77F}
        intensity={150}
        position={[-3, 18, 10]}
        angle={Math.PI / 70}
        penumbra={1}
        decay={2}
        distance={50}
        map={lightTexture}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={10}
        shadow-focus={1}
        target={target3}
      />

      <SSRPostProcessing
        autoRotate={autoRotate}
        setAutoRotate={setAutoRotate}
        showOtherMeshes={otherMeshes}
        setShowOtherMeshes={setOtherMeshes}
        selects={selects}
        floorColor={floorColor}
        setFloorColor={setFloorColor}
        setShowFloor={setShowFloor}
      />

      {showFloor && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.0001, 0]}>
          <planeGeometry args={[80, 80]} />
          <meshPhongMaterial color={floorColor} />
        </mesh>
      )}

      <TVScreen visible={otherMeshes} selects={selects} />
      <Machine visible={otherMeshes} />
    </>
  );
}
