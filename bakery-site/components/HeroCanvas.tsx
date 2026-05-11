"use client";

import { Canvas } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial, Float } from "@react-three/drei";

function FloatingOrbs() {
  return (
    <>
      {/* Primary pink orb */}
      <Float speed={1.4} rotationIntensity={0.7} floatIntensity={1.4}>
        <Sphere args={[1.5, 64, 64]} position={[0, 0, 0]}>
          <MeshDistortMaterial
            color="#ec4899"
            distort={0.32}
            speed={2}
            roughness={0.1}
            metalness={0.6}
            transparent
            opacity={0.88}
          />
        </Sphere>
      </Float>

      {/* Purple satellite */}
      <Float speed={2.2} rotationIntensity={1.1} floatIntensity={2}>
        <Sphere args={[0.55, 32, 32]} position={[2.4, 0.9, -1.2]}>
          <MeshDistortMaterial
            color="#a855f7"
            distort={0.45}
            speed={3}
            roughness={0.15}
            metalness={0.5}
            transparent
            opacity={0.75}
          />
        </Sphere>
      </Float>

      {/* Rose accent */}
      <Float speed={1.8} rotationIntensity={0.5} floatIntensity={1.2}>
        <Sphere args={[0.32, 32, 32]} position={[-2, -1.3, 0.6]}>
          <MeshDistortMaterial
            color="#fb7185"
            distort={0.6}
            speed={4}
            roughness={0}
            metalness={0.8}
          />
        </Sphere>
      </Float>

      {/* Tiny gold accent */}
      <Float speed={3} rotationIntensity={2} floatIntensity={3}>
        <Sphere args={[0.18, 16, 16]} position={[1.2, -2, 1]}>
          <MeshDistortMaterial color="#fbbf24" distort={0.2} speed={5} roughness={0} metalness={1} />
        </Sphere>
      </Float>
    </>
  );
}

function Particles() {
  const count = 120;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 14;
  }
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#f9a8d4" size={0.025} transparent opacity={0.5} />
    </points>
  );
}

export default function HeroCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true }}>
      <ambientLight intensity={0.25} />
      <pointLight position={[6, 6, 6]} color="#f472b6" intensity={4} />
      <pointLight position={[-6, -4, -6]} color="#a855f7" intensity={2.5} />
      <pointLight position={[0, -6, 3]} color="#fb7185" intensity={1.5} />
      <FloatingOrbs />
      <Particles />
    </Canvas>
  );
}
