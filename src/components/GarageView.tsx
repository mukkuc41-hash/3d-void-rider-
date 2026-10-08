import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import {
  CENTRAL_SHIP_CATALOG,
  SHIP_CLASSES,
  RARITY_CONFIG,
  getShipDefinition,
  ShipDefinition,
  ShipClass,
  ShipRarity,
} from '../game/shipCatalog';
import { createProceduralShipMesh } from '../game/shipMeshGenerator';
import {
  garagePersistence,
  CreditTransaction,
  ShipCustomizationData,
  ExtendedGarageUpgrades,
} from '../game/garagePersistence';
import {
  ShipDecalType,
  ShipUpgrades,
  ThrusterFlameColor,
  CockpitSkin,
  UpgradeType,
  BeamCustomization,
  BeamUpgrades,
  BeamType,
  BeamCoreShape,
  BeamImpactPreset,
  BeamSoundPreset,
} from '../types';
import { DEFAULT_BEAM_CUSTOMIZATION, DEFAULT_BEAM_UPGRADES } from '../game/beamSystem';
import { sound } from '../game/audio';
import {
  ArrowLeft,
  Sparkles,
  Check,
  Zap,
  Gauge,
  Shield,
  RotateCcw,
  Palette,
  Coins,
  Crosshair,
  Flame,
  Radio,
  Sliders,
  History,
  Scale,
  Award,
  Lock,
  Search,
  Heart,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Play,
  Layers,
  Cpu,
  RefreshCw,
  Compass,
  Activity,
  Wind,
} from 'lucide-react';

export type GarageCategory =
  | 'SHIP'
  | 'PAINT'
  | 'ENGINE'
  | 'ARMOR'
  | 'BOOST'
  | 'HANDLING'
  | 'ENERGY'
  | 'BEAM LAB'
  | 'EFFECTS'
  | 'PERFORMANCE';

interface GarageViewProps {
  currentShipId: string;
  currentColor: string;
  currentSecondaryColor?: string;
  currentDecal?: ShipDecalType;
  currentThrusterColor?: ThrusterFlameColor;
  currentCockpitSkin?: CockpitSkin;
  currentUpgrades: ShipUpgrades;
  currentBeamCustomization?: BeamCustomization;
  currentBeamUpgrades?: BeamUpgrades;
  unlockedShips: string[];
  credits: number;
  playerLevel: number;
  pilotName?: string;
  onUpdatePilotName?: (name: string) => void;
  onSelectShip: (shipId: string) => void;
  onSelectColor: (color: string) => void;
  onSelectSecondaryColor: (color: string) => void;
  onSelectDecal: (decal: ShipDecalType) => void;
  onSelectThrusterColor: (flame: ThrusterFlameColor) => void;
  onSelectCockpitSkin: (skin: CockpitSkin) => void;
  onPurchaseUpgrade: (type: UpgradeType, cost: number) => void;
  onUpdateBeamCustomization?: (customization: BeamCustomization) => void;
  onPurchaseBeamUpgrade?: (upgradeKey: keyof BeamUpgrades, cost: number) => void;
  onUnlockShip: (shipId: string, cost: number) => void;
  onBack: () => void;
}

const COLOR_PRESETS = [
  { name: 'CYAN', hex: '#00f0ff' },
  { name: 'BLUE', hex: '#0066ff' },
  { name: 'VIOLET', hex: '#8b00ff' },
  { name: 'MAGENTA', hex: '#ff00aa' },
  { name: 'WHITE', hex: '#ffffff' },
  { name: 'RED', hex: '#ff1133' },
  { name: 'GREEN', hex: '#00ff66' },
  { name: 'GOLD', hex: '#ffaa00' },
];

const BEAM_TYPES: { id: BeamType; name: string; desc: string; dps: string }[] = [
  { id: 'STANDARD', name: 'Standard Collimator', desc: 'Balanced particle beam for all situations.', dps: '100% DMG | 100% Heat' },
  { id: 'PLASMA', name: 'Plasma Arc Emitter', desc: 'Superheated ionized gas channel.', dps: '140% DMG | +15% Heat' },
  { id: 'LASER', name: 'Precision Laser Lance', desc: 'Pinpoint cutting ray down the circuit.', dps: '115% DMG | -15% Heat' },
  { id: 'VOID', name: 'Void Singularity', desc: 'Dark gravitational corona with tearing force.', dps: '150% DMG | +25% Heat' },
  { id: 'PULSE', name: 'High-Frequency Burst', desc: 'Rapid cyclic bursts for dense swarms.', dps: '85% DMG | +35% Fire Rate' },
  { id: 'ARC', name: 'Arc Lightning Surge', desc: 'Crackling electrical discharge through rock.', dps: '120% DMG | Erratic Corona' },
  { id: 'PHOTON', name: 'Photon Cascade', desc: 'Solar luminance that vaporizes debris.', dps: '130% DMG | Max Glow' },
  { id: 'QUANTUM', name: 'Quantum Antimatter Lance', desc: 'Massive heavy ray disintegrates mantle.', dps: '175% DMG | Heavy Recoil' },
];

const BEAM_CORE_SHAPES: { id: BeamCoreShape; name: string }[] = [
  { id: 'THIN', name: 'Thin Pencil' },
  { id: 'STANDARD', name: 'Standard Column' },
  { id: 'WIDE', name: 'Wide Cannon' },
  { id: 'DOUBLE', name: 'Twin Beams' },
  { id: 'TRIPLE', name: 'Triple Array' },
  { id: 'SPIRAL', name: 'Helical Spiral' },
  { id: 'SEGMENTED', name: 'Segmented Pulse' },
  { id: 'PULSING', name: 'Pulsing Core' },
];

const BEAM_IMPACT_PRESETS: { id: BeamImpactPreset; name: string }[] = [
  { id: 'ENERGY_BURST', name: 'Energy Burst' },
  { id: 'PLASMA_EXPLOSION', name: 'Plasma Explosion' },
  { id: 'CRYSTAL_SHATTER', name: 'Crystal Shatter' },
  { id: 'VOID_IMPLOSION', name: 'Void Implosion' },
  { id: 'ELECTRIC_BURST', name: 'Electric Burst' },
  { id: 'FIREBALL', name: 'Fireball Flare' },
  { id: 'QUANTUM_FRACTURE', name: 'Quantum Fracture' },
  { id: 'SHOCKWAVE', name: 'Mega Shockwave' },
];

const ENGINE_TYPES = [
  { id: 'ion_pulse', name: 'Ion Pulse Core', buff: '+10 KM/H Top Speed', cost: 1200 },
  { id: 'twin_antimatter', name: 'Twin Antimatter Nacelles', buff: '+25 KM/H Top Speed, +15% Boost', cost: 2400 },
  { id: 'quad_fusion', name: 'Quad Fusion Cluster', buff: '+20% Acceleration, +10 Stability', cost: 3600 },
  { id: 'tachyon_warp', name: 'Tachyon Hyper-Drive', buff: '+35 KM/H Warp Surge', cost: 5500 },
  { id: 'dark_singularity', name: 'Dark Singularity Thruster', buff: '+45 KM/H Apex Velocity', cost: 8000 },
];

