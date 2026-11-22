"use client";

import { useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, useGLTF } from "@react-three/drei";
import * as THREE from "three";

function RealisticWatch() {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/classic-watch.glb");

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.2; // Slow elegant rotation
      group.current.position.y = Math.sin(state.clock.elapsedTime) * 0.2; // Gentle hover
    }
  });

  return (
    <group ref={group} scale={7} position={[0, -0.5, 0]}>
      <primitive object={scene} />
    </group>
  );
}

export default function InteractiveWatch() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-full bg-gray-950"></div>;
  }

  return (
    <div className="w-full h-full bg-gray-950 relative flex flex-col items-center justify-center overflow-hidden">
      
      <div className="absolute top-20 z-10 text-center pointer-events-none">
        <h1 className="text-5xl font-serif text-white tracking-widest mb-4">THE CLASSIC</h1>
        <p className="text-gray-400 uppercase tracking-widest text-sm">Drag to Rotate</p>
      </div>

      <div className="absolute inset-0 cursor-move">
        <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 20, 15]} intensity={2.5} />
          <pointLight position={[-15, 10, -10]} intensity={2} color="#ffffff" />
          <directionalLight position={[-5, -5, 10]} intensity={1} />
          
          {/* HDRI Environment for realistic reflections */}
          <Environment preset="studio" />
          
          <RealisticWatch />

          <ContactShadows position={[0, -4.5, 0]} opacity={0.7} scale={20} blur={2} far={10} color="#000000" />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 1.5} />
        </Canvas>
      </div>
    </div>
  );
}

// Preload the model so it loads instantly
useGLTF.preload("/classic-watch.glb");
