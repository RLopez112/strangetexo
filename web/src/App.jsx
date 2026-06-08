import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import Scene from './Scene';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Blog from './pages/Blog';
import Contact from './pages/Contact';

function AmbientBackground() {
  const blobsRef = useRef([]);

  useEffect(() => {
    let targetX = 0;
    let targetY = 0;
    let animationFrameId;

    const handleMouseMove = (e) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const blobParams = blobsRef.current.map(() => ({
      speedX: 0.0002 + Math.random() * 0.0003,
      speedY: 0.0002 + Math.random() * 0.0003,
      radiusX: 40 + Math.random() * 600,
      radiusY: 40 + Math.random() * 60,
      offsetX: Math.random() * Math.PI * 2,
      offsetY: Math.random() * Math.PI * 2,
      mouseFactor: 15 + Math.random() * 50
    }));

    const animate = () => {
      const time = Date.now();
      blobsRef.current.forEach((blob, index) => {
        if (!blob) return;
        const p = blobParams[index];
        const autoX = Math.sin(time * p.speedX + p.offsetX) * p.radiusX;
        const autoY = Math.cos(time * p.speedY + p.offsetY) * p.radiusY;
        blob.style.transform = `translate(${autoX + targetX * p.mouseFactor}px, ${autoY + targetY * p.mouseFactor}px)`;
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="ambient-container">
      {[1, 2, 3, 4, 5].map((i, idx) => (
        <div
          key={i}
          className={`ambient-blob blob-${i}`}
          ref={(el) => (blobsRef.current[idx] = el)}
        />
      ))}
    </div>
  );
}

function Navigation() {
  const location = useLocation();

  return (
    <nav className="nav-container">
      {location.pathname !== '/' && (
        <Link to="/" className="nav-link">home</Link>
      )}
      <Link to="/projects" className="nav-link">projects</Link>
      <Link to="/blog" className="nav-link">blog</Link>
      <Link to="/contact" className="nav-link">contact</Link>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AmbientBackground />

      {/* Persistent 3D Canvas */}
      <Canvas className="webgl" eventSource={document.getElementById('root')} eventPrefix="client" camera={{ position: [3, 1, 3], fov: 35, near: 0.100, far: 105 }}>
        <Scene />
      </Canvas>

      <main className="layout-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <header className="hero-identity" style={{ pointerEvents: 'auto' }}>
          <Link to="/">
            <img src="/assets/svgs/dark theme/isologo-dark theme.svg" alt="Strange Texo Isologo" className="isologo-main" />
          </Link>

        </header>

        <div style={{ pointerEvents: 'auto' }}>
          <Navigation />
        </div>

        <div className="page-content" style={{ pointerEvents: 'auto', position: 'absolute', right: '10%', top: '20%', width: '30%', color: 'white' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </div>
      </main>
    </BrowserRouter>
  );
}
