import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, PresentationControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useScrollStore, countriesData } from './store';

// Convert lat/long to 3D point on a sphere of given radius
function latLongToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));

    return new THREE.Vector3(x, y, z);
}

function CountryPin({ data, globeRadius }) {
    const { id, lat, lon, name, flag, stat } = data;
    const position = useMemo(() => latLongToVector3(lat, lon, globeRadius), [lat, lon, globeRadius]);
    const setHoveredCountry = useScrollStore(state => state.setHoveredCountry);
    const hoveredCountry = useScrollStore(state => state.hoveredCountry);
    const setSelectedCountry = useScrollStore(state => state.setSelectedCountry);
    const isHovered = hoveredCountry === id;

    return (
        <group position={position}>
            {/* The Pin Marker */}
            <mesh
                onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; setHoveredCountry(id); }}
                onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = 'auto'; setHoveredCountry(null); }}
                onClick={(e) => { e.stopPropagation(); setSelectedCountry(id); }}
            >
                <sphereGeometry args={[0.06, 16, 16]} />
                {/* Swapped to StandardMaterial with emissive properties for Bloom */}
                <meshStandardMaterial
                    color={isHovered ? "#ffffff" : "#d4af37"}
                    emissive={isHovered ? "#ffffff" : "#d4af37"}
                    emissiveIntensity={isHovered ? 2.0 : 0.5}
                />
            </mesh>
            {/* The Pulse Glow */}
            <mesh scale={isHovered ? 2.5 : 1.5}>
                <sphereGeometry args={[0.06, 16, 16]} />
                <meshBasicMaterial color="#d4af37" transparent opacity={isHovered ? 0.6 : 0.2} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>

            {/* Tooltip via Text/HTML */}
            {isHovered && (
                <Html center position={[0, 0.2, 0]} className="no-pointer">
                    <div style={{
                        background: 'rgba(10, 10, 10, 0.85)',
                        backdropFilter: 'blur(8px)',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid rgba(212, 175, 55, 0.4)',
                        color: 'white',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        transform: 'translateY(-20px)',
                        pointerEvents: 'none'
                    }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '4px' }}>
                            {flag} {name}
                        </div>
                        <div style={{ color: '#d4af37', fontSize: '0.9rem' }}>
                            {stat}
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
}

