"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky, SoftShadows, Html, OrbitControls, Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";

// ==========================================
// 1. AUDIO SYSTEM
// ==========================================
const playSound = (type) => {
  if (typeof window === 'undefined') return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;

  if (type === 'pop') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'win') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(600, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.4);
    osc.start(now);
    osc.stop(now + 0.4);
  } else if (type === 'step') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, now);
    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.05);
  } else if (type === 'bark') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  } else if (type === 'coin') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  }
};

// ==========================================
// 2. MOBILE JOYSTICK COMPONENT
// ==========================================
function Joystick({ onMove }) {
  const wrapperRef = useRef(null);
  const stickRef = useRef(null);
  const [active, setActive] = useState(false);
  
  const handleTouch = (e) => {
    if(e.cancelable) e.preventDefault(); 
    const touch = e.touches[0];
    const rect = wrapperRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    let x = touch.clientX - rect.left - centerX;
    let y = touch.clientY - rect.top - centerY;
    
    const distance = Math.sqrt(x * x + y * y);
    const maxDist = rect.width / 2;
    
    if (distance > maxDist) {
      const angle = Math.atan2(y, x);
      x = Math.cos(angle) * maxDist;
      y = Math.sin(angle) * maxDist;
    }

    stickRef.current.style.transform = `translate(${x}px, ${y}px)`;
    const normX = x / maxDist;
    const normY = y / maxDist;
    onMove({ x: normX, y: normY }); 
  };

  const reset = () => {
    setActive(false);
    stickRef.current.style.transform = `translate(0px, 0px)`;
    onMove({ x: 0, y: 0 });
  };

  return (
    <div 
      className="joystick-zone"
      ref={wrapperRef}
      onTouchStart={(e) => { setActive(true); handleTouch(e); }}
      onTouchMove={handleTouch}
      onTouchEnd={reset}
      onTouchCancel={reset}
    >
      <div ref={stickRef} className={`stick ${active ? 'active' : ''}`} />
      <style jsx>{`
        .joystick-zone {
            position: absolute; bottom: 40px; left: 40px;
            width: 120px; height: 120px;
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            touch-action: none; 
            pointer-events: auto;
            z-index: 50;
            display: flex; justify-content: center; align-items: center;
        }
        .stick {
            width: 50px; height: 50px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            transition: transform 0.1s;
        }
        .stick.active { transition: none; background: #FFD700; }
      `}</style>
    </div>
  );
}

// ==========================================
// 3. CAMERA RIG (KEYBOARD + JOYSTICK)
// ==========================================
function CameraRig({ controlsRef, joyInput }) {
  const { camera } = useThree();
  const movement = useRef({ w: false, a: false, s: false, d: false });

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (movement.current[key] !== undefined) movement.current[key] = true;
    };
    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (movement.current[key] !== undefined) movement.current[key] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    const speed = 15 * delta;
    const { w, a, s, d } = movement.current;
    
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0; 
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();

    const moveVec = new THREE.Vector3();

    if (w) moveVec.add(forward);
    if (s) moveVec.sub(forward);
    if (d) moveVec.add(right);
    if (a) moveVec.sub(right);

    if (joyInput.current.y !== 0) {
        moveVec.add(forward.clone().multiplyScalar(-joyInput.current.y)); 
    }
    if (joyInput.current.x !== 0) {
        moveVec.add(right.clone().multiplyScalar(joyInput.current.x));
    }

    if (moveVec.length() > 0) {
      moveVec.normalize().multiplyScalar(speed);
      camera.position.add(moveVec);
      controlsRef.current.target.add(moveVec);
    }
  });

  return null;
}

