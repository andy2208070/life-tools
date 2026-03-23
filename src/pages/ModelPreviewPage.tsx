import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import {
    Button, Card, Slider, ColorPicker, Typography, Space, Divider,
    Select, Tooltip, Dropdown, Input, Drawer, Spin, Empty, message, Tag,
} from 'antd';
import type { MenuProps } from 'antd';
import {
    EyeOutlined, EyeInvisibleOutlined, DeleteOutlined,
    PlusOutlined, BulbOutlined, HolderOutlined,
    UploadOutlined, SearchOutlined, GlobalOutlined,
    ImportOutlined,
} from '@ant-design/icons';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const { Text } = Typography;

// ─── Types ───────────────────────────────────────────────────────────────────

type LightType = 'directional' | 'spot' | 'point' | 'ambient';

interface SceneLight {
    id: string;
    type: LightType;
    name: string;
    color: string;
    intensity: number;
    position: [number, number, number];
    visible: boolean;
}

interface SceneModel {
    id: 'model';
    name: string;
    position: [number, number, number];
    visible: boolean;
}

/** A Sketchfab embed layer – shown as iframe overlay on the canvas */
interface SceneSketchfab {
    id: string;
    kind: 'sketchfab';
    name: string;
    uid: string;
    visible: boolean;
}

type SceneObject = SceneModel | SceneLight | SceneSketchfab;

