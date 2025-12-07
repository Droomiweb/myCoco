"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sky, SoftShadows, Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// ==========================================
// 1. OPENING LOADING SCREEN
// ==========================================
function LoadingScreen({ started }) {
  const [text, setText] = useState("Waking up Coco...");
  
  useEffect(() => {
    const messages = [
      "Waking up Coco...", 
      "Chasing Squirrels...", 
      "Finding a Stick...", 
      "Loading Treats...",
      "Digging up textures..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setText(messages[i]);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`loader ${started ? "hidden" : ""}`}>
      <div className="loader-content">
        {/* CSS Animated Dog Face */}
        <div className="dog-face">
            <div className="ear left"></div>
            <div className="ear right"></div>
            <div className="eye left"></div>
            <div className="eye right"></div>
            <div className="nose"></div>
            <div className="tongue"></div>
        </div>
        <h1>{text}</h1>
        <div className="progress-bar">
            <div className="fill"></div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. AUDIO SYSTEM
// ==========================================
const playSound = (type) => {
  if (typeof window === 'undefined') return;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;

  if (type === 'pop') {
    // High pitch "Blip"
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'win') {
    // Happy Victory Sound
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(600, now + 0.1);
    osc.frequency.linearRampToValueAtTime(300, now + 0.3);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.4);
    osc.start(now);
    osc.stop(now + 0.4);
  } else if (type === 'step') {
    // Soft Footstep
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, now);
    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.05);
  }
};

// ==========================================
// 3. 3D CHARACTERS (NPCs & COCO)
// ==========================================

function VoxelHuman({ position, color }) {
  const group = useRef();
  const [target, setTarget] = useState(new THREE.Vector3(position[0], 0, position[2]));
  const leftLeg = useRef();
  const rightLeg = useRef();

  useFrame((state, delta) => {
    if(!group.current) return;
    const current = group.current.position;
    
    // Wandering Logic
    if(current.distanceTo(target) > 0.5) {
      const dir = new THREE.Vector3().subVectors(target, current).normalize();
      current.add(dir.multiplyScalar(1.5 * delta));
      group.current.lookAt(target.x, 0, target.z);

      // Walk Animation
      const t = state.clock.elapsedTime * 10;
      leftLeg.current.rotation.x = Math.sin(t) * 0.5;
      rightLeg.current.rotation.x = Math.cos(t) * 0.5;
    } else {
      leftLeg.current.rotation.x = 0;
      rightLeg.current.rotation.x = 0;
      // Pick new spot randomly
      if(Math.random() < 0.005) {
        setTarget(new THREE.Vector3((Math.random()-0.5)*30, 0, (Math.random()-0.5)*30));
      }
    }
  });

  return (
    <group ref={group} position={position} scale={[1.2, 1.2, 1.2]}>
      <group position={[0, 0.9, 0]}>
         <mesh position={[0, 0.7, 0]} castShadow>
             <boxGeometry args={[0.3, 0.35, 0.3]} />
             <meshStandardMaterial color="#ffccaa" />
         </mesh>
         <mesh position={[0, 0.2, 0]} castShadow>
             <boxGeometry args={[0.4, 0.65, 0.25]} />
             <meshStandardMaterial color={color} />
         </mesh>
         <group ref={leftLeg} position={[-0.1, -0.4, 0]}>
             <mesh position={[0, -0.2, 0]} castShadow>
                 <boxGeometry args={[0.12, 0.6, 0.12]} />
                 <meshStandardMaterial color="#222" />
             </mesh>
         </group>
         <group ref={rightLeg} position={[0.1, -0.4, 0]}>
             <mesh position={[0, -0.2, 0]} castShadow>
                 <boxGeometry args={[0.12, 0.6, 0.12]} />
                 <meshStandardMaterial color="#222" />
             </mesh>
         </group>
      </group>
    </group>
  );
}

function VoxelDog({ targetPosition, mood, onFound }) {
  const group = useRef();
  const head = useRef();
  const frontL = useRef(); const frontR = useRef(); 
  const backL = useRef(); const backR = useRef();

  useFrame((state, delta) => {
    if (!group.current) return;
    const currentPos = group.current.position;
    const dist = currentPos.distanceTo(targetPosition);
    const time = state.clock.getElapsedTime();

    if (dist > 0.5) {
      // Running
      const dir = new THREE.Vector3().subVectors(targetPosition, currentPos).normalize();
      currentPos.add(dir.multiplyScalar(7 * delta));
      group.current.lookAt(targetPosition.x, currentPos.y, targetPosition.z);
      
      const t = time * 25;
      frontL.current.rotation.x = Math.sin(t) * 0.6; 
      frontR.current.rotation.x = Math.cos(t) * 0.6;
      backL.current.rotation.x = Math.cos(t) * 0.6; 
      backR.current.rotation.x = Math.sin(t) * 0.6;
      
      if (Math.floor(time * 10) % 5 === 0) playSound('step');

    } else {
      // Stopped
      frontL.current.rotation.x = 0; frontR.current.rotation.x = 0;
      backL.current.rotation.x = 0; backR.current.rotation.x = 0;
      
      if (mood === 'sad') { 
          head.current.rotation.x = 0.5; 
          group.current.rotation.z = 0; 
      } else if (mood === 'happy') { 
          group.current.position.y = Math.abs(Math.sin(time * 10)) * 0.5; 
          head.current.rotation.x = -0.3; 
      } else { 
          // Idle
          group.current.position.y = 0; 
          head.current.rotation.x = 0; 
          head.current.rotation.z = Math.sin(time * 2) * 0.1; 
      }
    }
  });

  return (
    <group ref={group} scale={[0.4, 0.4, 0.4]} onClick={(e) => { e.stopPropagation(); onFound(); }}>
      <group position={[0, 0.5, 0]}>
        {/* Invisible big box for mobile tapping */}
        <mesh position={[0, 1, 0]} visible={false}>
            <boxGeometry args={[3, 3, 3]} />
        </mesh>

        <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[0.6, 0.5, 0.9]} />
            <meshStandardMaterial color="#E0C9A6" />
        </mesh>

        <group ref={head} position={[0, 0.7, 0.4]}>
            <mesh castShadow>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="#E0C9A6" />
            </mesh>
            <mesh position={[-0.3, 0.1, -0.1]}>
                <boxGeometry args={[0.15, 0.3, 0.15]} />
                <meshStandardMaterial color="#8B5A2B" />
            </mesh>
            <mesh position={[0.3, 0.1, -0.1]}>
                <boxGeometry args={[0.15, 0.3, 0.15]} />
                <meshStandardMaterial color="#8B5A2B" />
            </mesh>
            <mesh position={[-0.15, 0.1, 0.26]}>
                <sphereGeometry args={[0.06]} />
                <meshStandardMaterial color="black" />
            </mesh>
            <mesh position={[0.15, 0.1, 0.26]}>
                <sphereGeometry args={[0.06]} />
                <meshStandardMaterial color="black" />
            </mesh>
            <mesh position={[0, -0.05, 0.26]}>
                <sphereGeometry args={[0.08]} />
                <meshStandardMaterial color="#333" />
            </mesh>
        </group>

        <mesh position={[0, 0.5, -0.4]} rotation={[0.5, 0, 0]}>
            <boxGeometry args={[0.1, 0.4, 0.1]} />
            <meshStandardMaterial color="#E0C9A6" />
        </mesh>

        <group ref={frontL} position={[-0.2, 0, 0.3]}><mesh position={[0, -0.25, 0]}><boxGeometry args={[0.15, 0.5, 0.15]} /><meshStandardMaterial color="#E0C9A6" /></mesh></group>
        <group ref={frontR} position={[0.2, 0, 0.3]}><mesh position={[0, -0.25, 0]}><boxGeometry args={[0.15, 0.5, 0.15]} /><meshStandardMaterial color="#E0C9A6" /></mesh></group>
        <group ref={backL} position={[-0.2, 0, -0.3]}><mesh position={[0, -0.25, 0]}><boxGeometry args={[0.15, 0.5, 0.15]} /><meshStandardMaterial color="#E0C9A6" /></mesh></group>
        <group ref={backR} position={[0.2, 0, -0.3]}><mesh position={[0, -0.25, 0]}><boxGeometry args={[0.15, 0.5, 0.15]} /><meshStandardMaterial color="#E0C9A6" /></mesh></group>
        
        <Html position={[0, 2.5, 0]} center pointerEvents="none" zIndexRange={[100, 0]}>
           {mood === 'happy' && <div className="emote">😂 HAHA!</div>}
           {mood === 'sad' && <div className="emote">😭 OUCH!</div>}
           {mood === 'seeking' && <div className="emote">🤫</div>}
        </Html>
      </group>
    </group>
  );
}