const EXHAUST_STYLES = [
  { id: 'single_jet', name: 'Single Jet Plume' },
  { id: 'twin_jet', name: 'Twin Concentrated Jets' },
  { id: 'ring_vector', name: 'Annular Ring Vector' },
  { id: 'plasma_plume', name: 'Superheated Plasma Flare' },
  { id: 'spiral_vortex', name: 'Entwined Spiral Vortex' },
];

const TRAIL_STYLES = [
  { id: 'solid_neon', name: 'Solid Neon Stream' },
  { id: 'energy_sparks', name: 'Ion Spark Shower' },
  { id: 'ribbon_wave', name: 'Hyper Ribbon Wave' },
  { id: 'stardust', name: 'Cosmic Stardust Cloud' },
  { id: 'quantum_ghost', name: 'Quantum Ghost Echo' },
];

const DECALS_LIST = [
  { id: 'none' as ShipDecalType, name: 'Stealth Carbon', desc: 'Pure aerogel carbon with zero markings.' },
  { id: 'racing_stripes' as ShipDecalType, name: 'Twin Velocity Stripes', desc: 'Dual racing lines through fuselage.' },
  { id: 'hazard_chevrons' as ShipDecalType, name: 'Hyper Chevrons', desc: 'Kinetic hazard directional chevrons.' },
  { id: 'vortex_wings' as ShipDecalType, name: 'Vortex Wings', desc: 'Curved plasma wing flare motifs.' },
  { id: 'apex_predator' as ShipDecalType, name: 'Apex Predator', desc: 'Aggressive lightning fangs insignia.' },
  { id: 'carbon_hex' as ShipDecalType, name: 'Carbon Nano-Hex', desc: 'Holographic hexagonal lattice pattern.' },
];

const COCKPIT_SKINS = [
  { id: 'cyber_stealth' as CockpitSkin, name: 'Cyber Stealth', frame: '#1e293b', accent: '#00f0ff' },
  { id: 'titanium_gold' as CockpitSkin, name: 'Titanium Gold', frame: '#785614', accent: '#ffcc00' },
  { id: 'neon_matrix' as CockpitSkin, name: 'Neon Matrix', frame: '#0a3d24', accent: '#00ff66' },
  { id: 'void_shadow' as CockpitSkin, name: 'Void Shadow', frame: '#39144d', accent: '#ff00e5' },
];