export default function GlobeScene() {
    const globeObjRef = useRef();
    const bumpMap = useTexture('/earth_bump.jpg');
    const specularMap = useTexture('/earth_specular.jpg');
    const scrollProgress = useScrollStore(state => state.scrollProgress);
    const hoveredCountry = useScrollStore(state => state.hoveredCountry);
    const selectedCountry = useScrollStore(state => state.selectedCountry);

    const targetQuaternion = useRef(new THREE.Quaternion());

    // Entrance animation values
    const scale = THREE.MathUtils.lerp(0.6, 1.0, scrollProgress);
    const yOffset = THREE.MathUtils.lerp(-35, -15, scrollProgress); // Rises from deep off-screen into frame

    useFrame((_, delta) => {
        if (globeObjRef.current) {
            if (selectedCountry) {
                const country = countriesData.find(c => c.id === selectedCountry);
                if (country) {
                    // 1. Y-Axis (Longitude): Subtract 90 degrees, then subtract the country's longitude.
                    // The +0.25 rad offset compensates for the globe being on the left side of the screen,
                    // making the pin stare directly into the camera lens.
                    const targetY = THREE.MathUtils.degToRad(-90 - country.lon) + 0.25;

                    // 2. X-Axis (Latitude): Tilt the globe by the country's latitude to bring it to the equator.
                    // Subtract 0.4 rad to perfectly cancel out the Earth's axial tilt from the parent group.
                    const targetX = THREE.MathUtils.degToRad(country.lat) - 0.4;

                    // 3. Strict YXZ Order: This is critical. It forces the globe to spin left/right FIRST, 
                    // and tilt SECOND. If you don't use YXZ, the North Pole will twist sideways.
                    targetQuaternion.current.setFromEuler(new THREE.Euler(targetX, targetY, 0, 'YXZ'));

                    // Smoothly animate the rotation
                    globeObjRef.current.quaternion.slerp(targetQuaternion.current, delta * 4.0);
                }
            } else if (!hoveredCountry) {
                // Auto-rotation seamlessly resumes
                globeObjRef.current.rotation.y += delta * 0.15;

                // Gently reset the X and Z tilts back to normal if the user previously clicked a pin
                globeObjRef.current.rotation.x = THREE.MathUtils.lerp(globeObjRef.current.rotation.x, 0, delta * 2);
                globeObjRef.current.rotation.z = THREE.MathUtils.lerp(globeObjRef.current.rotation.z, 0, delta * 2);
            }
        }
    });

    return (
        <group position={[-2.2, yOffset, 0]} scale={scale}>
            {/* Subtle glow behind the globe */}
            <mesh position={[0, 0, -3]}>
                <planeGeometry args={[15, 15]} />
                <meshBasicMaterial color="#d4af37" transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>

            {/* ── GLOBE LIGHTING ── */}
            <directionalLight position={[5, 3, 5]} intensity={3.0} color="#ffffff" castShadow />
            <pointLight position={[-5, -2, 2]} intensity={2.5} color="#d4af37" distance={15} />

            <PresentationControls
                global={false}
                cursor={true}
                snap={false}
                speed={1.5}
                zoom={1}
                rotation={[0, 0, 0]}
                polar={[-Math.PI / 4, Math.PI / 4]}    // Restrict vertical rotation
                azimuth={[-Infinity, Infinity]} // Allow infinite horizontal spin
                config={{ mass: 1, tension: 170, friction: 26 }} // Momentum dragging
            >
                {/* 23.5 degree tilt applied to parent so PresentationControls rotates within this frame */}
                <group rotation={[0.4, 0, 0]}>
                    {/* ── THE MINIMALIST GLOBE ── */}
                    <group ref={globeObjRef}>
                        {/* The Sphere */}
                        <mesh>
                            <sphereGeometry args={[2.5, 64, 64]} />
                            <meshPhysicalMaterial
                                color="#0a0f16" // Rich dark carbon aesthetic
                                roughness={0.6}
                                metalness={1}
                                metalnessMap={specularMap} // Specular map dictates reflections (land vs ocean)
                                bumpMap={bumpMap}
                                bumpScale={0.015}
                                clearcoat={0.3}
                                clearcoatRoughness={0.4}
                            />
                        </mesh>

                        {/* Countries Markers */}
                        {countriesData.map((data) => (
                            <CountryPin key={data.id} data={data} globeRadius={2.53} />
                        ))}

                        {/* A subtle wireframe overlay representing lat/long lines precisely */}
                        <mesh rotation={[0, Math.PI / 2, 0]}>
                            <sphereGeometry args={[2.505, 32, 24]} />
                            <meshBasicMaterial color="#ffffff" wireframe={true} transparent opacity={0.03} />
                        </mesh>
                    </group>
                </group>
            </PresentationControls>

            {/* ── THE MODERN ARCHITECTURAL STAND ── */}
            {/* Base Pillar must NOT rotate with the globe */}
            <group position={[0, -2.6, 0]}>
                {/* Full Ring around the equator */}
                <mesh rotation={[0.4, 0, 0]}>
                    <torusGeometry args={[2.75, 0.04, 16, 64]} />
                    <meshPhysicalMaterial color="#d4af37" roughness={0.2} metalness={0.9} />
                </mesh>

                {/* The Base Pillar */}
                <mesh position={[0, -1.0, 0]}>
                    <cylinderGeometry args={[0.15, 0.3, 2, 32]} />
                    <meshPhysicalMaterial color="#050505" roughness={0.9} metalness={0.1} />
                </mesh>

                {/* The Heavy Base Plate */}
                <mesh position={[0, -2.0, 0]}>
                    <cylinderGeometry args={[1.6, 1.8, 0.2, 64]} />
                    <meshPhysicalMaterial color="#050505" roughness={0.9} metalness={0.1} />
                </mesh>
            </group>
        </group>
    );
}