// Sketchfab public API response shape
interface SketchfabResult {
    uid: string;
    name: string;
    thumbnails: { images: { url: string; width: number }[] };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let lightCounter = 1;
const newLight = (type: LightType): SceneLight => ({
    id: `light-${Date.now()}-${lightCounter++}`,
    type,
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} Light`,
    color: '#ffffff',
    intensity: type === 'ambient' ? 0.5 : 3,
    position: [5, 5, 5],
    visible: true,
});

let sfCounter = 1;
const newSketchfab = (uid: string, name: string): SceneSketchfab => ({
    id: `sketchfab-${Date.now()}-${sfCounter++}`,
    kind: 'sketchfab',
    name,
    uid,
    visible: true,
});

const LIGHT_TYPE_LABELS: Record<LightType, string> = {
    directional: '太陽光 (Directional)',
    spot: '聚光燈 (Spot)',
    point: '點光源 (Point)',
    ambient: '環境光 (Ambient)',
};

function isSketchfab(obj: SceneObject): obj is SceneSketchfab {
    return (obj as SceneSketchfab).kind === 'sketchfab';
}

// ─── Scene Components ─────────────────────────────────────────────────────────

function UserModel({
    object,
    model,
    selected,
    onSelect,
    onPositionChange,
    orbitRef,
}: {
    object: THREE.Object3D;
    model: SceneModel;
    selected: boolean;
    onSelect: () => void;
    onPositionChange: (pos: [number, number, number]) => void;
    orbitRef: React.RefObject<any>;
}) {
    const groupRef = useRef<THREE.Group>(null!);

    useEffect(() => {
        if (groupRef.current) {
            const box = new THREE.Box3().setFromObject(groupRef.current);
            const center = new THREE.Vector3();
            box.getCenter(center);
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 3 / maxDim;
            groupRef.current.scale.setScalar(scale);
            groupRef.current.position.sub(center.multiplyScalar(scale));
        }
    }, [object]);

    if (!model.visible) return null;

    return (
        <>
            <group
                ref={groupRef}
                position={model.position}
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
            >
                <primitive object={object} />
            </group>
            {selected && groupRef.current && (
                <TransformControls
                    object={groupRef.current}
                    mode="translate"
                    onMouseDown={() => { if (orbitRef.current) orbitRef.current.enabled = false; }}
                    onMouseUp={() => {
                        if (orbitRef.current) orbitRef.current.enabled = true;
                        if (groupRef.current) {
                            const p = groupRef.current.position;
                            onPositionChange([p.x, p.y, p.z]);
                        }
                    }}
                />
            )}
        </>
    );
}

function ModelMesh({
    model,
    selected,
    onSelect,
    onPositionChange,
    orbitRef,
}: {
    model: SceneModel;
    selected: boolean;
    onSelect: () => void;
    onPositionChange: (pos: [number, number, number]) => void;
    orbitRef: React.RefObject<any>;
}) {
    const meshRef = useRef<THREE.Mesh>(null!);

    return (
        <>
            {model.visible && (
                <mesh
                    ref={meshRef}
                    position={model.position}
                    castShadow
                    receiveShadow
                    onClick={(e) => { e.stopPropagation(); onSelect(); }}
                >
                    <torusKnotGeometry args={[1.2, 0.4, 128, 32]} />
                    <meshStandardMaterial roughness={0.1} metalness={0.8} color={selected ? '#646cff' : '#ffffff'} />
                </mesh>
            )}
            {selected && model.visible && meshRef.current && (
                <TransformControls
                    object={meshRef.current}
                    mode="translate"
                    onMouseDown={() => { if (orbitRef.current) orbitRef.current.enabled = false; }}
                    onMouseUp={() => {
                        if (orbitRef.current) orbitRef.current.enabled = true;
                        if (meshRef.current) {
                            const p = meshRef.current.position;
                            onPositionChange([p.x, p.y, p.z]);
                        }
                    }}
                />
            )}
        </>
    );
}

function LightObject({
    light,
    selected,
    onSelect,
    onPositionChange,
    orbitRef,
}: {
    light: SceneLight;
    selected: boolean;
    onSelect: () => void;
    onPositionChange: (pos: [number, number, number]) => void;
    orbitRef: React.RefObject<any>;
}) {
    const helperRef = useRef<THREE.Mesh>(null!);

    if (!light.visible) return null;

    const color = light.color;
    const intensity = light.intensity;
    const pos = light.position;

    return (
        <>
            {light.type === 'directional' && (
                <directionalLight castShadow position={pos} intensity={intensity} color={color} shadow-mapSize={[1024, 1024]} />
            )}
            {light.type === 'spot' && (
                <spotLight castShadow position={pos} intensity={intensity} color={color} angle={Math.PI / 6} penumbra={0.3} />
            )}
            {light.type === 'point' && (
                <pointLight position={pos} intensity={intensity} color={color} />
            )}
            {light.type === 'ambient' && (
                <ambientLight intensity={intensity} color={color} />
            )}
            {light.type !== 'ambient' && (
                <>
                    <mesh
                        ref={helperRef}
                        position={pos}
                        onClick={(e) => { e.stopPropagation(); onSelect(); }}
                    >
                        <sphereGeometry args={[0.15, 16, 16]} />
                        <meshBasicMaterial color={selected ? '#ffdd00' : color} />
                    </mesh>
                    {selected && helperRef.current && (
                        <TransformControls
                            object={helperRef.current}
                            mode="translate"
                            onMouseDown={() => { if (orbitRef.current) orbitRef.current.enabled = false; }}
                            onMouseUp={() => {
                                if (orbitRef.current) orbitRef.current.enabled = true;
                                if (helperRef.current) {
                                    const p = helperRef.current.position;
                                    onPositionChange([p.x, p.y, p.z]);
                                }
                            }}
                        />
                    )}
                </>
            )}
        </>
    );
}

// ─── GLTF/OBJ Loaders (inside Canvas) ────────────────────────────────────────

function GltfModel({ url, model, selected, onSelect, onPositionChange, orbitRef }: {
    url: string;
    model: SceneModel;
    selected: boolean;
    onSelect: () => void;
    onPositionChange: (pos: [number, number, number]) => void;
    orbitRef: React.RefObject<any>;
}) {
    const gltf = useLoader(GLTFLoader, url);
    return (
        <UserModel
            object={gltf.scene}
            model={model}
            selected={selected}
            onSelect={onSelect}
            onPositionChange={onPositionChange}
            orbitRef={orbitRef}
        />
    );
}

function ObjModel({ url, model, selected, onSelect, onPositionChange, orbitRef }: {
    url: string;
    model: SceneModel;
    selected: boolean;
    onSelect: () => void;
    onPositionChange: (pos: [number, number, number]) => void;
    orbitRef: React.RefObject<any>;
}) {
    const obj = useLoader(OBJLoader, url);
    return (
        <UserModel
            object={obj}
            model={model}
            selected={selected}
            onSelect={onSelect}
            onPositionChange={onPositionChange}
            orbitRef={orbitRef}
        />
    );
}

// ─── Layer Item ───────────────────────────────────────────────────────────────

function LayerItem({
    item,
    isSelected,
    isEditing,
    editValue,
    onSelect,
    onToggleVisibility,
    onDelete,
    onStartEdit,
    onEditChange,
    onEditCommit,
    onEditCancel,
    onDragStart,
    onDragOver,
    onDrop,
    isDragOver,
}: {
    item: SceneObject;
    isSelected: boolean;
    isEditing: boolean;
    editValue: string;
    onSelect: () => void;
    onToggleVisibility: () => void;
    onDelete?: () => void;
    onStartEdit: () => void;
    onEditChange: (v: string) => void;
    onEditCommit: () => void;
    onEditCancel: () => void;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    isDragOver: boolean;
}) {
    const isModel = item.id === 'model';
    const isSf = isSketchfab(item);
    const isVisible = item.visible;

    const icon = isSf ? '🌐' : isModel ? '🧊' : <BulbOutlined className="mr-0.5" />;

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onClick={onSelect}
            style={{
                transition: 'border-color 0.15s, background 0.15s',
                borderTop: isDragOver ? '2px solid #6366f1' : '2px solid transparent',
            }}
            className={`
                flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer
                ${isSelected
                    ? 'bg-indigo-600/30 border border-indigo-500/50'
                    : 'border border-transparent hover:bg-white/5'}
            `}
        >
            {/* Drag handle */}
            <HolderOutlined
                className="text-gray-600 hover:text-gray-300 cursor-grab active:cursor-grabbing flex-shrink-0"
                style={{ fontSize: 12 }}
                onClick={(e) => e.stopPropagation()}
            />

            {/* Eye */}
            <Tooltip title={isVisible ? '隱藏' : '顯示'}>
                <Button
                    type="text"
                    size="small"
                    icon={isVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                    className="!text-gray-400 hover:!text-white !p-0 !w-5 !h-5 !min-w-0 flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
                />
            </Tooltip>

            {/* Name */}
            {isEditing ? (
                <Input
                    size="small"
                    autoFocus
                    value={editValue}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onEditChange(e.target.value)}
                    onPressEnter={onEditCommit}
                    onBlur={onEditCommit}
                    onKeyDown={(e) => { if (e.key === 'Escape') onEditCancel(); }}
                    style={{ flex: 1, height: 20, padding: '0 4px', fontSize: 12 }}
                />
            ) : (
                <Text
                    className={`flex-1 text-xs truncate select-none ${isVisible ? 'text-gray-200' : 'text-gray-600'}`}
                    title={item.name}
                    onDoubleClick={(e) => { e.stopPropagation(); onStartEdit(); }}
                >
                    {icon} {item.name}
                </Text>
            )}

            {/* Delete (non-model items) */}
            {!isModel && onDelete && (
                <Tooltip title="刪除">
                    <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        className="!p-0 !w-4 !h-4 !min-w-0 flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    />
                </Tooltip>
            )}
        </div>
    );
}

// ─── Sketchfab Drawer ─────────────────────────────────────────────────────────

// CORS proxy — wraps any URL so it can be fetched from the browser
const CORS_PROXY = 'https://api.allorigins.win/get?url=';

function SketchfabDrawer({
    open,
    onClose,
    onAddLayer,
}: {
    open: boolean;
    onClose: () => void;
    onAddLayer: (uid: string, name: string) => void;
}) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SketchfabResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [previewUid, setPreviewUid] = useState<string | null>(null);
    const [addedUids, setAddedUids] = useState<Set<string>>(new Set());

    const search = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setResults([]);
        setPreviewUid(null);
        try {
            const targetUrl = `https://api.sketchfab.com/v3/models?type=models&q=${encodeURIComponent(query.trim())}&count=12&sort_by=-likeCount`;
            const proxyUrl = `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;
            const res = await fetch(proxyUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const wrapper = await res.json();
            // allorigins wraps the response body in { contents: "..." }
            const data = JSON.parse(wrapper.contents);
            setResults(data.results ?? []);
            if ((data.results ?? []).length === 0) {
                message.info('沒有找到相關模型，請嘗試其他關鍵字');
            }
        } catch (err) {
            console.error(err);
            message.error('搜尋失敗，請確認網路連線後重試');
        } finally {
            setLoading(false);
        }
    };

    const getThumbnail = (m: SketchfabResult) => {
        const imgs = m.thumbnails?.images ?? [];
        const sorted = [...imgs].sort((a, b) => a.width - b.width);
        // pick medium-sized thumbnail
        return sorted[Math.min(Math.floor(sorted.length / 2), sorted.length - 1)]?.url ?? '';
    };

    const handleAdd = (m: SketchfabResult) => {
        onAddLayer(m.uid, m.name);
        setAddedUids(prev => new Set([...prev, m.uid]));
        message.success(`已加入圖層：${m.name}`);
    };

    return (
        <Drawer
            title={
                <span className="flex items-center gap-2" style={{ color: '#e5e7eb' }}>
                    <GlobalOutlined /> Sketchfab 模型瀏覽
                </span>
            }
            placement="right"
            width={540}
            open={open}
            onClose={() => { onClose(); setPreviewUid(null); }}
            styles={{
                body: { background: '#0f0f0f', padding: 16, overflowY: 'auto' },
                header: { background: '#141414', borderBottom: '1px solid #2a2a2a' },
            }}
        >
            {/* Search bar */}
            <div className="flex gap-2 mb-4">
                <Input
                    placeholder="搜尋 3D 模型… (e.g. chair, sword, robot)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onPressEnter={search}
                    prefix={<SearchOutlined style={{ color: '#6b7280' }} />}
                    style={{ background: '#1f1f1f', borderColor: '#374151', color: '#e5e7eb' }}
                    allowClear
                />
                <Button type="primary" onClick={search} loading={loading} icon={<SearchOutlined />}>
                    搜尋
                </Button>
            </div>

            {/* Inline iframe preview */}
            {previewUid && (
                <div className="mb-4 rounded-xl overflow-hidden border border-indigo-700/50 relative" style={{ height: 300 }}>
                    <iframe
                        src={`https://sketchfab.com/models/${previewUid}/embed?autostart=1&ui_hint=0&dnt=1`}
                        title="Sketchfab Viewer"
                        allow="autoplay; fullscreen; xr-spatial-tracking"
                        style={{ width: '100%', height: '100%', border: 0 }}
                    />
                    <Button
                        size="small"
                        type="default"
                        className="absolute top-2 right-2 opacity-80"
                        onClick={() => setPreviewUid(null)}
                    >
                        ✕ 關閉
                    </Button>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-16">
                    <Spin size="large" />
                </div>
            )}

            {/* Empty state */}
            {!loading && results.length === 0 && !query && (
                <Empty
                    description={<span style={{ color: '#4b5563' }}>輸入關鍵字搜尋 Sketchfab 上的 3D 模型</span>}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            )}

            {/* Results grid */}
            {!loading && results.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                    {results.map((m) => {
                        const isAdded = addedUids.has(m.uid);
                        const isPreviewing = previewUid === m.uid;
                        return (
                            <div
                                key={m.uid}
                                className={`rounded-xl overflow-hidden border transition-all group
                                    ${isPreviewing ? 'border-indigo-500' : 'border-gray-800 hover:border-indigo-500/60'}`}
                            >
                                {/* Thumbnail */}
                                <div
                                    className="relative overflow-hidden cursor-pointer"
                                    style={{ height: 110 }}
                                    onClick={() => setPreviewUid(isPreviewing ? null : m.uid)}
                                >
                                    <img
                                        src={getThumbnail(m)}
                                        alt={m.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                    <div className="absolute bottom-1.5 left-2 text-white text-xs font-medium opacity-80">
                                        {isPreviewing ? '▼ 收起' : '▶ 預覽'}
                                    </div>
                                </div>

                                {/* Info + buttons */}
                                <div className="px-2.5 py-2 bg-[#1a1a1a] flex flex-col gap-1.5">
                                    <p className="text-gray-200 text-xs font-medium truncate" title={m.name}>{m.name}</p>
                                    <Button
                                        size="small"
                                        type={isAdded ? 'default' : 'primary'}
                                        icon={<ImportOutlined />}
                                        block
                                        onClick={() => handleAdd(m)}
                                        disabled={isAdded}
                                        style={{ fontSize: 11 }}
                                    >
                                        {isAdded ? '已加入圖層' : '加入圖層'}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Drawer>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ModelPreviewPage() {
    const orbitRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedId, setSelectedId] = useState<string>('model');

    const [model, setModel] = useState<SceneModel>({
        id: 'model',
        name: 'Torus Knot',
        position: [0, 0.5, 0],
        visible: true,
    });

    const [lights, setLights] = useState<SceneLight[]>([
        {
            id: 'light-default',
            type: 'directional',
            name: '太陽光',
            color: '#ffffff',
            intensity: 4,
            position: [5, 5, 5],
            visible: true,
        },
        {
            id: 'light-ambient-default',
            type: 'ambient',
            name: '環境光',
            color: '#ffffff',
            intensity: 0.5,
            position: [0, 0, 0],
            visible: true,
        },
    ]);

    // Sketchfab embed layers
    const [sfLayers, setSfLayers] = useState<SceneSketchfab[]>([]);

    // Layer order
    const [layerOrder, setLayerOrder] = useState<string[]>(['model', 'light-default', 'light-ambient-default']);

    // Drag state
    const dragIdRef = useRef<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    // Inline editing
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    // Uploaded model
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [uploadedType, setUploadedType] = useState<'gltf' | 'obj' | null>(null);

    // Sketchfab drawer
    const [sketchfabOpen, setSketchfabOpen] = useState(false);

    // ── helpers ──────────────────────────────────────────────────────────────

    const updateLight = useCallback((id: string, patch: Partial<SceneLight>) => {
        setLights(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
    }, []);

    const addLight = useCallback((type: LightType) => {
        const light = newLight(type);
        setLights(prev => [...prev, light]);
        setLayerOrder(prev => [...prev, light.id]);
        setSelectedId(light.id);
    }, []);

    const removeLight = useCallback((id: string) => {
        setLights(prev => prev.filter(l => l.id !== id));
        setLayerOrder(prev => prev.filter(lid => lid !== id));
        setSelectedId(sel => sel === id ? 'model' : sel);
    }, []);

    const addSketchfabLayer = useCallback((uid: string, name: string) => {
        const sf = newSketchfab(uid, name);
        setSfLayers(prev => [...prev, sf]);
        setLayerOrder(prev => [...prev, sf.id]);
        setSelectedId(sf.id);
    }, []);

    const removeSketchfabLayer = useCallback((id: string) => {
        setSfLayers(prev => prev.filter(s => s.id !== id));
        setLayerOrder(prev => prev.filter(lid => lid !== id));
        setSelectedId(sel => sel === id ? 'model' : sel);
    }, []);

    const toggleVisibility = useCallback((id: string, allSf: SceneSketchfab[]) => {
        if (id === 'model') {
            setModel(m => ({ ...m, visible: !m.visible }));
        } else if (allSf.find(s => s.id === id)) {
            setSfLayers(prev => prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
        } else {
            setLights(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
        }
    }, []);

    const renameItem = useCallback((id: string, name: string, allSf: SceneSketchfab[]) => {
        if (!name.trim()) return;
        if (id === 'model') {
            setModel(m => ({ ...m, name: name.trim() }));
        } else if (allSf.find(s => s.id === id)) {
            setSfLayers(prev => prev.map(s => s.id === id ? { ...s, name: name.trim() } : s));
        } else {
            updateLight(id, { name: name.trim() });
        }
    }, [updateLight]);

    // ── drag-and-drop ─────────────────────────────────────────────────────────

    const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
        dragIdRef.current = id;
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverId(id);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        setDragOverId(null);
        const fromId = dragIdRef.current;
        if (!fromId || fromId === targetId) return;
        setLayerOrder(prev => {
            const arr = [...prev];
            const fromIdx = arr.indexOf(fromId);
            const toIdx = arr.indexOf(targetId);
            if (fromIdx < 0 || toIdx < 0) return prev;
            arr.splice(fromIdx, 1);
            arr.splice(toIdx, 0, fromId);
            return arr;
        });
        dragIdRef.current = null;
    }, []);

    // ── file upload ───────────────────────────────────────────────────────────

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!['glb', 'gltf', 'obj'].includes(ext ?? '')) {
            message.error('僅支援 .glb、.gltf、.obj 格式');
            return;
        }
        if (uploadedUrl) URL.revokeObjectURL(uploadedUrl);
        const url = URL.createObjectURL(file);
        setUploadedUrl(url);
        setUploadedType(ext === 'obj' ? 'obj' : 'gltf');
        const name = file.name.replace(/\.[^/.]+$/, '');
        setModel(m => ({ ...m, name }));
        message.success(`已載入：${file.name}`);
        e.target.value = '';
    }, [uploadedUrl]);

    // ── build object map ──────────────────────────────────────────────────────

    const objectMap = new Map<string, SceneObject>();
    objectMap.set('model', model);
    lights.forEach(l => objectMap.set(l.id, l));
    sfLayers.forEach(s => objectMap.set(s.id, s));

    const orderedItems = layerOrder
        .filter(id => objectMap.has(id))
        .map(id => objectMap.get(id)!);

    // ── active Sketchfab embed (selected + visible sf layer) ──────────────────
    const activeSfLayer = sfLayers.find(s => s.id === selectedId && s.visible)
        ?? sfLayers.find(s => s.visible); // fallback: first visible sf layer if any sf is selected

    // Only show overlay when the selected item IS a sf layer
    const showSfOverlay = selectedId !== 'model'
        && sfLayers.some(s => s.id === selectedId)
        && sfLayers.find(s => s.id === selectedId)?.visible;

    const overlaySf = sfLayers.find(s => s.id === selectedId);

    // ── selected light ────────────────────────────────────────────────────────
    const selectedLight = !sfLayers.find(s => s.id === selectedId) && selectedId !== 'model'
        ? lights.find(l => l.id === selectedId)
        : null;

    const selectedSf = sfLayers.find(s => s.id === selectedId) ?? null;

    // ── add light menu ────────────────────────────────────────────────────────
    const addLightMenuItems: MenuProps['items'] = (
        ['directional', 'spot', 'point', 'ambient'] as LightType[]
    ).map(type => ({
        key: type,
        label: LIGHT_TYPE_LABELS[type],
        onClick: () => addLight(type),
    }));

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="flex gap-4 h-[calc(100vh-140px)] min-h-[600px]">

            {/* ── Layer Panel ── */}
            <div className="w-[220px] flex-shrink-0 flex flex-col gap-2">
                {/* Header */}
                <div className="flex items-center justify-between px-2 py-1.5 gap-1">
                    <Text className="text-gray-300 font-semibold text-sm tracking-wide">圖層</Text>
                    <div className="flex gap-1 flex-wrap justify-end">
                        <Tooltip title="上傳本地 3D 模型 (.glb/.gltf/.obj)">
                            <Button
                                size="small"
                                icon={<UploadOutlined />}
                                onClick={() => fileInputRef.current?.click()}
                            />
                        </Tooltip>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".glb,.gltf,.obj"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />

                        <Tooltip title="瀏覽 Sketchfab 模型">
                            <Button
                                size="small"
                                icon={<GlobalOutlined />}
                                onClick={() => setSketchfabOpen(true)}
                            />
                        </Tooltip>

                        <Dropdown menu={{ items: addLightMenuItems }} trigger={['click']} placement="bottomRight">
                            <Tooltip title="加入光源">
                                <Button size="small" type="primary" icon={<PlusOutlined />} />
                            </Tooltip>
                        </Dropdown>
                    </div>
                </div>

                {/* Layers */}
                <div
                    className="flex-1 overflow-y-auto flex flex-col gap-1"
                    onDragLeave={() => setDragOverId(null)}
                    onDragEnd={() => { setDragOverId(null); dragIdRef.current = null; }}
                >
                    {orderedItems.map((item) => (
                        <LayerItem
                            key={item.id}
                            item={item}
                            isSelected={item.id === selectedId}
                            isEditing={editingId === item.id}
                            editValue={editValue}
                            onSelect={() => setSelectedId(item.id)}
                            onToggleVisibility={() => toggleVisibility(item.id, sfLayers)}
                            onDelete={
                                item.id !== 'model'
                                    ? () => {
                                        if (isSketchfab(item)) removeSketchfabLayer(item.id);
                                        else removeLight(item.id);
                                    }
                                    : undefined
                            }
                            onStartEdit={() => { setEditingId(item.id); setEditValue(item.name); }}
                            onEditChange={setEditValue}
                            onEditCommit={() => { renameItem(item.id, editValue, sfLayers); setEditingId(null); }}
                            onEditCancel={() => setEditingId(null)}
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onDragOver={(e) => handleDragOver(e, item.id)}
                            onDrop={(e) => handleDrop(e, item.id)}
                            isDragOver={dragOverId === item.id}
                        />
                    ))}
                </div>
            </div>

            {/* ── 3D Canvas + Sketchfab overlay ── */}
            <div className="flex-1 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black relative shadow-2xl shadow-indigo-500/10 border border-gray-800">

                {/* Three.js scene (always mounted, hidden behind SF overlay when needed) */}
                <Canvas
                    camera={{ position: [0, 0, 8], fov: 45 }}
                    shadows
                    onPointerMissed={() => setSelectedId('')}
                    style={{ position: 'absolute', inset: 0 }}
                >
                    <Suspense fallback={null}>
                        {uploadedUrl && uploadedType === 'gltf' ? (
                            <GltfModel
                                url={uploadedUrl}
                                model={model}
                                selected={selectedId === 'model'}
                                onSelect={() => setSelectedId('model')}
                                onPositionChange={(pos) => setModel(m => ({ ...m, position: pos }))}
                                orbitRef={orbitRef}
                            />
                        ) : uploadedUrl && uploadedType === 'obj' ? (
                            <ObjModel
                                url={uploadedUrl}
                                model={model}
                                selected={selectedId === 'model'}
                                onSelect={() => setSelectedId('model')}
                                onPositionChange={(pos) => setModel(m => ({ ...m, position: pos }))}
                                orbitRef={orbitRef}
                            />
                        ) : (
                            <ModelMesh
                                model={model}
                                selected={selectedId === 'model'}
                                onSelect={() => setSelectedId('model')}
                                onPositionChange={(pos) => setModel(m => ({ ...m, position: pos }))}
                                orbitRef={orbitRef}
                            />
                        )}
                    </Suspense>

                    {lights.map(light => (
                        <LightObject
                            key={light.id}
                            light={light}
                            selected={selectedId === light.id}
                            onSelect={() => setSelectedId(light.id)}
                            onPositionChange={(pos) => updateLight(light.id, { position: pos })}
                            orbitRef={orbitRef}
                        />
                    ))}

                    <ContactShadows position={[0, -2, 0]} opacity={0.6} scale={20} blur={2} far={4} />
                    <Environment preset="studio" />
                    <OrbitControls ref={orbitRef} makeDefault />
                </Canvas>

                {/* Sketchfab iframe overlay — shown only when a SF layer is selected & visible */}
                {showSfOverlay && overlaySf && (
                    <div
                        className="absolute inset-0 z-10 flex flex-col"
                        style={{ background: '#0a0a0a' }}
                    >
                        {/* Bar */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-black/70 border-b border-gray-800 flex-shrink-0">
                            <GlobalOutlined style={{ color: '#818cf8' }} />
                            <span className="text-gray-200 text-sm font-medium flex-1 truncate">
                                {overlaySf.name}
                            </span>
                            <Tag color="indigo">Sketchfab</Tag>
                            <Button
                                size="small"
                                icon={<EyeInvisibleOutlined />}
                                onClick={() => toggleVisibility(overlaySf.id, sfLayers)}
                            >
                                隱藏
                            </Button>
                            <Button
                                size="small"
                                onClick={() => setSelectedId('model')}
                            >
                                返回 3D 場景
                            </Button>
                        </div>
                        <iframe
                            key={overlaySf.uid}
                            src={`https://sketchfab.com/models/${overlaySf.uid}/embed?autostart=1&ui_hint=0&dnt=1`}
                            title={overlaySf.name}
                            allow="autoplay; fullscreen; xr-spatial-tracking"
                            style={{ flex: 1, border: 0, width: '100%' }}
                        />
                    </div>
                )}

                {/* Canvas label (only when no SF overlay) */}
                {!showSfOverlay && (
                    <div className="absolute top-4 left-4 pointer-events-none z-0">
                        <h2 className="text-xl font-bold text-white drop-shadow-md">3D Model Preview</h2>
                        <p className="text-gray-400 text-sm drop-shadow-md">
                            點選物件以啟用位移控制 · 雙擊圖層名稱編輯 · 拖曳圖層排序
                        </p>
                    </div>
                )}
            </div>

            {/* ── Right Control Panel ── */}
            <Card
                className="w-[280px] flex-shrink-0 h-full shadow-xl border-gray-800 bg-[#141414] overflow-auto"
                title={
                    <span className="text-gray-200 text-sm">
                        {selectedLight
                            ? `🔆 ${selectedLight.name}`
                            : selectedSf
                                ? `🌐 ${selectedSf.name}`
                                : `🧊 ${model.name}`}
                    </span>
                }
                styles={{ body: { padding: '16px' } }}
            >
                <Space direction="vertical" size="middle" className="w-full">
                    {/* ── Sketchfab layer selected ── */}
                    {selectedSf ? (
                        <>
                            <Text className="text-gray-400 text-xs block">Sketchfab 圖層</Text>
                            <div>
                                <Text className="text-gray-400 text-xs block mb-1.5">名稱</Text>
                                <Input
                                    size="small"
                                    value={selectedSf.name}
                                    onChange={(e) => setSfLayers(prev =>
                                        prev.map(s => s.id === selectedSf.id ? { ...s, name: e.target.value } : s)
                                    )}
                                    style={{ background: '#1f1f1f', borderColor: '#333', color: '#e5e7eb' }}
                                />
                            </div>
                            <div>
                                <Text className="text-gray-400 text-xs block mb-1.5">Model UID</Text>
                                <Text className="text-indigo-400 font-mono text-xs break-all">{selectedSf.uid}</Text>
                            </div>
                            <Button
                                block
                                type={selectedSf.visible ? 'default' : 'primary'}
                                icon={selectedSf.visible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                onClick={() => toggleVisibility(selectedSf.id, sfLayers)}
                            >
                                {selectedSf.visible ? '隱藏 Embed' : '顯示 Embed'}
                            </Button>
                            <Button
                                block
                                href={`https://sketchfab.com/3d-models/${selectedSf.uid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="small"
                            >
                                在 Sketchfab 開啟 ↗
                            </Button>
                            <Divider className="border-gray-800 my-1" />
                            <Button
                                block
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => removeSketchfabLayer(selectedSf.id)}
                            >
                                移除圖層
                            </Button>
                        </>
                    ) : selectedLight ? (
                        <>
                            {/* ── Light selected ── */}
                            <div>
                                <Text className="text-gray-400 text-xs block mb-1.5">光源類型</Text>
                                <Select
                                    value={selectedLight.type}
                                    className="w-full"
                                    onChange={(val) => updateLight(selectedLight.id, {
                                        type: val as LightType,
                                        name: LIGHT_TYPE_LABELS[val as LightType],
                                    })}
                                    options={(['directional', 'spot', 'point', 'ambient'] as LightType[]).map(t => ({
                                        value: t,
                                        label: LIGHT_TYPE_LABELS[t],
                                    }))}
                                />
                            </div>

                            <Divider className="border-gray-800 my-1" />

                            <div>
                                <div className="flex justify-between mb-1">
                                    <Text className="text-gray-400 text-xs">強度 (Intensity)</Text>
                                    <Text className="text-indigo-400 font-mono text-xs">{selectedLight.intensity.toFixed(1)}</Text>
                                </div>
                                <Slider
                                    min={0}
                                    max={selectedLight.type === 'ambient' ? 3 : 15}
                                    step={0.1}
                                    value={selectedLight.intensity}
                                    onChange={(v) => updateLight(selectedLight.id, { intensity: v })}
                                    tooltip={{ formatter: null }}
                                />
                            </div>

                            <div>
                                <Text className="text-gray-400 text-xs block mb-2">顏色 (Color)</Text>
                                <ColorPicker
                                    value={selectedLight.color}
                                    onChange={(c) => updateLight(selectedLight.id, { color: c.toHexString() })}
                                    showText
                                    disabledAlpha
                                    className="w-full bg-[#1f1f1f] border-gray-700"
                                />
                            </div>

                            {selectedLight.type !== 'ambient' && (
                                <>
                                    <Divider className="border-gray-800 my-1" />
                                    <div>
                                        <Text className="text-gray-400 text-xs block mb-2">位置 (拖曳場景中的球體)</Text>
                                        <div className="flex flex-col gap-2">
                                            {(['x', 'y', 'z'] as const).map((axis, i) => (
                                                <div key={axis}>
                                                    <div className="flex justify-between mb-0.5">
                                                        <Text className="text-xs text-gray-500 uppercase">{axis}</Text>
                                                        <Text className="text-xs text-indigo-400 font-mono">{selectedLight.position[i].toFixed(1)}</Text>
                                                    </div>
                                                    <Slider
                                                        min={-15}
                                                        max={15}
                                                        step={0.5}
                                                        value={selectedLight.position[i]}
                                                        onChange={(v) => {
                                                            const pos = [...selectedLight.position] as [number, number, number];
                                                            pos[i] = v;
                                                            updateLight(selectedLight.id, { position: pos });
                                                        }}
                                                        tooltip={{ formatter: null }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            {/* ── Model selected ── */}
                            <div>
                                <Text className="text-gray-400 text-xs block mb-1.5">模型名稱</Text>
                                <Input
                                    size="small"
                                    value={model.name}
                                    onChange={(e) => setModel(m => ({ ...m, name: e.target.value }))}
                                    style={{ background: '#1f1f1f', borderColor: '#333', color: '#e5e7eb' }}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    size="small"
                                    icon={<UploadOutlined />}
                                    className="flex-1"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    上傳模型
                                </Button>
                                {uploadedUrl && (
                                    <Button
                                        size="small"
                                        danger
                                        onClick={() => {
                                            if (uploadedUrl) URL.revokeObjectURL(uploadedUrl);
                                            setUploadedUrl(null);
                                            setUploadedType(null);
                                            setModel(m => ({ ...m, name: 'Torus Knot' }));
                                        }}
                                    >
                                        重置
                                    </Button>
                                )}
                            </div>

                            <Divider className="border-gray-800 my-1" />

                            <div>
                                <Text className="text-gray-400 text-xs block mb-2">模型位置</Text>
                                {(['x', 'y', 'z'] as const).map((axis, i) => (
                                    <div key={axis} className="flex justify-between py-0.5">
                                        <Text className="text-xs text-gray-500 uppercase">{axis}</Text>
                                        <Text className="text-xs text-indigo-400 font-mono">{model.position[i].toFixed(2)}</Text>
                                    </div>
                                ))}
                            </div>

                            <Text className="text-gray-600 text-xs">
                                💡 雙擊圖層名稱可快速重命名
                            </Text>
                        </>
                    )}
                </Space>
            </Card>

            {/* ── Sketchfab Drawer ── */}
            <SketchfabDrawer
                open={sketchfabOpen}
                onClose={() => setSketchfabOpen(false)}
                onAddLayer={addSketchfabLayer}
            />
        </div>
    );
}