export const GarageView: React.FC<GarageViewProps> = ({
  currentShipId: initialShipId,
  currentUpgrades: initialUpgrades,
  currentBeamCustomization: initialBeamCustomization = DEFAULT_BEAM_CUSTOMIZATION,
  currentBeamUpgrades: initialBeamUpgrades = DEFAULT_BEAM_UPGRADES,
  credits: initialCredits,
  playerLevel = 1,
  pilotName = 'Aditya',
  onSelectShip,
  onSelectColor,
  onSelectSecondaryColor,
  onSelectDecal,
  onSelectThrusterColor,
  onSelectCockpitSkin,
  onPurchaseUpgrade,
  onUpdateBeamCustomization,
  onPurchaseBeamUpgrade,
  onUnlockShip,
  onBack,
}) => {
  // Sync state with garage persistence
  const [garageData, setGarageData] = useState(garagePersistence.getData());
  const [selectedShipId, setSelectedShipId] = useState<string>(() => {
    return initialShipId.startsWith('VR-') ? initialShipId : garagePersistence.getData().equippedShipId || 'VR-0002';
  });

  const [activeCategory, setActiveCategory] = useState<GarageCategory>('SHIP');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedRarity, setSelectedRarity] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OWNED' | 'LOCKED' | 'FAVORITES' | 'EQUIPPED'>('ALL');
  const [sortBy, setSortBy] = useState<'ID' | 'NAME' | 'RARITY' | 'SPEED' | 'HANDLING' | 'ARMOR' | 'ENERGY' | 'BEAM' | 'PRICE'>('ID');

  // Pagination for 1,000 ships
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 40;

  // Comparison list (up to 3 ships)
  const [compareIds, setCompareIds] = useState<string[]>([selectedShipId]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Credit History Modal
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Toast Feedback Banner
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // 3D Three.js canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const shipGroupRef = useRef<THREE.Group | null>(null);
  const dustGroupRef = useRef<THREE.Points | null>(null);
  const previewBeamGroupRef = useRef<THREE.Group | null>(null);
  const dummyAsteroidRef = useRef<THREE.Mesh | null>(null);

  const [isTestFiring, setIsTestFiring] = useState(false);
  const isTestFiringRef = useRef(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  // Subscribe to garage persistence updates
  useEffect(() => {
    return garagePersistence.subscribe(() => {
      setGarageData({ ...garagePersistence.getData() });
    });
  }, []);

  const selectedDef: ShipDefinition = useMemo(() => {
    return getShipDefinition(selectedShipId);
  }, [selectedShipId]);

  const customization: ShipCustomizationData = useMemo(() => {
    return garagePersistence.getShipCustomization(selectedShipId);
  }, [selectedShipId, garageData]);

  const isEquipped = garageData.equippedShipId === selectedShipId;
  const isOwned = garageData.ownedShipIds.includes(selectedShipId);
  const isFavorite = garageData.favoriteShipIds.includes(selectedShipId);

  // Toast notification trigger
  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => {
      setToastMessage(prev => (prev?.text === text ? null : prev));
    }, 3500);
  };

  // Filtered & Sorted Ships Catalog
  const filteredShips = useMemo(() => {
    let list = CENTRAL_SHIP_CATALOG;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        s =>
          s.id.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.class.toLowerCase().includes(q)
      );
    }

    if (selectedClass !== 'ALL') {
      list = list.filter(s => s.class === selectedClass);
    }

    if (selectedRarity !== 'ALL') {
      list = list.filter(s => s.rarity === selectedRarity);
    }

    if (statusFilter === 'OWNED') {
      list = list.filter(s => garageData.ownedShipIds.includes(s.id));
    } else if (statusFilter === 'LOCKED') {
      list = list.filter(s => !garageData.ownedShipIds.includes(s.id));
    } else if (statusFilter === 'FAVORITES') {
      list = list.filter(s => garageData.favoriteShipIds.includes(s.id));
    } else if (statusFilter === 'EQUIPPED') {
      list = list.filter(s => garageData.equippedShipId === s.id);
    }

    // Sorting
    const sorted = [...list];
    const rarityRank: Record<ShipRarity, number> = {
      COMMON: 1,
      UNCOMMON: 2,
      RARE: 3,
      EPIC: 4,
      LEGENDARY: 5,
      MYTHIC: 6,
    };

    switch (sortBy) {
      case 'NAME':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'RARITY':
        sorted.sort((a, b) => rarityRank[b.rarity] - rarityRank[a.rarity]);
        break;
      case 'SPEED':
        sorted.sort((a, b) => b.baseStats.maxSpeed - a.baseStats.maxSpeed);
        break;
      case 'HANDLING':
        sorted.sort((a, b) => b.baseStats.handling - a.baseStats.handling);
        break;
      case 'ARMOR':
        sorted.sort((a, b) => b.baseStats.armor - a.baseStats.armor);
        break;
      case 'ENERGY':
        sorted.sort((a, b) => b.baseStats.energy - a.baseStats.energy);
        break;
      case 'BEAM':
        sorted.sort((a, b) => b.baseStats.beamPower - a.baseStats.beamPower);
        break;
      case 'PRICE':
        sorted.sort((a, b) => b.purchaseCost - a.purchaseCost);
        break;
      default: // ID
        sorted.sort((a, b) => a.seed - b.seed);
        break;
    }

    return sorted;
  }, [searchQuery, selectedClass, selectedRarity, statusFilter, sortBy, garageData]);

  const totalPages = Math.max(1, Math.ceil(filteredShips.length / PAGE_SIZE));
  const currentPageShips = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredShips.slice(start, start + PAGE_SIZE);
  }, [filteredShips, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedClass, selectedRarity, statusFilter, sortBy]);

  // 3D Scene Initialization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.clientWidth || 500;
    const height = canvas.clientHeight || 400;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 7.8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // Premium Sci-Fi Hangar Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    mainKeyLight.position.set(6, 12, 8);
    scene.add(mainKeyLight);

    const rimCyanLight = new THREE.PointLight(0x00f0ff, 4, 25);
    rimCyanLight.position.set(-6, 4, 3);
    scene.add(rimCyanLight);

    const rimWarmLight = new THREE.PointLight(0xff7700, 3.5, 25);
    rimWarmLight.position.set(6, -2, -4);
    scene.add(rimWarmLight);

    // Hangar Hexagonal Metallic Floor
    const floorGeo = new THREE.CircleGeometry(16, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x080d1a,
      roughness: 0.25,
      metalness: 0.85,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.25;
    scene.add(floor);

    // Concentric Neon Launch Rings
    const ring1 = new THREE.Mesh(
      new THREE.RingGeometry(2.8, 3.0, 64),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    ring1.rotation.x = Math.PI / 2;
    ring1.position.y = -1.23;
    scene.add(ring1);

    const ring2 = new THREE.Mesh(
      new THREE.RingGeometry(4.2, 4.35, 64),
      new THREE.MeshBasicMaterial({ color: 0xffaa00, side: THREE.DoubleSide, transparent: true, opacity: 0.45 })
    );
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = -1.24;
    scene.add(ring2);

    // Hangar Gantry Trusses
    [-7, 7].forEach(x => {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.45, 12, 8),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 })
      );
      pillar.position.set(x, 4, -4);
      scene.add(pillar);
    });

    // Floating Atmospheric Dust Motes
    const dustCount = 140;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPos[i] = (Math.random() - 0.5) * 16;
      dustPos[i + 1] = Math.random() * 8 - 1;
      dustPos[i + 2] = (Math.random() - 0.5) * 16;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.04,
      transparent: true,
      opacity: 0.5,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);
    dustGroupRef.current = dust;

    // Target Asteroid for Beam Testing
    const astGeo = new THREE.DodecahedronGeometry(0.85, 1);
    const astMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9, metalness: 0.2 });
    const dummyAst = new THREE.Mesh(astGeo, astMat);
    dummyAst.position.set(0, -0.15, -6.2);
    scene.add(dummyAst);
    dummyAsteroidRef.current = dummyAst;

    // Animated Preview Beam Group
    const beamGroup = new THREE.Group();
    const coreGeo = new THREE.CylinderGeometry(0.05, 0.05, 3.8, 8).rotateX(Math.PI / 2);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(0, 0, -1.9);
    beamGroup.add(core);

    const glowGeo = new THREE.CylinderGeometry(0.22, 0.22, 3.8, 8).rotateX(Math.PI / 2);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.5 });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.set(0, 0, -1.9);
    beamGroup.add(glow);

    const impactSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
    );
    impactSphere.position.set(0, 0, -3.8);
    beamGroup.add(impactSphere);

    beamGroup.position.set(0, -0.4, -2.4);
    beamGroup.visible = false;
    scene.add(beamGroup);
    previewBeamGroupRef.current = beamGroup;

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const renderLoop = () => {
      const elapsed = clock.getElapsedTime();

      // Idle float animation
      if (shipGroupRef.current) {
        shipGroupRef.current.position.y = -0.55 + Math.sin(elapsed * 1.6) * 0.06;
        if (autoRotate && !isDraggingRef.current) {
          shipGroupRef.current.rotation.y += 0.005;
        }
      }

      // Rotate dummy asteroid & shake if firing
      if (dummyAsteroidRef.current) {
        dummyAsteroidRef.current.rotation.y += 0.01;
        dummyAsteroidRef.current.rotation.x += 0.007;
        if (isTestFiringRef.current) {
          dummyAsteroidRef.current.position.x = (Math.random() - 0.5) * 0.18;
          dummyAsteroidRef.current.position.y = -0.15 + (Math.random() - 0.5) * 0.18;
        } else {
          dummyAsteroidRef.current.position.x = 0;
          dummyAsteroidRef.current.position.y = -0.15;
        }
      }

      // Dust motes drift
      if (dustGroupRef.current) {
        dustGroupRef.current.rotation.y = elapsed * 0.015;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    // Mouse / Touch Drag Handlers
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !shipGroupRef.current) return;
      const dx = e.clientX - previousMousePositionRef.current.x;
      const dy = e.clientY - previousMousePositionRef.current.y;
      shipGroupRef.current.rotation.y += dx * 0.009;
      shipGroupRef.current.rotation.x += dy * 0.005;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    // Touch Support
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !shipGroupRef.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - previousMousePositionRef.current.x;
      const dy = e.touches[0].clientY - previousMousePositionRef.current.y;
      shipGroupRef.current.rotation.y += dx * 0.009;
      shipGroupRef.current.rotation.x += dy * 0.005;
      previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // Resize handler
    const handleResize = () => {
      if (!canvas || !renderer || !camera) return;
      const w = canvas.clientWidth || 500;
      const h = canvas.clientHeight || 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update 3D Ship Mesh whenever selectedShipId or customization changes
  useEffect(() => {
    if (!sceneRef.current) return;

    if (shipGroupRef.current) {
      sceneRef.current.remove(shipGroupRef.current);
    }

    const mesh = createProceduralShipMesh(selectedShipId, {
      primaryColorHex: customization.primaryColor,
      secondaryColorHex: customization.secondaryColor,
      accentColorHex: customization.accentColor,
      engineColorHex: customization.engineColor,
      energyColorHex: customization.energyColor,
      beamColorHex: customization.beamColor,
      emissiveIntensity: customization.emissiveIntensity,
      decalType: customization.decal,
      thrusterFlameColor: customization.thrusterFlameColor,
      cockpitSkin: customization.cockpitSkin,
      glowIntensity: customization.glowIntensity,
    });

    mesh.position.set(0, -0.55, 0);
    mesh.rotation.y = Math.PI * 0.15;

    sceneRef.current.add(mesh);
    shipGroupRef.current = mesh;
  }, [selectedShipId, customization]);

  // Trigger Interactive Beam Test Fire
  const handleTestFireBeam = () => {
    if (isTestFiring) return;
    setIsTestFiring(true);
    isTestFiringRef.current = true;
    sound.playBeamFire(garageData.beamCustomization.type, garageData.beamCustomization.soundPreset);
    sound.playBeamImpact(garageData.beamCustomization.impactPreset);

    if (previewBeamGroupRef.current) {
      previewBeamGroupRef.current.visible = true;
    }

    setTimeout(() => {
      setIsTestFiring(false);
      isTestFiringRef.current = false;
      if (previewBeamGroupRef.current) {
        previewBeamGroupRef.current.visible = false;
      }
    }, 1200);
  };

  // Camera presets
  const setCameraPreset = (preset: 'FRONT' | 'CHASE' | 'TOP' | 'SIDE') => {
    if (!cameraRef.current) return;
    sound.playMenuClick();
    if (preset === 'FRONT') {
      cameraRef.current.position.set(0, 1.2, -6.5);
      cameraRef.current.lookAt(0, 0, 0);
    } else if (preset === 'CHASE') {
      cameraRef.current.position.set(0, 2.8, 7.2);
      cameraRef.current.lookAt(0, 0, 0);
    } else if (preset === 'TOP') {
      cameraRef.current.position.set(0, 8.5, 0.5);
      cameraRef.current.lookAt(0, 0, 0);
    } else if (preset === 'SIDE') {
      cameraRef.current.position.set(7.5, 1.5, 0);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  // Ship Purchase & Equip Flow
  const handleEquipShip = (id: string) => {
    sound.playMenuClick();
    const success = garagePersistence.equipShip(id);
    if (success) {
      onSelectShip(id);
      showToast(`EQUIPPED: ${getShipDefinition(id).name}`);
    }
  };

  const handlePurchaseShip = (id: string) => {
    const res = garagePersistence.purchaseShip(id);
    if (res.success) {
      sound.playCountdownBeep(true);
      onUnlockShip(id, getShipDefinition(id).purchaseCost);
      onSelectShip(id);
      showToast(`PURCHASE COMPLETE: ${getShipDefinition(id).name}`);
    } else {
      sound.playAlarmAlert();
      showToast(res.message, true);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    sound.playMenuClick();
    garagePersistence.toggleFavorite(id);
  };

  // Add/Remove comparison
  const handleToggleCompare = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    sound.playMenuClick();
    if (compareIds.includes(id)) {
      setCompareIds(prev => prev.filter(x => x !== id));
    } else {
      if (compareIds.length >= 3) {
        showToast('MAXIMUM 3 SPACECRAFT CAN BE COMPARED', true);
        return;
      }
      setCompareIds(prev => [...prev, id]);
      setIsCompareOpen(true);
    }
  };

  // Category Upgrades Handler
  const handleUpgradeCategory = (key: keyof ExtendedGarageUpgrades, cost: number, title: string) => {
    const res = garagePersistence.purchaseUpgrade(key, cost, title);
    if (res.success) {
      sound.playCountdownBeep(true);
      if (onPurchaseUpgrade && key in (garageData.upgrades as any)) {
        onPurchaseUpgrade(key as UpgradeType, cost);
      }
      showToast(res.message);
    } else {
      sound.playAlarmAlert();
      showToast(res.message, true);
    }
  };

  // Beam Lab Updates
  const handleBeamTypeChange = (type: BeamType) => {
    sound.playMenuClick();
    const updated = { ...garageData.beamCustomization, type };
    garagePersistence.updateBeamCustomization(updated);
    onUpdateBeamCustomization?.(updated);
  };

  const handleBeamCoreShapeChange = (coreShape: BeamCoreShape) => {
    sound.playMenuClick();
    const updated = { ...garageData.beamCustomization, coreShape };
    garagePersistence.updateBeamCustomization(updated);
    onUpdateBeamCustomization?.(updated);
  };

  const handleBeamColorChange = (hex: string) => {
    sound.playMenuClick();
    const updated = {
      ...garageData.beamCustomization,
      coreColor: '#ffffff',
      outerColor: hex,
      particleColor: hex,
    };
    garagePersistence.updateBeamCustomization(updated);
    onUpdateBeamCustomization?.(updated);
  };

  const handleBeamImpactPresetChange = (impactPreset: BeamImpactPreset) => {
    sound.playMenuClick();
    const updated = { ...garageData.beamCustomization, impactPreset };
    garagePersistence.updateBeamCustomization(updated);
    onUpdateBeamCustomization?.(updated);
  };

  const handleBeamUpgradePurchase = (key: keyof BeamUpgrades, cost: number, title: string) => {
    const res = garagePersistence.purchaseBeamUpgrade(key, cost, title);
    if (res.success) {
      sound.playCountdownBeep(true);
      onPurchaseBeamUpgrade?.(key, cost);
      showToast(res.message);
    } else {
      sound.playAlarmAlert();
      showToast(res.message, true);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#030712] text-slate-100 flex flex-col overflow-hidden select-none font-sans">
      {/* ============================================================== */}
      {/* TOP HEADER BAR */}
      {/* ============================================================== */}
      <header className="relative z-30 flex items-center justify-between px-3 sm:px-6 py-2.5 bg-[#050b16]/95 border-b border-cyan-500/20 backdrop-blur-xl shadow-lg shrink-0">
        {/* Left: Back button & Title */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => {
              sound.playMenuClick();
              onBack();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-all font-mono text-xs font-bold active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">EXIT HANGAR</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black tracking-widest text-cyan-400">VOID-RIDER 3D</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                AAA HANGAR
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-black tracking-wider text-slate-100 uppercase">
              AEROSPACE WORKSHOP & FLEET SYSTEM
            </h1>
          </div>
        </div>

        {/* Center: Active Ship Quick Badge */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/5">
          <span className="text-[11px] font-mono uppercase text-slate-400">EQUIPPED VESSEL:</span>
          <span className="text-xs font-mono font-black text-cyan-300">
            {getShipDefinition(garageData.equippedShipId).name}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            {garageData.equippedShipId}
          </span>
        </div>

        {/* Right: Void Credits & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* VOID CREDITS BALANCE */}
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-orange-500/10 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
            <div className="text-right">
              <div className="text-[9px] font-mono font-bold text-amber-300 tracking-wider">◈ VOID CREDITS</div>
              <div className="text-xs sm:text-sm font-mono font-black text-amber-200">
                {String(garageData.credits).padStart(6, '0')}
              </div>
            </div>
          </div>

          {/* Credit History Button */}
          <button
            onClick={() => {
              sound.playMenuClick();
              setIsHistoryOpen(true);
            }}
            title="View Void Credits Transaction History"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 transition-all active:scale-95 cursor-pointer"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Comparison Trigger */}
          <button
            onClick={() => {
              sound.playMenuClick();
              setIsCompareOpen(true);
            }}
            title="Compare Spacecraft"
            className="relative p-2 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-all active:scale-95 cursor-pointer"
          >
            <Scale className="w-4 h-4" />
            {compareIds.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-[10px] font-mono font-black text-black flex items-center justify-center">
                {compareIds.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl border backdrop-blur-xl shadow-2xl flex items-center gap-2 font-mono text-xs font-black animate-in fade-in slide-in-from-top-3 ${
            toastMessage.isError
              ? 'bg-rose-950/90 text-rose-200 border-rose-500 shadow-rose-900/30'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-500 shadow-emerald-900/30'
          }`}
        >
          {toastMessage.isError ? <X className="w-4 h-4 text-rose-400" /> : <Check className="w-4 h-4 text-emerald-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* MAIN 3-PANEL BODY (LEFT: BROWSER, CENTER: 3D HANGAR, RIGHT: SPECS) */}
      {/* ============================================================== */}
      <main className="relative flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ------------------------------------------------------------ */}
        {/* LEFT PANEL: SPACECRAFT CATALOG / 1,000 SHIPS BROWSER */}
        {/* ------------------------------------------------------------ */}
        <aside
          className={`relative z-20 flex flex-col bg-[#050b16]/90 border-r border-slate-800/80 backdrop-blur-xl shrink-0 transition-all ${
            activeCategory === 'SHIP' ? 'w-full lg:w-[360px] xl:w-[400px]' : 'hidden lg:flex lg:w-[280px]'
          }`}
        >
          {/* Filter & Search Header */}
          <div className="p-3 border-b border-slate-800 space-y-2 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="SEARCH 1,000 SHIPS (NAME / ID)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Status Filters (All, Owned, Locked, Favorites, Equipped) */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-mono no-scrollbar">
              {(['ALL', 'OWNED', 'LOCKED', 'FAVORITES', 'EQUIPPED'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    sound.playMenuClick();
                    setStatusFilter(tab);
                  }}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer shrink-0 ${
                    statusFilter === tab
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Class & Rarity Selectors */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <select
                value={selectedClass}
                onChange={e => {
                  sound.playMenuClick();
                  setSelectedClass(e.target.value);
                }}
                className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">ALL CLASSES (20)</option>
                {SHIP_CLASSES.map(cls => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>

              <select
                value={selectedRarity}
                onChange={e => {
                  sound.playMenuClick();
                  setSelectedRarity(e.target.value);
                }}
                className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">ALL RARITIES (6)</option>
                {(['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'] as ShipRarity[]).map(r => (
                  <option key={r} value={r}>
                    {r} ({RARITY_CONFIG[r].targetCount})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>{filteredShips.length} SPACECRAFT FOUND</span>
              <div className="flex items-center gap-1">
                <span>SORT:</span>
                <select
                  value={sortBy}
                  onChange={e => {
                    sound.playMenuClick();
                    setSortBy(e.target.value as any);
                  }}
                  className="bg-transparent text-cyan-400 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="ID">ID / SEED</option>
                  <option value="NAME">NAME</option>
                  <option value="RARITY">RARITY</option>
                  <option value="SPEED">TOP SPEED</option>
                  <option value="HANDLING">HANDLING</option>
                  <option value="ARMOR">ARMOR</option>
                  <option value="ENERGY">ENERGY</option>
                  <option value="BEAM">BEAM POWER</option>
                  <option value="PRICE">CREDITS PRICE</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ships Cards List (Fast Virtualized Scroll) */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {currentPageShips.map(ship => {
              const owned = garageData.ownedShipIds.includes(ship.id);
              const equipped = garageData.equippedShipId === ship.id;
              const fav = garageData.favoriteShipIds.includes(ship.id);
              const isSelected = selectedShipId === ship.id;
              const rarityStyle = RARITY_CONFIG[ship.rarity];

              return (
                <div
                  key={ship.id}
                  onClick={() => {
                    sound.playMenuClick();
                    setSelectedShipId(ship.id);
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  {/* Left: Thumbnail & Badges */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-mono text-xs font-black shrink-0 border"
                      style={{
                        backgroundColor: rarityStyle.bg,
                        borderColor: rarityStyle.border,
                        color: rarityStyle.color,
                        boxShadow: `0 0 10px ${rarityStyle.glow}`,
                      }}
                    >
                      {ship.id.replace('VR-', '')}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-100 truncate">{ship.name}</span>
                        <span
                          className="px-1 rounded text-[9px] font-mono uppercase font-bold border"
                          style={{
                            color: rarityStyle.color,
                            borderColor: rarityStyle.border,
                          }}
                        >
                          {ship.rarity}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">
                        {ship.class} • {ship.baseStats.maxSpeed} KM/H
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions / Status */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Favorite Heart */}
                    <button
                      onClick={e => handleToggleFavorite(ship.id, e)}
                      className={`p-1 rounded hover:bg-white/10 transition-colors ${
                        fav ? 'text-rose-400' : 'text-slate-600 hover:text-slate-400'
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                    </button>

                    {/* Status Badge */}
                    {equipped ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/50">
                        EQUIPPED
                      </span>
                    ) : owned ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        OWNED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        ◈ {ship.purchaseCost}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div className="p-2 border-t border-slate-800 flex items-center justify-between font-mono text-xs text-slate-400 shrink-0">
            <button
              disabled={page <= 1}
              onClick={() => {
                sound.playMenuClick();
                setPage(p => Math.max(1, p - 1));
              }}
              className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              PAGE {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => {
                sound.playMenuClick();
                setPage(p => Math.min(totalPages, p + 1));
              }}
              className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* ------------------------------------------------------------ */}
        {/* CENTER PANEL: 3D INTERACTIVE HANGAR STAGE */}
        {/* ------------------------------------------------------------ */}
        <section className="relative flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#020617] via-[#050b16] to-[#010409]">
          {/* 3D Canvas */}
          <div className="relative flex-1 w-full h-full">
            <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing block" />

            {/* Hangar HUD Overlay: Watermark & Camera Presets */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 pointer-events-none">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/5 backdrop-blur-md">
                <div className="text-[10px] font-mono text-cyan-400 font-bold">WARP HANGAR DOCK 07</div>
                <div className="text-xs font-mono font-black text-slate-200">
                  {selectedDef.name} [{selectedDef.id}]
                </div>
              </div>

              {/* Camera Presets Toolbar */}
              <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-lg bg-slate-900/80 border border-white/10 backdrop-blur-md">
                <button
                  onClick={() => setCameraPreset('CHASE')}
                  className="px-2 py-1 rounded text-[10px] font-mono font-bold text-slate-300 hover:text-cyan-300 hover:bg-slate-800"
                >
                  CHASE
                </button>
                <button
                  onClick={() => setCameraPreset('FRONT')}
                  className="px-2 py-1 rounded text-[10px] font-mono font-bold text-slate-300 hover:text-cyan-300 hover:bg-slate-800"
                >
                  FRONT
                </button>
                <button
                  onClick={() => setCameraPreset('SIDE')}
                  className="px-2 py-1 rounded text-[10px] font-mono font-bold text-slate-300 hover:text-cyan-300 hover:bg-slate-800"
                >
                  SIDE
                </button>
                <button
                  onClick={() => setCameraPreset('TOP')}
                  className="px-2 py-1 rounded text-[10px] font-mono font-bold text-slate-300 hover:text-cyan-300 hover:bg-slate-800"
                >
                  TOP
                </button>
              </div>
            </div>

            {/* Center Quick Action: Interactive Beam Test Fire */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
              <button
                onClick={handleTestFireBeam}
                disabled={isTestFiring}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono font-black text-xs tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Crosshair className={`w-4 h-4 ${isTestFiring ? 'animate-spin' : ''}`} />
                <span>{isTestFiring ? 'BEAM DISCHARGING...' : 'TEST-FIRE BEAM'}</span>
              </button>

              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`p-2 rounded-xl border backdrop-blur-md font-mono text-xs font-bold transition-all ${
                  autoRotate
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-900/80 text-slate-400 border-slate-700'
                }`}
                title="Toggle Auto-Rotation"
              >
                <RotateCcw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
              </button>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* RIGHT PANEL: SELECTED SPACECRAFT SPECS, STATS & PURCHASE/EQUIP */}
        {/* ------------------------------------------------------------ */}
        <aside className="relative z-20 w-full lg:w-[360px] xl:w-[400px] flex flex-col bg-[#050b16]/95 border-l border-slate-800/80 backdrop-blur-xl shrink-0 overflow-y-auto p-4 space-y-4">
          {/* Ship Header */}
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-cyan-400">{selectedDef.id}</span>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider border"
                style={{
                  color: RARITY_CONFIG[selectedDef.rarity].color,
                  borderColor: RARITY_CONFIG[selectedDef.rarity].border,
                  backgroundColor: RARITY_CONFIG[selectedDef.rarity].bg,
                  boxShadow: `0 0 12px ${RARITY_CONFIG[selectedDef.rarity].glow}`,
                }}
              >
                {selectedDef.rarity}
              </span>
            </div>

            <h2 className="text-xl font-black text-slate-100 tracking-wide uppercase mt-1">{selectedDef.name}</h2>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5">
              <span>{selectedDef.class}</span>
              <span>•</span>
              <span className="text-cyan-300">{selectedDef.unlockRequirement}</span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed font-sans">{selectedDef.description}</p>
          </div>

          {/* Visual Stat Bars */}
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between font-mono text-xs font-bold text-slate-300 mb-1">
              <span>SPACECRAFT TELEMETRY</span>
              <span className="text-cyan-400">CLASS SPEC</span>
            </div>

            {[
              { label: 'TOP SPEED', value: selectedDef.baseStats.maxSpeed, max: 450, unit: 'KM/H', color: 'from-cyan-500 to-blue-500' },
              { label: 'ACCELERATION', value: selectedDef.baseStats.acceleration, max: 150, unit: '', color: 'from-emerald-500 to-teal-400' },
              { label: 'HANDLING', value: selectedDef.baseStats.handling, max: 140, unit: '', color: 'from-amber-500 to-yellow-400' },
              { label: 'ARMOR BULWARK', value: selectedDef.baseStats.armor, max: 160, unit: '', color: 'from-rose-500 to-red-600' },
              { label: 'PHASE SHIELD', value: selectedDef.baseStats.shield, max: 160, unit: '', color: 'from-indigo-500 to-cyan-400' },
              { label: 'NITRO BOOST', value: selectedDef.baseStats.boost, max: 150, unit: '', color: 'from-orange-500 to-amber-400' },
              { label: 'DRIFT FACTOR', value: selectedDef.baseStats.drift, max: 125, unit: '', color: 'from-purple-500 to-pink-500' },
              { label: 'ENERGY CAPACITY', value: selectedDef.baseStats.energy, max: 220, unit: '', color: 'from-blue-500 to-cyan-400' },
              { label: 'BEAM POWER', value: selectedDef.baseStats.beamPower, max: 190, unit: '', color: 'from-pink-500 to-rose-400' },
              { label: 'BEAM RANGE', value: selectedDef.baseStats.beamRange, max: 180, unit: 'm', color: 'from-cyan-400 to-teal-300' },
              { label: 'STABILITY', value: selectedDef.baseStats.stability, max: 140, unit: '', color: 'from-emerald-400 to-green-500' },
            ].map(stat => (
              <div key={stat.label} className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">{stat.label}</span>
                  <span className="font-bold text-slate-200">
                    {stat.value} {stat.unit}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${stat.color} transition-all duration-300`}
                    style={{ width: `${Math.min(100, (stat.value / stat.max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Equip / Purchase Action Flow */}
          <div className="pt-1">
            {isEquipped ? (
              <div className="w-full py-3 rounded-xl bg-cyan-950/60 border border-cyan-400 text-cyan-300 font-mono font-black text-center text-sm tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                <Check className="w-5 h-5 text-cyan-400" />
                <span>ACTIVELY EQUIPPED IN FLEET</span>
              </div>
            ) : isOwned ? (
              <button
                onClick={() => handleEquipShip(selectedShipId)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-mono font-black text-sm tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                <Zap className="w-5 h-5" />
                <span>EQUIP SPACECRAFT</span>
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-slate-400">PURCHASE PRICE:</span>
                  <span className="text-amber-300 font-black text-sm">◈ {selectedDef.purchaseCost}</span>
                </div>

                <button
                  disabled={garageData.credits < selectedDef.purchaseCost || playerLevel < selectedDef.unlockLevel}
                  onClick={() => handlePurchaseShip(selectedShipId)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-mono font-black text-sm tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95 cursor-pointer flex items-center justify-center gap-2 transition-all"
                >
                  <Coins className="w-5 h-5" />
                  <span>
                    {garageData.credits < selectedDef.purchaseCost
                      ? 'NOT ENOUGH CREDITS'
                      : playerLevel < selectedDef.unlockLevel
                      ? `LOCKED (LVL ${selectedDef.unlockLevel})`
                      : `PURCHASE FOR ◈ ${selectedDef.purchaseCost}`}
                  </span>
                </button>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* ============================================================== */}
      {/* BOTTOM CONTROL DOCK: 10 FUNCTIONAL CATEGORIES & CONTROLS */}
      {/* ============================================================== */}
      <footer className="relative z-30 bg-[#050b16]/95 border-t border-cyan-500/20 backdrop-blur-xl shrink-0">
        {/* Category Tabs Strip */}
        <div className="flex items-center gap-1 px-3 sm:px-6 py-2 overflow-x-auto no-scrollbar border-b border-slate-800">
          {(
            [
              'SHIP',
              'PAINT',
              'ENGINE',
              'ARMOR',
              'BOOST',
              'HANDLING',
              'ENERGY',
              'BEAM LAB',
              'EFFECTS',
              'PERFORMANCE',
            ] as GarageCategory[]
          ).map(cat => (
            <button
              key={cat}
              onClick={() => {
                sound.playMenuClick();
                setActiveCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs tracking-wider font-bold transition-all shrink-0 cursor-pointer ${
                activeCategory === cat
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Category Specific Control Drawer */}
        <div className="p-3 sm:p-4 max-h-48 overflow-y-auto">
          {/* TAB 1: SHIP */}
          {activeCategory === 'SHIP' && (
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 flex-wrap gap-2">
              <div>
                <span>SELECT FROM 1,000 UNIQUE DETERMINISTIC SPACECRAFT IN THE LEFT BROWSER.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStatusFilter('OWNED')}
                  className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                >
                  VIEW MY FLEET ({garageData.ownedShipIds.length})
                </button>
                <button
                  onClick={() => setStatusFilter('FAVORITES')}
                  className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300"
                >
                  FAVORITES ({garageData.favoriteShipIds.length})
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PAINT */}
          {activeCategory === 'PAINT' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              {/* Primary Color */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold">PRIMARY HULL COLOR</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c.name}
                      onClick={() => {
                        sound.playMenuClick();
                        garagePersistence.updateShipCustomization(selectedShipId, { primaryColor: c.hex });
                        onSelectColor(c.hex);
                      }}
                      className="w-6 h-6 rounded-full border border-white/20 active:scale-90 transition-transform cursor-pointer"
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                  <input
                    type="color"
                    value={customization.primaryColor}
                    onChange={e => {
                      garagePersistence.updateShipCustomization(selectedShipId, { primaryColor: e.target.value });
                      onSelectColor(e.target.value);
                    }}
                    className="w-6 h-6 rounded-full cursor-pointer bg-transparent border-none"
                    title="Custom Picker"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold">SECONDARY ACCENT COLOR</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c.name}
                      onClick={() => {
                        sound.playMenuClick();
                        garagePersistence.updateShipCustomization(selectedShipId, { secondaryColor: c.hex });
                        onSelectSecondaryColor(c.hex);
                      }}
                      className="w-6 h-6 rounded-full border border-white/20 active:scale-90 transition-transform cursor-pointer"
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Decal Livery */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold">AERODYNAMIC DECAL LIVERY</label>
                <select
                  value={customization.decal}
                  onChange={e => {
                    sound.playMenuClick();
                    const decal = e.target.value as ShipDecalType;
                    garagePersistence.updateShipCustomization(selectedShipId, { decal });
                    onSelectDecal(decal);
                  }}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                >
                  {DECALS_LIST.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cockpit Canopy Skin */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold">COCKPIT FRAME CANOPY</label>
                <select
                  value={customization.cockpitSkin}
                  onChange={e => {
                    sound.playMenuClick();
                    const skin = e.target.value as CockpitSkin;
                    garagePersistence.updateShipCustomization(selectedShipId, { cockpitSkin: skin });
                    onSelectCockpitSkin(skin);
                  }}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                >
                  {COCKPIT_SKINS.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* TAB 3: ENGINE */}
          {activeCategory === 'ENGINE' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold">PROPULSION CORE TYPE</label>
                <select
                  value={customization.engineType}
                  onChange={e => {
                    sound.playMenuClick();
                    garagePersistence.updateShipCustomization(selectedShipId, { engineType: e.target.value });
                  }}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                >
                  {ENGINE_TYPES.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold">EXHAUST PLUME GEOMETRY</label>
                <select
                  value={customization.exhaustStyle}
                  onChange={e => {
                    sound.playMenuClick();
                    garagePersistence.updateShipCustomization(selectedShipId, { exhaustStyle: e.target.value });
                  }}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                >
                  {EXHAUST_STYLES.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold">SLIPSTREAM TRAIL EFFECT</label>
                <select
                  value={customization.trailStyle}
                  onChange={e => {
                    sound.playMenuClick();
                    garagePersistence.updateShipCustomization(selectedShipId, { trailStyle: e.target.value });
                  }}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                >
                  {TRAIL_STYLES.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold">THRUSTER GLOW COLOR</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c.name}
                      onClick={() => {
                        sound.playMenuClick();
                        garagePersistence.updateShipCustomization(selectedShipId, {
                          engineColor: c.hex,
                          thrusterFlameColor: c.name.toLowerCase() as any,
                        });
                        onSelectThrusterColor(c.name.toLowerCase() as any);
                      }}
                      className="w-6 h-6 rounded-full border border-white/20 active:scale-90 transition-transform cursor-pointer"
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ARMOR */}
          {activeCategory === 'ARMOR' && (
            <div className="flex items-center justify-between flex-wrap gap-4 text-xs font-mono">
              <div className="max-w-md">
                <div className="font-bold text-slate-200">KINETIC ARMOR BULWARK (TIER {(garageData.upgrades.chassis || 0) + 1}/5)</div>
                <div className="text-slate-400 mt-1">
                  Reinforced nanocarbon bulkheads protect against high-speed asteroid impacts and barrier collisions.
                </div>
              </div>
              <button
                onClick={() => handleUpgradeCategory('chassis', 950, 'Aero-Carbon Chassis & Armor')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 text-black font-black active:scale-95"
              >
                UPGRADE ARMOR (◈ 950)
              </button>
            </div>
          )}

          {/* TAB 5: BOOST */}
          {activeCategory === 'BOOST' && (
            <div className="flex items-center justify-between flex-wrap gap-4 text-xs font-mono">
              <div className="max-w-md">
                <div className="font-bold text-slate-200">ANTIMATTER NITRO BOOST (TIER {(garageData.upgrades.boost || 0) + 1}/5)</div>
                <div className="text-slate-400 mt-1">
                  Overclocks plasma capacitor banks for stronger boost acceleration, capacity, and hyper-warp duration.
                </div>
              </div>
              <button
                onClick={() => handleUpgradeCategory('boost', 950, 'Antimatter Nitro Boost')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 text-black font-black active:scale-95"
              >
                UPGRADE NITRO (◈ 950)
              </button>
            </div>
          )}

          {/* TAB 6: HANDLING */}
          {activeCategory === 'HANDLING' && (
            <div className="flex items-center justify-between flex-wrap gap-4 text-xs font-mono">
              <div className="max-w-md">
                <div className="font-bold text-slate-200">GRAV-INVERTER THRUSTERS (TIER {(garageData.upgrades.handling || 0) + 1}/5)</div>
                <div className="text-slate-400 mt-1">
                  Stabilizes lateral vector thrusters for tighter drift radius and instantaneous turning response.
                </div>
              </div>
              <button
                onClick={() => handleUpgradeCategory('handling', 850, 'Grav-Inverter Thrusters')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-black active:scale-95"
              >
                UPGRADE HANDLING (◈ 850)
              </button>
            </div>
          )}

          {/* TAB 7: ENERGY */}
          {activeCategory === 'ENERGY' && (
            <div className="flex items-center justify-between flex-wrap gap-4 text-xs font-mono">
              <div className="max-w-md">
                <div className="font-bold text-slate-200">TACHYON ENERGY CAPACITOR (TIER {(garageData.upgrades.energyLevel || 0) + 1}/5)</div>
                <div className="text-slate-400 mt-1">
                  High-yield ultracapacitor reservoirs expand continuous energy reserves for beams and shields.
                </div>
              </div>
              <button
                onClick={() => handleUpgradeCategory('energyLevel', 800, 'Tachyon Energy Capacitor')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 text-black font-black active:scale-95"
              >
                UPGRADE ENERGY (◈ 800)
              </button>
            </div>
          )}

          {/* TAB 8: BEAM LAB */}
          {activeCategory === 'BEAM LAB' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                {/* Beam Type */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">EMITTER LANCE TYPE</label>
                  <select
                    value={garageData.beamCustomization.type}
                    onChange={e => handleBeamTypeChange(e.target.value as BeamType)}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                  >
                    {BEAM_TYPES.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Beam Shape */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">CORE STREAM GEOMETRY</label>
                  <select
                    value={garageData.beamCustomization.coreShape}
                    onChange={e => handleBeamCoreShapeChange(e.target.value as BeamCoreShape)}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                  >
                    {BEAM_CORE_SHAPES.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Beam Color */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">PHOTON BEAM COLOR</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {COLOR_PRESETS.map(c => (
                      <button
                        key={c.name}
                        onClick={() => handleBeamColorChange(c.hex)}
                        className="w-6 h-6 rounded-full border border-white/20 active:scale-90 cursor-pointer"
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Impact Preset */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">IMPACT SHOCK EFFECT</label>
                  <select
                    value={garageData.beamCustomization.impactPreset}
                    onChange={e => handleBeamImpactPresetChange(e.target.value as BeamImpactPreset)}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                  >
                    {BEAM_IMPACT_PRESETS.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Beam Upgrades Quick Action Strip */}
              <div className="flex items-center gap-2 overflow-x-auto text-[11px] font-mono no-scrollbar pt-1 border-t border-slate-800">
                <button
                  onClick={() => handleBeamUpgradePurchase('power', 650, 'Beam Power & Damage')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-cyan-300 border border-slate-700 shrink-0 cursor-pointer"
                >
                  + POWER (LVL {garageData.beamUpgrades.power}/5 • ◈ 650)
                </button>
                <button
                  onClick={() => handleBeamUpgradePurchase('range', 550, 'Beam Range & Lens')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-cyan-300 border border-slate-700 shrink-0 cursor-pointer"
                >
                  + RANGE (LVL {garageData.beamUpgrades.range}/5 • ◈ 550)
                </button>
                <button
                  onClick={() => handleBeamUpgradePurchase('cooling', 600, 'Thermal Dissipation')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-cyan-300 border border-slate-700 shrink-0 cursor-pointer"
                >
                  + COOLING (LVL {garageData.beamUpgrades.cooling}/5 • ◈ 600)
                </button>
                <button
                  onClick={() => handleBeamUpgradePurchase('targeting', 550, 'Auto-Target Cone')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-cyan-300 border border-slate-700 shrink-0 cursor-pointer"
                >
                  + TARGETING (LVL {garageData.beamUpgrades.targeting}/5 • ◈ 550)
                </button>
              </div>
            </div>
          )}

          {/* TAB 9: EFFECTS */}
          {activeCategory === 'EFFECTS' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold">NEON UNDERGLOW FIELD</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c.name}
                      onClick={() => {
                        sound.playMenuClick();
                        garagePersistence.updateShipCustomization(selectedShipId, { underglowColor: c.hex });
                      }}
                      className="w-6 h-6 rounded-full border border-white/20 active:scale-90 cursor-pointer"
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold">PULSING UNDERGLOW CADENCE</label>
                <select
                  value={customization.underglowPattern || 'steady'}
                  onChange={e => {
                    sound.playMenuClick();
                    garagePersistence.updateShipCustomization(selectedShipId, { underglowPattern: e.target.value });
                  }}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                >
                  <option value="steady">Constant Glow</option>
                  <option value="breath">Slow Resonant Breathing</option>
                  <option value="pulse">High-RPM Engine Pulse</option>
                  <option value="strobe">Tachyon Strobe</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold">ENERGY EMISSIVE INTENSITY</label>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={customization.emissiveIntensity}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    garagePersistence.updateShipCustomization(selectedShipId, { emissiveIntensity: val });
                  }}
                  className="w-full cursor-pointer"
                />
                <div className="text-[10px] text-slate-400">MULTIPLIER: {customization.emissiveIntensity.toFixed(1)}x</div>
              </div>
            </div>
          )}

          {/* TAB 10: PERFORMANCE */}
          {activeCategory === 'PERFORMANCE' && (
            <div className="flex items-center justify-between flex-wrap gap-4 text-xs font-mono">
              <div>
                <div className="font-bold text-slate-200">ION PULSE CORE OVERCLOCK (TIER {(garageData.upgrades.engine || 0) + 1}/5)</div>
                <div className="text-slate-400 mt-1">
                  Antimatter ignition conduits boost maximum straight-line top speed across all circuit sectors.
                </div>
              </div>
              <button
                onClick={() => handleUpgradeCategory('engine', 850, 'Ion Pulse Core')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-black font-black active:scale-95 cursor-pointer"
              >
                OVERCLOCK SPEED (◈ 850)
              </button>
            </div>
          )}
        </div>
      </footer>

      {/* ============================================================== */}
      {/* SHIP COMPARISON MODAL (UP TO 3 SHIPS) */}
      {/* ============================================================== */}
      {isCompareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#050b16] border border-cyan-500/40 rounded-2xl p-5 overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-slate-100 tracking-wider">FLEET COMPARISON MATRIX</h3>
              </div>
              <button
                onClick={() => setIsCompareOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Compared Ships Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 flex-1">
              {compareIds.map(id => {
                const ship = getShipDefinition(id);
                const rStyle = RARITY_CONFIG[ship.rarity];
                return (
                  <div key={id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-cyan-400">{ship.id}</span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                        style={{ color: rStyle.color, borderColor: rStyle.border }}
                      >
                        {ship.rarity}
                      </span>
                    </div>

                    <h4 className="font-black text-slate-100 text-sm">{ship.name}</h4>
                    <div className="text-xs font-mono text-slate-400">{ship.class}</div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">SPEED:</span>
                        <span className="font-bold text-slate-100">{ship.baseStats.maxSpeed} KM/H</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">ACCEL:</span>
                        <span className="font-bold text-slate-100">{ship.baseStats.acceleration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">HANDLING:</span>
                        <span className="font-bold text-slate-100">{ship.baseStats.handling}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">ARMOR:</span>
                        <span className="font-bold text-slate-100">{ship.baseStats.armor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">SHIELD:</span>
                        <span className="font-bold text-slate-100">{ship.baseStats.shield}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">BOOST:</span>
                        <span className="font-bold text-slate-100">{ship.baseStats.boost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">ENERGY:</span>
                        <span className="font-bold text-slate-100">{ship.baseStats.energy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">BEAM PWR:</span>
                        <span className="font-bold text-slate-100">{ship.baseStats.beamPower}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setSelectedShipId(ship.id);
                          setIsCompareOpen(false);
                        }}
                        className="w-full py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black font-mono font-bold text-xs transition-colors cursor-pointer"
                      >
                        INSPECT IN HANGAR
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CREDIT TRANSACTION HISTORY MODAL */}
      {/* ============================================================== */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="relative w-full max-w-lg max-h-[85vh] bg-[#050b16] border border-amber-500/40 rounded-2xl p-5 overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-slate-100 tracking-wider">VOID CREDITS LEDGER</h3>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 my-3 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
              <span className="font-mono text-xs text-amber-300 font-bold">CURRENT BALANCE</span>
              <span className="font-mono text-base font-black text-amber-200">
                ◈ {String(garageData.credits).padStart(6, '0')}
              </span>
            </div>

            {/* Transactions List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {garagePersistence.getTransactionHistory().map(tx => (
                <div
                  key={tx.id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between font-mono text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-200">{tx.description}</div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(tx.timestamp).toLocaleTimeString()} • BALANCE: ◈ {tx.balanceAfter}
                    </div>
                  </div>
                  <div
                    className={`font-black text-sm ${
                      tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
