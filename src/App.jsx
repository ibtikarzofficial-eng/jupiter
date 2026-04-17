import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Loader } from '@react-three/drei'; // <-- Added Loader
import PlaneScene from './PlaneScene';
import GlobeScene from './GlobeScene';
import ScrollManager from './ScrollManager';
import CameraRig from './CameraRig';
import { useScrollStore, countriesData } from './store';
import './index.css';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';

export default function App() {
  const scrollProgress = useScrollStore((state) => state.scrollProgress);
  const selectedCountry = useScrollStore((state) => state.selectedCountry);
  const hoveredCountry = useScrollStore((state) => state.hoveredCountry);
  const setSelectedCountry = useScrollStore((state) => state.setSelectedCountry);
  const setHoveredCountry = useScrollStore((state) => state.setHoveredCountry);

  return (
    <>
      {/* ───────────────────────────────────────────── */}
      {/* BUG FIX: Moved ScrollManager OUTSIDE the Canvas */}
      {/* Now GSAP tracks scrolling instantly, even if 3D assets take 2 seconds to load */}
      <ScrollManager />
      {/* ───────────────────────────────────────────── */}

      {/* LAYER 1: THE SCROLL RUNWAY */}
      <div id="scroll-container" style={{
        opacity: 1 - scrollProgress * 4,
        visibility: scrollProgress > 0.25 ? 'hidden' : 'visible',
        transition: 'opacity 0.5s ease-out, visibility 0.5s ease-out',
        width: '100%', height: '300vh', position: 'absolute', top: 0, left: 0, zIndex: 0
      }} />

      {/* LAYER 2: THE FIXED UI (Section 1) */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '50%', height: '100vh',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '0 5% 0 10%', zIndex: 10, pointerEvents: 'none',
        transition: 'opacity 0.2s',
        opacity: 1 - Math.min(scrollProgress * 2, 1),
        transform: `translateY(${-(scrollProgress * 50)}px)`
      }}>
        <h1 style={{ color: '#e6e6e6ff', fontSize: '4.5rem', lineHeight: '1.05', margin: '0 0 20px 0', fontWeight: '700', letterSpacing: '-0.02em' }}>
          Your Gateway to<br />Global Opportunities
        </h1>
        <p style={{ color: '#555555', fontSize: '1.25rem', maxWidth: '80%', fontWeight: '300', lineHeight: '1.5', letterSpacing: '0.01em' }}>
          Exclusive consultation for seamless international transitions. We handle the complexity so you can enjoy the flight.
        </p>
        <button className="apple-btn" style={{
          marginTop: '40px', padding: '16px 32px', width: 'fit-content',
          borderRadius: '30px', pointerEvents: 'auto', cursor: 'pointer',
          fontSize: '1.1rem', fontWeight: '600'
        }}>
          Begin Your Journey
        </button>
      </div>

      {/* LAYER 2.5: THE SECTION 2 UI */}
      <div style={{
        position: 'fixed', top: 0, right: 0, width: '40%', height: '100vh',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'flex-start', padding: '0 5% 0 0', zIndex: 10,
        opacity: Math.max((scrollProgress - 0.5) * 2, 0),
        transform: `translateY(${(1 - Math.max((scrollProgress - 0.5) * 2, 0)) * 50}px)`,
        transition: 'opacity 0.2s, transform 0.2s',
        pointerEvents: scrollProgress > 0.6 ? 'auto' : 'none'
      }}>
        <div style={{ textAlign: 'left', marginBottom: '30px' }}>
          <h2 style={{ color: '#ffffff', fontSize: '3.2rem', fontWeight: '700', letterSpacing: '-0.02em', margin: 0 }}>
            Global Destinations
          </h2>
          <p style={{ color: '#8892b0', fontSize: '1.1rem', marginTop: '10px', fontWeight: '400' }}>
            Select a location to explore opportunities.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '380px' }}>
          {countriesData.map(country => {
            const isActive = selectedCountry === country.id || hoveredCountry === country.id;
            return (
              <div key={country.id}
                onClick={() => setSelectedCountry(country.id)}
                onMouseEnter={() => setHoveredCountry(country.id)}
                onMouseLeave={() => setHoveredCountry(null)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 20px', cursor: 'pointer',
                  background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'rgba(10, 15, 25, 0.4)',
                  border: isActive ? '1px solid rgba(212, 175, 55, 0.5)' : '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px', backdropFilter: 'blur(12px)',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  transform: isActive ? 'translateX(-8px)' : 'translateX(0)',
                  boxShadow: isActive ? '0 8px 24px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: '600', color: isActive ? '#ffffff' : '#ccd6f6', transition: 'color 0.3s' }}>
                    {country.name}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '500', color: '#d4af37', opacity: isActive ? 1 : 0.6, transition: 'opacity 0.3s' }}>
                    {country.stat}
                  </span>
                </div>
                <div style={{ color: '#d4af37', transition: 'all 0.3s', transform: isActive ? 'rotate(0deg)' : 'rotate(-45deg)', opacity: isActive ? 1 : 0 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LAYER 3: THE FIXED 3D CANVAS */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1, pointerEvents: 'auto', touchAction: 'none',
        backgroundColor: `rgba(11, 14, 20, ${Math.min(1, scrollProgress * 2.5)})`
      }}>
        <Canvas camera={{ position: [0, 0, 6.5], fov: 55 }}>
          <Suspense fallback={null}>
            <Environment preset="city" />
            <ScrollManager />
            <CameraRig />
            <PlaneScene />
            <GlobeScene />

            {/* ── THE APPLE-TIER POLISH ── */}
            <EffectComposer disableNormalPass>
              {/* Makes the bright gold and white elements physically glow */}
              <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.2} />
              {/* Adds microscopic cinematic texture, blending DOM and WebGL */}
              <Noise opacity={0.03} />
              {/* Darkens the corners slightly for a moody, premium feel */}
              <Vignette eskil={false} offset={0.1} darkness={1.1} />
            </EffectComposer>

          </Suspense>
        </Canvas>
      </div>

      {/* ───────────────────────────────────────────── */}
      {/* THE PRO LOADING SCREEN */}
      {/* If the internet is slow, the user sees this instead of a broken layout */}
      <Loader
        containerStyles={{ backgroundColor: '#000000ff' }}
        innerStyles={{ width: '300px' }}
        barStyles={{ backgroundColor: '#d4af37' }}
        dataInterpolation={(p) => `Loading Zaexis Experience... ${p.toFixed(0)}%`}
      />
    </>
  );
}