// ==========================================
// 4. GAME WORLD & SCENERY
// ==========================================
function GameWorld({ gameState, setGameState, hidingSpots }) {
  const [target, setTarget] = useState(new THREE.Vector3(2, 0, 2));
  const [mood, setMood] = useState('idle');

  useEffect(() => {
    if (gameState === 'hiding') {
        // Pick random spot
        const randomSpot = hidingSpots[Math.floor(Math.random() * hidingSpots.length)];
        // Move BEHIND the tree/rock
        setTarget(new THREE.Vector3(randomSpot.x + 0.5, 0, randomSpot.z - 0.5));
        setMood('normal');
    } else if (gameState === 'won') {
        setMood('sad'); 
        playSound('win');
    } else if (gameState === 'lost') {
        setMood('happy'); 
        playSound('win');
    } else {
        setMood('idle');
    }
  }, [gameState, hidingSpots]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
      <Sky sunPosition={[100, 20, 100]} turbidity={8} rayleigh={6} />
      <SoftShadows size={20} samples={10} />
      
      {/* Fog to hide the world edge */}
      <fog attach="fog" args={['#aaccff', 15, 50]} /> 

      {/* Floor */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]} 
        receiveShadow 
        onPointerDown={(e) => { 
            if (gameState === 'idle') { 
                playSound('pop'); 
                setTarget(e.point); 
            }
        }}
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#7CFC00" />
      </mesh>

      {/* Scenery */}
      {hidingSpots.map((item, i) => (
         <group key={i} position={[item.x, 0, item.z]}>
            {item.type === 'tree' ? (
                <group scale={item.scale}>
                    <mesh position={[0, 1, 0]} castShadow>
                        <cylinderGeometry args={[0.2, 0.4, 2]} />
                        <meshStandardMaterial color="#5D4037" />
                    </mesh>
                    <mesh position={[0, 2.5, 0]} castShadow>
                        <dodecahedronGeometry args={[1.5]} />
                        <meshStandardMaterial color="#228B22" />
                    </mesh>
                </group>
            ) : (
                <mesh position={[0, 0.5, 0]} scale={item.scale} castShadow>
                    <dodecahedronGeometry args={[1]} />
                    <meshStandardMaterial color="gray" />
                </mesh>
            )}
         </group>
      ))}

      {/* NPCs */}
      <VoxelHuman position={[3, 0, 5]} color="#ff6b6b" />
      <VoxelHuman position={[-4, 0, -5]} color="#48dbfb" />
      <VoxelHuman position={[8, 0, -2]} color="#1dd1a1" />

      {/* COCO */}
      <VoxelDog 
        targetPosition={target} 
        mood={mood} 
        onFound={() => { 
            if(gameState === 'seeking') setGameState('won'); 
            else playSound('pop'); 
        }} 
      />
    </>
  );
}