// ==========================================
// 4. LOADING & ASSETS
// ==========================================
function LoadingScreen({ started }) {
  const [text, setText] = useState("Waking up Coco...");
  useEffect(() => {
    const messages = ["Waking up Coco...", "Chasing Squirrels...", "Finding a Stick...", "Loading Treats..."];
    let i = 0;
    const interval = setInterval(() => { i = (i + 1) % messages.length; setText(messages[i]); }, 800);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className={`loader ${started ? "hidden" : ""}`}>
      <div className="loader-content">
        <div className="dog-face"><div className="ear left"></div><div className="ear right"></div><div className="eye left"></div><div className="eye right"></div><div className="nose"></div><div className="tongue"></div></div>
        <h1>{text}</h1>
        <div className="progress-bar"><div className="fill"></div></div>
      </div>
    </div>
  );
}

function GoldenBone({ position, onCollect }) {
    const ref = useRef();
    useFrame((state) => {
        if(ref.current) {
            ref.current.rotation.y += 0.02;
            ref.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
        }
    });
    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <group position={position} onClick={(e) => { e.stopPropagation(); onCollect(); }} ref={ref}>
                <mesh castShadow><capsuleGeometry args={[0.15, 0.4, 4, 8]} /><meshStandardMaterial color="#FFD700" roughness={0.3} metalness={0.8} /></mesh>
                <mesh position={[0, 0.25, 0]} rotation={[0,0,Math.PI/2]}><capsuleGeometry args={[0.12, 0.4, 4, 8]} /><meshStandardMaterial color="#FFD700" roughness={0.3} metalness={0.8} /></mesh>
                 <Html position={[0, 1, 0]} distanceFactor={10} pointerEvents="none"><div className="bone-label">+5s</div></Html>
            </group>
        </Float>
    )
}

function VoxelDog({ targetPosition, mood, onFound, showHint }) {
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
      const dir = new THREE.Vector3().subVectors(targetPosition, currentPos).normalize();
      currentPos.add(dir.multiplyScalar(7 * delta));
      group.current.lookAt(targetPosition.x, currentPos.y, targetPosition.z);
      const t = time * 25;
      frontL.current.rotation.x = Math.sin(t) * 0.6; frontR.current.rotation.x = Math.cos(t) * 0.6;
      backL.current.rotation.x = Math.cos(t) * 0.6; backR.current.rotation.x = Math.sin(t) * 0.6;
      if (Math.floor(time * 10) % 5 === 0) playSound('step');
    } else {
      frontL.current.rotation.x = 0; frontR.current.rotation.x = 0;
      backL.current.rotation.x = 0; backR.current.rotation.x = 0;
      if (mood === 'sad') { head.current.rotation.x = 0.5; }
      else if (mood === 'happy') { group.current.position.y = Math.abs(Math.sin(time * 15)) * 0.5; head.current.rotation.x = -0.3; }
      else { group.current.position.y = 0; head.current.rotation.x = 0; head.current.rotation.z = Math.sin(time * 2) * 0.1; }
    }
  });

  return (
    <group ref={group} scale={[0.4, 0.4, 0.4]} onClick={(e) => { e.stopPropagation(); onFound(); }}>
      <group position={[0, 0.5, 0]}>
        <mesh position={[0, 1, 0]} visible={false}><boxGeometry args={[4, 4, 4]} /></mesh>
        <mesh position={[0, 0.25, 0]} castShadow><boxGeometry args={[0.6, 0.5, 0.9]} /><meshStandardMaterial color="#E0C9A6" /></mesh>
        <group ref={head} position={[0, 0.7, 0.4]}>
            <mesh castShadow><boxGeometry args={[0.5, 0.5, 0.5]} /><meshStandardMaterial color="#E0C9A6" /></mesh>
            <mesh position={[-0.3, 0.1, -0.1]}><boxGeometry args={[0.15, 0.3, 0.15]} /><meshStandardMaterial color="#8B5A2B" /></mesh>
            <mesh position={[0.3, 0.1, -0.1]}><boxGeometry args={[0.15, 0.3, 0.15]} /><meshStandardMaterial color="#8B5A2B" /></mesh>
            <mesh position={[-0.15, 0.1, 0.26]}><sphereGeometry args={[0.06]} /><meshStandardMaterial color="black" /></mesh>
            <mesh position={[0.15, 0.1, 0.26]}><sphereGeometry args={[0.06]} /><meshStandardMaterial color="black" /></mesh>
            <mesh position={[0, -0.05, 0.26]}><sphereGeometry args={[0.08]} /><meshStandardMaterial color="#333" /></mesh>
        </group>
        <mesh position={[0, 0.5, -0.4]} rotation={[0.5, 0, 0]}><boxGeometry args={[0.1, 0.4, 0.1]} /><meshStandardMaterial color="#E0C9A6" /></mesh>
        <group ref={frontL} position={[-0.2, 0, 0.3]}><mesh position={[0, -0.25, 0]}><boxGeometry args={[0.15, 0.5, 0.15]} /><meshStandardMaterial color="#E0C9A6" /></mesh></group>
        <group ref={frontR} position={[0.2, 0, 0.3]}><mesh position={[0, -0.25, 0]}><boxGeometry args={[0.15, 0.5, 0.15]} /><meshStandardMaterial color="#E0C9A6" /></mesh></group>
        <group ref={backL} position={[-0.2, 0, -0.3]}><mesh position={[0, -0.25, 0]}><boxGeometry args={[0.15, 0.5, 0.15]} /><meshStandardMaterial color="#E0C9A6" /></mesh></group>
        <group ref={backR} position={[0.2, 0, -0.3]}><mesh position={[0, -0.25, 0]}><boxGeometry args={[0.15, 0.5, 0.15]} /><meshStandardMaterial color="#E0C9A6" /></mesh></group>
        <Html position={[0, 2.5, 0]} center pointerEvents="none" zIndexRange={[100, 0]}>
           {mood === 'happy' && <div className="emote">😂 HAHA!</div>}
           {mood === 'sad' && <div className="emote">😭 OUCH!</div>}
           {showHint && <div className="emote blink">WOOF! 🔊</div>}
        </Html>
      </group>
    </group>
  );
}

