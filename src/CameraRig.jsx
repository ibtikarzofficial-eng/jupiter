import { useFrame } from '@react-three/fiber';
import { useScrollStore } from './store';
import * as THREE from 'three';
import { useRef } from 'react';

export default function CameraRig() {
    const scrollProgress = useScrollStore((state) => state.scrollProgress);
    const smoothed = useRef({ x: 0, y: 0 });

    useFrame((state) => {
        const isMobile = state.size.width < 768;
        const multiplier = 1;
        smoothed.current.x += (state.pointer.x - smoothed.current.x) * 0.05;
        smoothed.current.y += (state.pointer.y - smoothed.current.y) * 0.05;

        let targetY, targetZ, targetRotX;

        // STAGE 1: Lean INTO the window (0 to 0.3)
        // Instead of zooming out to expose the fake wall, we push in closer.
        if (scrollProgress < 0.3) {
            const t = scrollProgress / 0.3;
            targetY = THREE.MathUtils.lerp(0, -0.5, t);
            targetZ = THREE.MathUtils.lerp(isMobile ? 8.5 : 6.5, isMobile ? 6.5 : 4.5, t); // Pushing IN from 6.5 to 4.5
            targetRotX = THREE.MathUtils.lerp(0, -0.05, t);
        }
        // STAGE 2: The Fall (0.3 to 0.6)
        // The plane fades out around us while we fall through the clouds
        else if (scrollProgress < 0.6) {
            const t = (scrollProgress - 0.3) / 0.3;
            targetY = THREE.MathUtils.lerp(-0.5, -6, t);
            targetZ = THREE.MathUtils.lerp(isMobile ? 6.5 : 4.5, isMobile ? 10 : 8, t); // Pull back slightly in the void
            targetRotX = THREE.MathUtils.lerp(-0.05, -0.15, t);
        }
        // STAGE 3: Land on the Globe (0.6 to 1.0)
        else {
            const t = (scrollProgress - 0.6) / 0.4;
            targetY = THREE.MathUtils.lerp(-6, isMobile ? -13.5 : -14.2, t);
            targetZ = THREE.MathUtils.lerp(isMobile ? 10 : 8, isMobile ? 9.5 : 6.5, t); // Lock tight onto the globe
            targetRotX = THREE.MathUtils.lerp(-0.15, -0.2, t);
        }

        state.camera.position.y = targetY;
        state.camera.position.z = targetZ;
        state.camera.rotation.x = targetRotX + (smoothed.current.y * -0.03 * multiplier);
        state.camera.rotation.y = smoothed.current.x * 0.05 * multiplier;
    });

    return null;
}