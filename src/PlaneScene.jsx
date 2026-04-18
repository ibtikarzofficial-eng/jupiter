import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useScrollStore } from './store';

// ─────────────────────────────────────────────
// 1. THE STEALTH WING
// ─────────────────────────────────────────────
function Wing({ opacity }) {
    const wingShape = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0); shape.lineTo(6, -1.5); shape.lineTo(6.5, -2.5); shape.lineTo(1.5, -0.5); shape.lineTo(0, 0);
        return shape;
    }, []);

    const extrudeSettings = useMemo(() => ({
        depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 4,
    }), []);

    return (
        <mesh position={[2.8, -2.8, -3.5]} rotation={[-0.08, 0.15, 0.35]}>
            <extrudeGeometry args={[wingShape, extrudeSettings]} />
            <meshPhysicalMaterial color="#050505" metalness={0.9} roughness={0.2} transparent opacity={opacity} />
        </mesh>
    );
}

// ─────────────────────────────────────────────
// 2. THE PREMIUM CABIN WALL (No 3D Model Needed)
// ─────────────────────────────────────────────
function CabinInterior({ opacity }) {
    const wallShape = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(-15, -10); shape.lineTo(15, -10); shape.lineTo(15, 10); shape.lineTo(-15, 10); shape.lineTo(-15, -10);
        const hole = new THREE.Path();
        hole.absellipse(2.5, 0.1, 1.45, 2.0, 0, Math.PI * 2, false, 0);
        shape.holes.push(hole);
        return shape;
    }, []);

    const wallSettings = useMemo(() => ({
        depth: 0.6, bevelEnabled: true, bevelSegments: 8, bevelSize: 0.04, bevelThickness: 0.04, curveSegments: 64,
    }), []);

    return (
        <group position={[0, 0, 1.2]}>
            {/* Matte Black Wall */}
            <mesh>
                <extrudeGeometry args={[wallShape, wallSettings]} />
                <meshPhysicalMaterial color="#080808" roughness={0.9} metalness={0.1} transparent opacity={opacity} />
            </mesh>

            {/* Outer Window Seal (Dark Rubber) */}
            <mesh position={[2.5, 0.1, 0.6]} scale={[1, 1.38, 1]}>
                <torusGeometry args={[1.45, 0.12, 32, 64]} />
                <meshPhysicalMaterial color="#050505" roughness={0.95} metalness={0.1} transparent opacity={opacity} />
            </mesh>

            {/* Inner Window Rim (Brushed Gold Accent) */}
            <mesh position={[2.5, 0.1, 0.65]} scale={[1, 1.38, 1]}>
                <torusGeometry args={[1.35, 0.06, 32, 64]} />
                <meshPhysicalMaterial color="#d4af37" roughness={0.3} metalness={0.8} transparent opacity={opacity} />
            </mesh>
        </group>
    );
}

// ─────────────────────────────────────────────
// 3. THE CLOUDS (Now with Fading)
// ─────────────────────────────────────────────
function Clouds({ cloudTex }) {
    const c1 = useRef();
    const c2 = useRef();

    useFrame((_, delta) => {
        const progress = useScrollStore.getState().scrollProgress;
        if (progress > 0.5) return;

        // Calculate fade out (hits 0 opacity around 33% scroll)
        const fadeOut = Math.max(0, 1 - progress * 7);

        if (c1.current) {
            c1.current.position.x -= delta * 0.3;
            if (c1.current.position.x < -15) c1.current.position.x = 15;
            c1.current.material.opacity = fadeOut * 0.8; // Dynamic fade
        }
        if (c2.current) {
            c2.current.position.x -= delta * 0.15;
            if (c2.current.position.x < -15) c2.current.position.x = 15;
            c2.current.material.opacity = fadeOut * 0.4; // Dynamic fade
        }
    });

    return (
        <group position={[3, -1, -8]}>
            <mesh ref={c1} position={[0, 0, 0]} scale={[2.5, 1.8, 1]}>
                <planeGeometry args={[16, 9]} />
                <meshBasicMaterial map={cloudTex} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh ref={c2} position={[8, 1.5, -3]} scale={[3, 2.2, 1]}>
                <planeGeometry args={[16, 9]} />
                <meshBasicMaterial map={cloudTex} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
        </group>
    );
}

// ─────────────────────────────────────────────
// MAIN SCENE
// ─────────────────────────────────────────────
useTexture.preload('/sky_gradient.webp');
useTexture.preload('/cloud_alpha.webp');

export default function PlaneScene() {
    const skyTex = useTexture('/sky_gradient.webp');
    const cloudTex = useTexture('/cloud_alpha.webp');

    // We use refs to manually update opacity without causing React to re-render the whole component
    const planeGroupRef = useRef();
    const skyMatRef = useRef();

    useFrame(() => {
        const progress = useScrollStore.getState().scrollProgress;

        // Fade the plane out quickly between 0.1 and 0.4 scroll progress
        let opacity = 1;
        if (progress > 0.1) {
            opacity = Math.max(0, 1 - (progress - 0.1) * 3);
        }

        // Apply opacity to all meshes inside the plane group
        if (planeGroupRef.current) {
            planeGroupRef.current.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.opacity = opacity;
                }
            });
        }

        // Fade the sky out slightly later
        if (skyMatRef.current) {
            skyMatRef.current.opacity = Math.max(0, 1 - progress * 2);
        }
    });

    return (
        <group>
            {/* Studio Lighting Setup */}
            <ambientLight intensity={0.2} color="#ffffff" />
            <directionalLight position={[10, 5, -5]} intensity={1.5} color="#ffedd6" />
            <pointLight position={[-3, 3, 3]} intensity={0.5} color="#ffffff" distance={10} decay={2} />

            {/* The Plane Group (Gets faded out together) */}
            <group ref={planeGroupRef}>
                <CabinInterior opacity={1} />
                <Wing opacity={1} />
            </group>

            <Clouds cloudTex={cloudTex} />

            {/* Sky */}
            <mesh position={[0, 0, -25]}>
                <planeGeometry args={[80, 50]} />
                <meshBasicMaterial ref={skyMatRef} map={skyTex} transparent depthWrite={false} opacity={1} />
            </mesh>
        </group>
    );
}