// ==========================================
// 5. GAME WORLD
// ==========================================
function GameWorld({ gameState, setGameState, level, addTime, setScore }) {
  const [dogTarget, setDogTarget] = useState(new THREE.Vector3(2, 0, 2));
  const [mood, setMood] = useState('idle');
  const [showHint, setShowHint] = useState(false);
  const [bones, setBones] = useState([]);
  
  const scenery = useMemo(() => {
    const spots = [];
    const density = 25 + (level * 5); 
    const range = 60 + (level * 2);
    for(let i=0; i<density; i++) spots.push({ type: 'tree', x: (Math.random()-0.5)*range, z: (Math.random()-0.5)*range, scale: 1 + Math.random(), id: i });
    for(let i=0; i<density/1.5; i++) spots.push({ type: 'rock', x: (Math.random()-0.5)*range, z: (Math.random()-0.5)*range, scale: 0.8 + Math.random(), id: i+100 });
    return spots;
  }, [level]);

  useEffect(() => {
    if (gameState === 'hiding') {
        const randomSpot = scenery[Math.floor(Math.random() * scenery.length)];
        const angle = Math.random() * Math.PI * 2;
        const radius = (randomSpot.type === 'tree' ? 1.5 : 1.2) * randomSpot.scale;
        const safeX = randomSpot.x + Math.sin(angle) * radius;
        const safeZ = randomSpot.z + Math.cos(angle) * radius;

        setDogTarget(new THREE.Vector3(safeX, 0, safeZ));
        setMood('normal');
        setShowHint(false);

        const newBones = [];
        for(let i=0; i<4; i++) {
            newBones.push({ id: i, pos: [(Math.random()-0.5)*40, 0.5, (Math.random()-0.5)*40] });
        }
        setBones(newBones);

    } else if (gameState === 'won') {
        setMood('sad'); playSound('win');
    } else if (gameState === 'lost') {
        setMood('happy'); playSound('win');
    } else if (gameState === 'hint') {
        setShowHint(true); playSound('bark');
        setTimeout(() => { setShowHint(false); setGameState('seeking'); }, 1500);
    }
  }, [gameState, scenery, level]);

  const collectBone = (id) => {
      setBones(prev => prev.filter(b => b.id !== id));
      playSound('coin');
      addTime(5);
      setScore(s => s + 50);
  };

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
      <Sky sunPosition={[100, 20, 100]} turbidity={8} rayleigh={6} />
      <SoftShadows size={25} samples={10} />
      <fog attach="fog" args={['#aaccff', 10, 60]} /> 

      {/* --- FLOOW WITH CLICK-TO-MOVE LOGIC --- */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]} 
        receiveShadow
        onPointerDown={(e) => {
            // Logic: Only allow moving the dog manually if game is NOT in progress
            if (gameState === 'idle' || gameState === 'won' || gameState === 'lost') {
                e.stopPropagation();
                setDogTarget(e.point); // Move dog to clicked point
                playSound('pop');
            }
        }}
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#7CFC00" />
      </mesh>

      {scenery.map((item) => (
         <group key={`${item.type}-${item.id}`} position={[item.x, 0, item.z]}>
            {item.type === 'tree' ? (
                <group scale={item.scale}>
                    <mesh position={[0, 1, 0]} castShadow><cylinderGeometry args={[0.2, 0.4, 2]} /><meshStandardMaterial color="#5D4037" /></mesh>
                    <mesh position={[0, 2.5, 0]} castShadow><dodecahedronGeometry args={[1.5]} /><meshStandardMaterial color="#228B22" /></mesh>
                </group>
            ) : (
                <mesh position={[0, 0.5, 0]} scale={item.scale} castShadow><dodecahedronGeometry args={[1]} /><meshStandardMaterial color="gray" /></mesh>
            )}
         </group>
      ))}

      {gameState === 'seeking' && bones.map(bone => (
          <GoldenBone key={bone.id} position={bone.pos} onCollect={() => collectBone(bone.id)} />
      ))}

      <VoxelDog 
        targetPosition={dogTarget} 
        mood={mood} 
        showHint={showHint}
        onFound={() => { if(gameState === 'seeking' || gameState === 'hint') setGameState('won'); else playSound('pop'); }} 
      />
      
      {gameState === 'won' && <Sparkles count={300} scale={12} size={6} speed={0.4} opacity={1} color="#FFD700" position={[dogTarget.x, 2, dogTarget.z]} />}
    </>
  );
}

