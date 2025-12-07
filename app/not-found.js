"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { Canvas, useFrame } from "@react-three/fiber";
import { SoftShadows, Float, Html } from "@react-three/drei";

// --- 1. DANCING COCO ---
function DiscoCoco() {
  const group = useRef();
  const head = useRef();
  const fl = useRef(); 
  const fr = useRef();
  const bl = useRef(); 
  const br = useRef();

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime * 12;

    // Bounce
    group.current.position.y = Math.abs(Math.sin(t * 0.5)) * 0.5;
    // Spin
    group.current.rotation.y += 0.02;
    // Legs
    fl.current.rotation.x = Math.sin(t) * 0.8;
    fr.current.rotation.x = Math.cos(t) * 0.8;
    bl.current.rotation.x = Math.cos(t) * 0.8;
    br.current.rotation.x = Math.sin(t) * 0.8;
    // Head
    head.current.rotation.z = Math.sin(t * 0.5) * 0.2;
    head.current.rotation.x = Math.sin(t) * 0.1;
  });

  return (
    <group ref={group} position={[0, -1, 0]} scale={[0.8, 0.8, 0.8]}>
      {/* Body */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.6, 0.5, 0.9]} />
        <meshStandardMaterial color="#E0C9A6" />
      </mesh>

      {/* Head */}
      <group ref={head} position={[0, 0.7, 0.4]}>
        <mesh castShadow>
             <boxGeometry args={[0.5, 0.5, 0.5]} />
             <meshStandardMaterial color="#E0C9A6" />
        </mesh>
        <mesh position={[-0.3, 0.1, -0.1]}><boxGeometry args={[0.15, 0.3, 0.15]} /><meshStandardMaterial color="#8B5A2B" /></mesh>
        <mesh position={[0.3, 0.1, -0.1]}><boxGeometry args={[0.15, 0.3, 0.15]} /><meshStandardMaterial color="#8B5A2B" /></mesh>
        <mesh position={[-0.15, 0.1, 0.26]}><sphereGeometry args={[0.06]} /><meshStandardMaterial color="black" /></mesh>
        <mesh position={[0.15, 0.1, 0.26]}><sphereGeometry args={[0.06]} /><meshStandardMaterial color="black" /></mesh>
        <mesh position={[0, -0.05, 0.26]}><sphereGeometry args={[0.08]} /><meshStandardMaterial color="#333" /></mesh>
        {/* Sunglasses */}
        <mesh position={[0, 0.1, 0.28]}>
            <boxGeometry args={[0.55, 0.15, 0.05]} />
            <meshStandardMaterial color="black" roughness={0.1} />
        </mesh>
      </group>

      {/* Tail */}
      <mesh position={[0, 0.5, -0.4]} rotation={[0.5, 0, 0]}>
         <boxGeometry args={[0.1, 0.4, 0.1]} />
         <meshStandardMaterial color="#E0C9A6" />
      </mesh>

      {/* Legs */}
      <group ref={fl} position={[-0.2, 0, 0.3]}><mesh position={[0, -0.25, 0]}><boxGeometry args={[0.15, 0.5, 0.15]} /><meshStandardMaterial color="#E0C9A6" /></mesh></group>
      <group ref={fr} position={[0.2, 0, 0.3]}><mesh position={[0, -0.25, 0]}><boxGeometry args={[0.15, 0.5, 0.15]} /><meshStandardMaterial color="#E0C9A6" /></mesh></group>
      <group ref={bl} position={[-0.2, 0, -0.3]}><mesh position={[0, -0.25, 0]}><boxGeometry args={[0.15, 0.5, 0.15]} /><meshStandardMaterial color="#E0C9A6" /></mesh></group>
      <group ref={br} position={[0.2, 0, -0.3]}><mesh position={[0, -0.25, 0]}><boxGeometry args={[0.15, 0.5, 0.15]} /><meshStandardMaterial color="#E0C9A6" /></mesh></group>

      <Html position={[0, 2, 0]} center>
        <div style={{
            fontFamily: 'Comic Sans MS', fontWeight: 'bold', fontSize: '20px', 
            color: 'white', textShadow: '0 0 10px #ff00ff', whiteSpace: 'nowrap'
        }}>
            wrong turn! 🎵
        </div>
      </Html>
    </group>
  );
}

// --- 2. LIGHTS ---
function DiscoLights() {
  const light = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (light.current) {
        light.current.color.setHSL(Math.sin(t * 0.5), 0.5, 0.5);
        light.current.position.x = Math.sin(t) * 3;
    }
  });
  return <spotLight ref={light} position={[0, 5, 2]} intensity={2} penumbra={1} castShadow />;
}

// --- 3. EXPORT COMPONENT ---
export default function NotFound() {
  return (
    <main style={{ width: "100vw", height: "100vh", background: "#111", position: "relative" }}>
      
      <Canvas shadows camera={{ position: [0, 2, 6], fov: 50 }}>
        <ambientLight intensity={0.2} />
        <DiscoLights />
        <SoftShadows />
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <DiscoCoco />
        </Float>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
            <circleGeometry args={[4, 32]} />
            <meshStandardMaterial color="#222" roughness={0.2} metalness={0.8} />
        </mesh>
      </Canvas>

      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        textAlign: "center", color: "white", fontFamily: "'Comic Sans MS', sans-serif",
        pointerEvents: "none", width: "100%"
      }}>
        <h1 style={{ fontSize: "6rem", margin: 0, textShadow: "4px 4px 0px #ff00ff" }}>404</h1>
        <p style={{ fontSize: "1.5rem", marginBottom: "300px" }}>Oops! Coco can't find this page.</p>
        
        <div style={{ pointerEvents: "auto" }}>
            <Link href="/">
                <button style={{
                    background: "#ff00ff", color: "white", border: "none",
                    padding: "15px 40px", fontSize: "1.5rem", borderRadius: "50px",
                    fontWeight: "bold", cursor: "pointer", boxShadow: "0 0 20px #ff00ff"
                }}>
                    Take Me Home 🏠
                </button>
            </Link>
        </div>
      </div>
    </main>
  );
}