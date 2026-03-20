import { useState, useRef } from 'react';
import { Card, Slider, ColorPicker, Typography, Space, Divider } from 'antd';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const { Text } = Typography;

function RotatingModel(props: any) {
    const mesh = useRef<THREE.Mesh>(null!);
    useFrame((_, delta) => {
        if (mesh.current) {
            mesh.current.rotation.y += delta * 0.2;
            mesh.current.rotation.x += delta * 0.1;
        }
    });

    return (
        <mesh ref={mesh} {...props} castShadow receiveShadow>
            <torusKnotGeometry args={[1.2, 0.4, 128, 32]} />
            <meshStandardMaterial roughness={0.1} metalness={0.8} />
        </mesh>
    );
}

export default function ModelPreviewPage() {
    const [lightIntensity, setLightIntensity] = useState(4);
    const [ambientIntensity, setAmbientIntensity] = useState(0.5);
    const [lightColor, setLightColor] = useState<any>('#ffffff');
    const [lightPos, setLightPos] = useState({ x: 5, y: 5, z: 5 });

    const colorStr = typeof lightColor === 'string' ? lightColor : lightColor.toHexString();

    return (
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)] min-h-[600px]">
            {/* 3D Canvas Area */}
            <div className="flex-1 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black relative shadow-2xl shadow-indigo-500/10 border border-gray-800">
                <Canvas camera={{ position: [0, 0, 8], fov: 45 }} shadows>
                    <ambientLight intensity={ambientIntensity} />

                    <directionalLight
                        castShadow
                        position={[lightPos.x, lightPos.y, lightPos.z]}
                        intensity={lightIntensity}
                        color={colorStr}
                        shadow-mapSize={[1024, 1024]}
                    >
                        <orthographicCamera attach="shadow-camera" args={[-5, 5, 5, -5]} />
                    </directionalLight>

                    <RotatingModel position={[0, 0.5, 0]} />

                    <ContactShadows position={[0, -2, 0]} opacity={0.6} scale={20} blur={2} far={4} />
                    <Environment preset="studio" />
                    <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
                </Canvas>
                <div className="absolute top-6 left-6 pointer-events-none">
                    <h2 className="text-2xl font-bold tracking-tight text-white mb-1 drop-shadow-md">Advanced Rendering</h2>
                    <p className="text-gray-300 drop-shadow-md">Real-time light & shadow simulation</p>
                </div>
            </div>

            {/* Control Panel Area */}
            <Card
                className="w-full md:w-[360px] h-full shadow-xl border-gray-800 bg-[#141414] overflow-auto flex-shrink-0"
                title={<span className="text-gray-200">Lighting Controls</span>}
                styles={{ body: { padding: '24px' } }}
            >
                <Space direction="vertical" size="large" className="w-full">
                    <div>
                        <div className="flex justify-between mb-2">
                            <Text className="text-gray-400">Directional Intensity</Text>
                            <Text className="text-indigo-400 font-mono">{lightIntensity.toFixed(1)}</Text>
                        </div>
                        <Slider min={0} max={10} step={0.1} value={lightIntensity} onChange={setLightIntensity} tooltip={{ formatter: null }} />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <Text className="text-gray-400">Ambient Intensity</Text>
                            <Text className="text-indigo-400 font-mono">{ambientIntensity.toFixed(1)}</Text>
                        </div>
                        <Slider min={0} max={3} step={0.1} value={ambientIntensity} onChange={setAmbientIntensity} tooltip={{ formatter: null }} />
                    </div>

                    <Divider className="border-gray-800 my-2" />

                    <div>
                        <Text className="text-gray-400 block mb-2">Light Position (XYZ)</Text>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Text className="text-xs text-gray-500 mb-1 block">X: {lightPos.x}</Text>
                                <Slider min={-10} max={10} value={lightPos.x} onChange={(v) => setLightPos(p => ({ ...p, x: v }))} tooltip={{ formatter: null }} />
                            </div>
                            <div className="flex-1">
                                <Text className="text-xs text-gray-500 mb-1 block">Y: {lightPos.y}</Text>
                                <Slider min={-10} max={10} value={lightPos.y} onChange={(v) => setLightPos(p => ({ ...p, y: v }))} tooltip={{ formatter: null }} />
                            </div>
                            <div className="flex-1">
                                <Text className="text-xs text-gray-500 mb-1 block">Z: {lightPos.z}</Text>
                                <Slider min={-10} max={10} value={lightPos.z} onChange={(v) => setLightPos(p => ({ ...p, z: v }))} tooltip={{ formatter: null }} />
                            </div>
                        </div>
                    </div>

                    <Divider className="border-gray-800 my-2" />

                    <div>
                        <Text className="text-gray-400 block mb-3">Light Color</Text>
                        <ColorPicker
                            value={lightColor}
                            onChange={(color) => setLightColor(color)}
                            showText
                            disabledAlpha
                            className="w-full bg-[#1f1f1f] border-gray-700"
                        />
                    </div>
                </Space>
            </Card>
        </div>
    );
}
