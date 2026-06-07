document.addEventListener('DOMContentLoaded', () => {
  const singleGlow = document.querySelector('.ambient-glow');
  const blobs = document.querySelectorAll('.ambient-blob');

  let targetX = 0;
  let targetY = 0;

  // Subtle ambient mouse reactivity
  document.addEventListener('mousemove', (e) => {
    // Calculate relative position based on center of screen
    targetX = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
    targetY = (e.clientY / window.innerHeight - 0.5) * 2; // -1 to 1
  });

  // Setup random parameters for multiple blobs
  const blobParams = Array.from(blobs).map(() => ({
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

    if (singleGlow) {
      const autoX = Math.sin(time * 0.0005) * 40;
      const autoY = Math.cos(time * 0.0004) * 40;
      singleGlow.style.transform = `translate(${autoX + targetX * 30}px, ${autoY + targetY * 30}px)`;
    }

    blobs.forEach((blob, index) => {
      const p = blobParams[index];
      const autoX = Math.sin(time * p.speedX + p.offsetX) * p.radiusX;
      const autoY = Math.cos(time * p.speedY + p.offsetY) * p.radiusY;
      blob.style.transform = `translate(${autoX + targetX * p.mouseFactor}px, ${autoY + targetY * p.mouseFactor}px)`;
    });

    requestAnimationFrame(animate);
  };

  animate();
});