// ==========================================
// 5. MAIN COMPONENT (PAGE)
// ==========================================
export default function Home() {
  const [gameState, setGameState] = useState('idle'); 
  const [timer, setTimer] = useState(0);
  const [showBlindfold, setShowBlindfold] = useState(false);
  const [loaded, setLoaded] = useState(false); // Controls loading screen

  // Generate Scenery Once
  const hidingSpots = useMemo(() => {
    const spots = [];
    for(let i=0; i<20; i++) spots.push({ type: 'tree', x: (Math.random()-0.5)*50, z: (Math.random()-0.5)*50, scale: 1 + Math.random() });
    for(let i=0; i<15; i++) spots.push({ type: 'rock', x: (Math.random()-0.5)*50, z: (Math.random()-0.5)*50, scale: 1 + Math.random() });
    return spots;
  }, []);

  // 1. Loading Animation Timer
  useEffect(() => {
    setTimeout(() => setLoaded(true), 3500); // Wait 3.5 seconds then open curtain
  }, []);

  // 2. Game Logic Timer
  useEffect(() => {
    let interval;
    if (gameState === 'hiding') {
        setShowBlindfold(true);
        // Wait 4 seconds for dog to hide
        setTimeout(() => { 
            setShowBlindfold(false); 
            setGameState('seeking'); 
            setTimer(15); 
        }, 4000);
    }
    if (gameState === 'seeking' && timer > 0) {
        interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (gameState === 'seeking' && timer === 0) {
        setGameState('lost');
    }
    return () => clearInterval(interval);
  }, [gameState, timer]);

  return (
    <main style={{ width: "100vw", height: "100vh", position: "relative", background: '#aaccff' }}>
      
      {/* --- A. LOADING SCREEN --- */}
      <LoadingScreen started={loaded} />

      {/* --- B. 3D GAME WORLD --- */}
      <Canvas shadows camera={{ position: [0, 8, 12], fov: 50 }}>
         <OrbitControls 
            minDistance={5} 
            maxDistance={25} 
            maxPolarAngle={Math.PI/2.1} 
         />
         <GameWorld 
            gameState={gameState} 
            setGameState={setGameState} 
            hidingSpots={hidingSpots} 
         />
      </Canvas>

      {/* --- C. BLINDFOLD OVERLAY --- */}
      <div className={`blindfold ${showBlindfold ? 'active' : ''}`}>
         <h1>🙈 CLOSE YOUR EYES...</h1>
         <p>Coco is hiding!</p>
      </div>

      {/* --- D. GAME UI --- */}
      <div className="ui-layer">
        <div className="header">
            {gameState === 'idle' && <h1>🐕 Coco's Park</h1>}
            {gameState === 'seeking' && <p className="status blink">FIND HIM! {timer}s</p>}
            {gameState === 'won' && <p className="status win">YOU FOUND HIM! 🎉</p>}
            {gameState === 'lost' && <p className="status lose">COCO WINS! 😛</p>}
        </div>
        <div className="controls">
            {gameState === 'idle' && (
                <button className="btn-primary" onClick={() => setGameState('hiding')}>Play Hide & Seek 🙈</button>
            )}
            {(gameState === 'won' || gameState === 'lost') && (
                <button className="btn-primary" onClick={() => setGameState('idle')}>Play Again 🔄</button>
            )}
        </div>
      </div>

      {/* --- E. CSS STYLES --- */}
      <style jsx global>{`
        body { margin: 0; overflow: hidden; font-family: 'Comic Sans MS', sans-serif; user-select: none; }
        
        /* LOADING SCREEN ANIMATIONS */
        .loader {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: #FFD700; z-index: 9999;
            display: flex; justify-content: center; align-items: center;
            transition: transform 0.8s ease-in-out;
        }
        .loader.hidden { transform: translateY(-100%); } /* Slides Up */
        
        .loader-content { text-align: center; color: #8B5A2B; }
        .loader h1 { font-size: 1.5rem; margin-top: 20px; animation: bounce 1s infinite; }
        
        .progress-bar { width: 200px; height: 10px; background: white; border-radius: 5px; margin: 10px auto; overflow: hidden; }
        .fill { width: 0%; height: 100%; background: #FF69B4; animation: fillBar 3.5s linear forwards; }
        @keyframes fillBar { to { width: 100%; } }

        /* CSS DOG FACE */
        .dog-face { width: 80px; height: 80px; background: #E0C9A6; border-radius: 10px; position: relative; margin: 0 auto; animation: spinFace 3s infinite ease-in-out; }
        .ear { position: absolute; top: -10px; width: 20px; height: 30px; background: #8B5A2B; border-radius: 5px; }
        .ear.left { left: 0; } .ear.right { right: 0; }
        .eye { position: absolute; top: 30px; width: 10px; height: 10px; background: black; border-radius: 50%; }
        .eye.left { left: 20px; } .eye.right { right: 20px; }
        .nose { position: absolute; top: 50px; left: 35px; width: 10px; height: 8px; background: #333; border-radius: 3px; }
        .tongue { position: absolute; bottom: 10px; left: 38px; width: 10px; height: 12px; background: #FF69B4; border-radius: 0 0 5px 5px; animation: pant 0.3s infinite; }
        @keyframes pant { 0%, 100% { height: 12px; } 50% { height: 15px; } }
        @keyframes spinFace { 0% { transform: rotate(0deg); } 25% { transform: rotate(-10deg); } 75% { transform: rotate(10deg); } 100% { transform: rotate(0deg); } }

        /* BLINDFOLD ANIMATION */
        .blindfold { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: black; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.5s; z-index: 20; }
        .blindfold.active { opacity: 1; pointer-events: auto; }

        /* GAME UI */
        .ui-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
        .header { position: absolute; top: 20px; width: 100%; text-align: center; text-shadow: 2px 2px white; }
        .status { font-size: 2rem; font-weight: bold; background: rgba(255,255,255,0.9); padding: 10px 20px; border-radius: 20px; display: inline-block; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
        .win { color: green; } .lose { color: red; } .blink { color: #d35400; }
        .controls { position: absolute; bottom: 40px; width: 100%; text-align: center; pointer-events: auto; }
        .btn-primary { background: #ff9f43; border: 4px solid white; color: white; padding: 15px 40px; font-size: 1.5rem; border-radius: 50px; cursor: pointer; font-weight: bold; box-shadow: 0 5px 15px rgba(0,0,0,0.2); transition: transform 0.1s; }
        .btn-primary:active { transform: scale(0.95); }
        .emote { background: white; padding: 5px; border-radius: 10px; font-weight: bold; font-size: 24px; border: 2px solid black; }
      `}</style>
    </main>
  );
}