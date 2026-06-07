import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { SSRPass } from 'three/addons/postprocessing/SSRPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ReflectorForSSRPass } from 'three/addons/objects/ReflectorForSSRPass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const params = {
    enableSSR: true,
    autoRotate: false,
    otherMeshes: true,
    groundReflector: true,
};
let composer;
let ssrPass;
let gui;
let stats;
let controls;
let camera, scene, renderer;
const otherMeshes = [];
let groundReflector;
const selects = [];

const container = document.querySelector('#container');

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('jsm/libs/draco/');
dracoLoader.setDecoderConfig({ type: 'js' });

init();

function init() {
    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 15);
    camera.position.set(3, 1, 3);

    scene = new THREE.Scene();
    scene.background = null; // We use the HTML background for the blobs to be visible

    // Lights
    let spotLight;
    const loader = new THREE.TextureLoader().setPath('textures/');
    const lighttexture = loader.load('flashlight2.jpg');

    spotLight = new THREE.SpotLight(0xBFE4FF, .4);
    spotLight.position.set(8, 9, 8);
    spotLight.angle = Math.PI / 30;
    spotLight.penumbra = 1;
    spotLight.decay = 2;
    spotLight.distance = 50;
    spotLight.map = lighttexture;
    spotLight.target.position.set(1, 1, 2);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.camera.near = 1;
    spotLight.shadow.camera.far = 10;
    spotLight.shadow.focus = 1;
    scene.add(spotLight);
    scene.add(spotLight.target);

    spotLight = new THREE.SpotLight(0xFFC77F, 1.5);
    spotLight.position.set(3, 18, 6);
    spotLight.angle = Math.PI / 75;
    spotLight.penumbra = 1;
    spotLight.decay = 2;
    spotLight.distance = 50;
    spotLight.map = lighttexture;
    spotLight.target.position.set(.5, 0, 1);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.camera.near = 1;
    spotLight.shadow.camera.far = 10;
    spotLight.shadow.focus = 1;
    scene.add(spotLight);
    scene.add(spotLight.target);

    spotLight = new THREE.SpotLight(0xFFC77F, 1.5);
    spotLight.position.set(-3, 18, 10);
    spotLight.angle = Math.PI / 70;
    spotLight.penumbra = 1;
    spotLight.decay = 2;
    spotLight.distance = 50;
    spotLight.map = lighttexture;
    spotLight.target.position.set(-.4, 0, 1.5);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.camera.near = 1;
    spotLight.shadow.camera.far = 10;
    spotLight.shadow.focus = 1;
    scene.add(spotLight);
    scene.add(spotLight.target);

    let video, texture;
    video = document.getElementById('video');
    video.play();
    video.addEventListener('play', function () {
        this.currentTime = 3;
    });

    texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;

    let geometry, material, mesh;

    geometry = new THREE.BoxGeometry(4, 2, .04);
    material = new THREE.MeshPhongMaterial({
        color: 'black',
        emissiveIntensity: 2,
        emissive: 'white',
        emissiveMap: texture
    });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-.12, 1.1, .015);
    scene.add(mesh);
    otherMeshes.push(mesh);
    selects.push(mesh);

    geometry = new THREE.PlaneGeometry(10, 10);
    groundReflector = new ReflectorForSSRPass(geometry, {
        clipBias: 0.0001,
        textureWidth: window.innerWidth,
        textureHeight: window.innerHeight,
        color: 0x888888,
        useDepthTexture: true,
    });
    groundReflector.material.depthWrite = false;
    groundReflector.rotation.x = -Math.PI / 2;
    groundReflector.visible = false;
    scene.add(groundReflector);

    // GLTF load
    let materialGLTF = new THREE.MeshPhongMaterial({
        color: 'white',
        emissiveIntensity: 0.02,
        emissive: 'white'
    });
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
        '/machine.gltf',
        (gltf) => {
            for (const child of gltf.scene.children) {
                scene.add(child);
                child.material = materialGLTF;
            }
        },
        () => { },
        () => { console.log('error loading GLTF') }
    );

    // renderer
    const canvas = document.querySelector('.webgl');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(-0.3, .75, 1);
    controls.update();
    controls.enabled = !params.autoRotate;

    // composer
    composer = new EffectComposer(renderer);
    ssrPass = new SSRPass({
        renderer,
        scene,
        camera,
        width: innerWidth,
        height: innerHeight,
        groundReflector: params.groundReflector ? groundReflector : null,
        selects: params.groundReflector ? selects : null
    });

    composer.addPass(ssrPass);
    composer.addPass(new OutputPass());

    // Show stats and GUI only in development
    if (import.meta.env.DEV) {
        stats = new Stats();
        container.appendChild(stats.dom);

        gui = new GUI({ width: 260 });
        gui.add(params, 'enableSSR').name('Enable SSR');
        gui.add(params, 'groundReflector').onChange(() => {
            if (params.groundReflector) {
                ssrPass.groundReflector = groundReflector;
                ssrPass.selects = selects;
            } else {
                ssrPass.groundReflector = null;
                ssrPass.selects = null;
            }
        });

        ssrPass.thickness = 0.018;
        gui.add( ssrPass, 'thickness' ).min( 0 ).max( .1 ).step( .0001 );
        ssrPass.infiniteThick = false;
        gui.add( ssrPass, 'infiniteThick' );
        gui.add( params, 'autoRotate' ).onChange( () => {
            controls.enabled = ! params.autoRotate;
        } );

        const folder = gui.addFolder( 'more settings' );
        folder.add( ssrPass, 'fresnel' ).onChange( ()=>{
            groundReflector.fresnel = ssrPass.fresnel;
        } );
        folder.add( ssrPass, 'distanceAttenuation' ).onChange( ()=>{
            groundReflector.distanceAttenuation = ssrPass.distanceAttenuation;
        } );
        ssrPass.maxDistance = .25;
        groundReflector.maxDistance = ssrPass.maxDistance;
        folder.add( ssrPass, 'maxDistance' ).min( 0 ).max( .5 ).step( .001 ).onChange( ()=>{
            groundReflector.maxDistance = ssrPass.maxDistance;
        } );
        folder.add( params, 'otherMeshes' ).onChange( () => {
            if ( params.otherMeshes ) {
                otherMeshes.forEach( mesh => mesh.visible = true );
            } else {
                otherMeshes.forEach( mesh => mesh.visible = false );
            }
        } );
        folder.add( ssrPass, 'bouncing' );
        folder.add( ssrPass, 'output', {
            'Default': SSRPass.OUTPUT.Default,
            'SSR Only': SSRPass.OUTPUT.SSR,
            'Beauty': SSRPass.OUTPUT.Beauty,
            'Depth': SSRPass.OUTPUT.Depth,
            'Normal': SSRPass.OUTPUT.Normal,
            'Metalness': SSRPass.OUTPUT.Metalness,
        } ).onChange( function ( value ) {
            ssrPass.output = value;
        } );
        ssrPass.opacity = 1;
        groundReflector.opacity = ssrPass.opacity;
        folder.add( ssrPass, 'opacity' ).min( 0 ).max( 1 ).onChange( ()=>{
            groundReflector.opacity = ssrPass.opacity;
        } );
        folder.add( ssrPass, 'blur' );
    }

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    groundReflector.getRenderTarget().setSize(window.innerWidth, window.innerHeight);
    groundReflector.resolution.set(window.innerWidth, window.innerHeight);
}

function animate() {
    if (stats) stats.begin();
    render();
    if (stats) stats.end();
}

function render() {
    if (params.autoRotate) {
        const timer = Date.now() * 0.0003;
        camera.position.x = Math.sin(timer) * 0.5;
        camera.position.y = 0.2135;
        camera.position.z = Math.cos(timer) * 0.5;
        camera.lookAt(0, 0.5, 0);
    } else {
        controls.update();
    }

    if (params.enableSSR) {
        composer.render();
    } else {
        renderer.render(scene, camera);
    }
}
