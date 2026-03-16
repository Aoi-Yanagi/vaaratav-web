// components/3d/HeroGeometric.tsx
"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Mesh } from "three";

function RotatingShape() {
  const meshRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} scale={3}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#4f46e5" wireframe />
    </mesh>
  );
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full opacity-30">
      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} />
        <RotatingShape />
      </Canvas>
    </div>
  );
}