// ==========================================
// 6. MAIN PAGE
// ==========================================
export default function Home() {
  const [gameState, setGameState] = useState('idle'); 
  const [timer, setTimer] = useState(0);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [showBlindfold, setShowBlindfold] = useState(false);
  const [loaded, setLoaded] = useState(false);
  
  const controlsRef = useRef();
  const joyInput = useRef({ x: 0, y: 0 });

  useEffect(() => { setTimeout(() => setLoaded(true), 3500); }, []);

  useEffect(() => {
    let interval;
    if (gameState === 'hiding') {
        setShowBlindfold(true);
        setTimeout(() => { setShowBlindfold(false); setGameState('seeking'); setTimer(Math.max(15, 45 - (level * 2))); }, 4000);
    }
    if ((gameState === 'seeking' || gameState === 'hint') && timer > 0) {
        interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (gameState === 'seeking' && timer <= 0) {
        setGameState('lost');
    }
    return () => clearInterval(interval);
  }, [gameState, timer, level]);

  const handleNextLevel = () => { setLevel(l => l + 1); setScore(s => s + 100); setGameState('hiding'); };
  const handleRestart = () => { setLevel(1); setScore(0); setGameState('hiding'); }

  return (
    <main style={{ width: "100vw", height: "100vh", position: "relative", background: '#aaccff', overflow: 'hidden' }}>
      <LoadingScreen started={loaded} />

      <Canvas shadows camera={{ position: [0, 10, 15], fov: 50 }}>
         <OrbitControls ref={controlsRef} enableZoom={true} minDistance={5} maxDistance={40} maxPolarAngle={Math.PI/2.1} />
         <CameraRig controlsRef={controlsRef} joyInput={joyInput} />

         <GameWorld 
            gameState={gameState} 
            setGameState={setGameState} 
            level={level}
            setScore={setScore}
            addTime={(amt) => setTimer(t => t + amt)}
         />
      </Canvas>

      <div className={`blindfold ${showBlindfold ? 'active' : ''}`}>
         <h1>🙈 LEVEL {level}</h1>
         <p>Coco is hiding...</p>
      </div>

      {gameState === 'seeking' && (
        <Joystick onMove={(val) => { joyInput.current = val; }} />
      )}

      <div className="ui-layer">
        <div className="header">
            <div className="score-board">
                <span>⭐ Score: {score}</span>
                <span>🌲 Level: {level}</span>
            </div>
            
            <div className="instructions">
                <span className="pc-hint">⌨ <b>WASD</b> to Move</span>
                <span className="mobile-hint">🕹 <b>Thumb</b> to Move</span>
            </div>

            {gameState === 'idle' && <h1>🐕 Coco's Park</h1>}
            {gameState === 'seeking' && <p className="status blink">FIND HIM! {timer}s</p>}
            {gameState === 'hint' && <p className="status">BARK! BARK!</p>}
            {gameState === 'won' && <p className="status win">FOUND HIM! (+100pts)</p>}
            {gameState === 'lost' && <p className="status lose">COCO WINS! 😛</p>}
        </div>

        <div className="controls">
            {gameState === 'idle' && <button className="btn-primary" onClick={() => setGameState('hiding')}>Start Level 1 🙈</button>}
            {gameState === 'seeking' && <button className="btn-secondary" onClick={() => setGameState('hint')}>Need a Hint? 🦴</button>}
            {gameState === 'won' && <button className="btn-primary" onClick={handleNextLevel}>Next Level ➡</button>}
            {gameState === 'lost' && <button className="btn-primary" onClick={handleRestart}>Try Again 🔄</button>}
        </div>
      </div>

      <style jsx global>{`
        body { margin: 0; overflow: hidden; font-family: 'Comic Sans MS', sans-serif; user-select: none; touch-action: none; }
        .loader { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #FFD700; z-index: 9999; display: flex; justify-content: center; align-items: center; transition: transform 0.8s ease-in-out; }
        .loader.hidden { transform: translateY(-100%); } 
        .loader-content { text-align: center; color: #8B5A2B; }
        .progress-bar { width: 200px; height: 10px; background: white; border-radius: 5px; margin: 10px auto; overflow: hidden; }
        .fill { width: 0%; height: 100%; background: #FF69B4; animation: fillBar 3.5s linear forwards; }
        @keyframes fillBar { to { width: 100%; } }
        .dog-face { width: 80px; height: 80px; background: #E0C9A6; border-radius: 10px; position: relative; margin: 0 auto; animation: spinFace 3s infinite ease-in-out; }
        .ear { position: absolute; top: -10px; width: 20px; height: 30px; background: #8B5A2B; border-radius: 5px; }
        .ear.left { left: 0; } .ear.right { right: 0; }
        .eye { position: absolute; top: 30px; width: 10px; height: 10px; background: black; border-radius: 50%; }
        .eye.left { left: 20px; } .eye.right { right: 20px; }
        .nose { position: absolute; top: 50px; left: 35px; width: 10px; height: 8px; background: #333; border-radius: 3px; }
        .tongue { position: absolute; bottom: 10px; left: 38px; width: 10px; height: 12px; background: #FF69B4; border-radius: 0 0 5px 5px; animation: pant 0.3s infinite; }
        @keyframes pant { 0%, 100% { height: 12px; } 50% { height: 15px; } }
        @keyframes spinFace { 0% { transform: rotate(0deg); } 25% { transform: rotate(-10deg); } 75% { transform: rotate(10deg); } 100% { transform: rotate(0deg); } }
        .blindfold { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: black; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.5s; z-index: 20; }
        .blindfold.active { opacity: 1; pointer-events: auto; }
        .ui-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
        .header { position: absolute; top: 20px; width: 100%; text-align: center; text-shadow: 2px 2px white; display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .score-board { background: rgba(255,255,255,0.9); padding: 5px 15px; border-radius: 20px; display: flex; gap: 20px; font-weight: bold; color: #555; box-shadow: 0 4px 10px rgba(0,0,0,0.1); pointer-events: auto; }
        .instructions { background: rgba(0,0,0,0.6); color: white; padding: 5px 15px; border-radius: 10px; font-size: 0.9rem; text-shadow: none; display: flex; gap: 15px; pointer-events: auto; }
        
        .status { font-size: 2rem; font-weight: bold; background: rgba(255,255,255,0.95); padding: 10px 25px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .win { color: green; border: 2px solid green; } 
        .lose { color: red; border: 2px solid red; } 
        .blink { color: #d35400; animation: blinker 1s linear infinite; }
        @keyframes blinker { 50% { opacity: 0.5; } }
        .controls { position: absolute; bottom: 40px; right: 20px; width: auto; text-align: center; pointer-events: auto; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
        .btn-primary { background: #ff9f43; border: 4px solid white; color: white; padding: 15px 40px; font-size: 1.5rem; border-radius: 50px; cursor: pointer; font-weight: bold; box-shadow: 0 5px 15px rgba(0,0,0,0.2); transition: transform 0.1s; }
        .btn-primary:active { transform: scale(0.95); }
        .btn-secondary { background: #54a0ff; border: 3px solid white; color: white; padding: 10px 25px; font-size: 1.2rem; border-radius: 30px; cursor: pointer; font-weight: bold; box-shadow: 0 5px 10px rgba(0,0,0,0.2); transition: transform 0.1s; }
        .btn-secondary:active { transform: scale(0.95); }
        .emote { background: white; padding: 5px 10px; border-radius: 10px; font-weight: bold; font-size: 24px; border: 2px solid black; box-shadow: 2px 2px 5px rgba(0,0,0,0.3); white-space: nowrap; }
        .bone-label { color: #FFD700; font-weight: bold; font-size: 20px; text-shadow: 1px 1px 2px black; }

        /* Media Queries */
        @media (max-width: 768px) {
            .controls { bottom: 180px; right: 20px; align-items: center; width: 100%; } 
            .pc-hint { display: none; }
        }
        @media (min-width: 769px) {
            .mobile-hint { display: none; }
            .joystick-zone { display: none; }
        }
      `}</style>
    </main>
  );
}