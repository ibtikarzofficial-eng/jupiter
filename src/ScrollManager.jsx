import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useScrollStore } from './store';

// Register the GSAP plugin
gsap.registerPlugin(ScrollTrigger);

export default function ScrollManager() {
    const setScrollProgress = useScrollStore((state) => state.setScrollProgress);

    useEffect(() => {
        // We target the massive 300vh invisible div we added to App.jsx
        const trigger = ScrollTrigger.create({
            trigger: "#scroll-container",
            start: "top top",
            end: "bottom bottom",
            scrub: 1, // This adds a slight smoothing delay so the math isn't jittery
            onUpdate: (self) => {
                // self.progress is exactly 0 at the top, and 1 at the very bottom
                setScrollProgress(self.progress);
            }
        });

        // Cleanup when component unmounts
        return () => {
            trigger.kill();
        };
    }, [setScrollProgress]);

    // This component renders nothing to the screen. It just runs the math.
    return null;
}