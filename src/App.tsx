import { useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ConfigProvider, Layout, Menu, Typography, theme } from 'antd';
import { AppstoreOutlined, DashboardOutlined } from '@ant-design/icons';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const { Header, Sider, Content } = Layout;
const { Title, Paragraph } = Typography;

function Box(props: any) {
  const mesh = useRef<THREE.Mesh>(null!);
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);

  useFrame((_, delta) => {
    mesh.current.rotation.x += delta * 0.5;
    mesh.current.rotation.y += delta * 0.5;
  });

  return (
    <mesh
      {...props}
      ref={mesh}
      scale={active ? 1.5 : 1}
      onClick={() => setActive(!active)}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? '#1677ff' : '#4096ff'} roughness={0.2} metalness={0.8} />
    </mesh>
  );
}

function DashboardScene() {
  return (
    <div className="h-full w-full rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-black relative shadow-2xl shadow-indigo-500/20">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
        <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />

        <Box position={[-1.2, 0, 0]} />
        <Box position={[1.2, 0, 0]} />

        <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={20} blur={2.5} far={4.5} />
        <Environment preset="city" />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>

      <div className="absolute bottom-8 left-8 pointer-events-none text-white">
        <h2 className="text-4xl font-bold tracking-tight mb-2 opacity-90">Dynamic 3D Visualization</h2>
        <p className="text-lg opacity-70">Powered by Three.js & React Three Fiber</p>
      </div>
    </div>
  );
}

function Tools() {
  return (
    <div className="p-8">
      <Title level={2}>Life Tools</Title>
      <Paragraph>
        Welcome to your collection of life tools. Select a dashboard to begin.
      </Paragraph>
    </div>
  );
}

function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#646cff',
          borderRadius: 8,
          fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
        },
      }}
    >
      <BrowserRouter>
        <Layout className="min-h-screen">
          <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)} className="border-r border-gray-800">
            <div className="h-16 flex items-center justify-center font-bold text-xl text-white tracking-widest bg-black/20">
              {collapsed ? 'LT' : 'LIFE TOOLS'}
            </div>
            <Menu
              theme="dark"
              defaultSelectedKeys={['1']}
              mode="inline"
              items={[
                {
                  key: '1',
                  icon: <DashboardOutlined />,
                  label: <Link to="/">Dashboard</Link>,
                },
                {
                  key: '2',
                  icon: <AppstoreOutlined />,
                  label: <Link to="/tools">Tools</Link>,
                },
              ]}
            />
          </Sider>

          <Layout>
            <Header className="bg-transparent backdrop-blur-md border-b border-gray-800 px-8 flex items-center">
              <Title level={4} className="!mb-0 !text-gray-200 font-medium">Platform Overview</Title>
            </Header>
            <Content className="p-6 bg-[#141414]">
              <Routes>
                <Route path="/" element={<DashboardScene />} />
                <Route path="/tools" element={<Tools />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
