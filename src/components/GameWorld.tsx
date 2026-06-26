/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ControlKeys, BlockType, BlockMeta } from '../types';
import { sound } from '../utils/audio';
import { 
  ArrowLeft, 
  RefreshCw, 
  Sparkles, 
  Award, 
  Eye, 
  Maximize, 
  Volume2, 
  Zap, 
  Compass, 
  Move, 
  Smile,
  Briefcase,
  Hammer
} from 'lucide-react';

interface GameWorldProps {
  customKeys: ControlKeys;
  onBackToMenu: () => void;
}

// Map of block properties
const BLOCKS_CONFIG: Record<BlockType, BlockMeta> = {
  grass: { type: 'grass', label: 'บล็อกหญ้า (Grass)', color: '#22c55e', border: '#15803d', textureSymbol: '░' },
  dirt: { type: 'dirt', label: 'บล็อกดิน (Dirt)', color: '#78350f', border: '#451a03', textureSymbol: '▓' },
  stone: { type: 'stone', label: 'บล็อกหิน (Stone)', color: '#6b7280', border: '#374151', textureSymbol: '▒' },
  wood: { type: 'wood', label: 'บล็อกไม้ (Oak Wood)', color: '#b45309', border: '#78350f', textureSymbol: '█' },
  leaves: { type: 'leaves', label: 'บล็อกใบไม้ (Leaves)', color: '#15803d', border: '#14532d', textureSymbol: '░' },
  diamond: { type: 'diamond', label: 'แร่เพชร (Diamond Ore)', color: '#06b6d4', border: '#0891b2', textureSymbol: '◆' },
  obsidian: { type: 'obsidian', label: 'บล็อกออบซิเดียน (Obsidian)', color: '#1e1b4b', border: '#0f172a', textureSymbol: '▣' },
  planks: { type: 'planks', label: 'แผ่นไม้แปรรูป (Wood Planks)', color: '#ca8a04', border: '#a16207', textureSymbol: '▤' },
  crafting_table: { type: 'crafting_table', label: 'โต๊ะคราฟต์ (Crafting Table)', color: '#a16207', border: '#78350f', textureSymbol: '⚃' },
  stone_brick: { type: 'stone_brick', label: 'บล็อกอิฐหิน (Stone Brick)', color: '#78716c', border: '#44403c', textureSymbol: '🧱' },
  tnt: { type: 'tnt', label: 'บล็อกระเบิด (TNT Block)', color: '#ef4444', border: '#991b1b', textureSymbol: '💥' },
  diamond_block: { type: 'diamond_block', label: 'บล็อกเพชรแท้ (Diamond Block)', color: '#22d3ee', border: '#0891b2', textureSymbol: '💎' },
  stick: { type: 'stick', label: 'ไม้สติ๊ก (Stick)', color: '#b45309', border: '#78350f', textureSymbol: '🥢' },
  diamond_pickaxe: { type: 'diamond_pickaxe', label: 'ที่ขุดเพชร (Diamond Pickaxe)', color: '#06b6d4', border: '#0891b2', textureSymbol: '⛏' },
  air: { type: 'air', label: 'อากาศ (Air)', color: 'transparent', border: 'transparent', textureSymbol: ' ' },
};

interface CraftingRecipe {
  id: string;
  result: BlockType;
  resultCount: number;
  label: string;
  ingredients: { type: BlockType; count: number }[];
  description: string;
}

const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'craft_planks',
    result: 'planks',
    resultCount: 4,
    label: 'แผ่นไม้แปรรูป (Wood Planks) x4',
    description: 'แปรรูปท่อนไม้ธรรมชาติให้เป็นแผ่นเรียบสำหรับใช้เป็นวัสดุก่อสร้าง และคราฟต์ไอเทมอื่นๆ',
    ingredients: [{ type: 'wood', count: 1 }],
  },
  {
    id: 'craft_stick',
    result: 'stick',
    resultCount: 4,
    label: 'ไม้สติ๊ก (Stick) x4',
    description: 'กิ่งไม้แกนยาวสำหรับใช้เป็นด้ามจับที่มั่นคงในการประกอบเครื่องมือต่างๆ',
    ingredients: [{ type: 'planks', count: 2 }],
  },
  {
    id: 'craft_table',
    result: 'crafting_table',
    resultCount: 1,
    label: 'โต๊ะคราฟต์ (Crafting Table) x1',
    description: 'โต๊ะช่างไม้พกพา ช่วยปลดล็อกการสร้างสรรค์สิ่งก่อสร้างระดับวิศวกรขั้นสูง',
    ingredients: [{ type: 'planks', count: 4 }],
  },
  {
    id: 'craft_stone_brick',
    result: 'stone_brick',
    resultCount: 4,
    label: 'บล็อกอิฐหิน (Stone Brick) x4',
    description: 'ก้อนหินธรรมชาติผ่านการตัดแต่งลวดลายอิฐสวยงาม เหมาะแก่การก่อสร้างบ้านและกำแพง',
    ingredients: [{ type: 'stone', count: 4 }],
  },
  {
    id: 'craft_tnt',
    result: 'tnt',
    resultCount: 1,
    label: 'บล็อกระเบิด (TNT Block) x1',
    description: 'ก้อนวัตถุระเบิดดินทำลายล้างสูง ทำจากการผสมวัสดุดินและใบไม้บดอัดแน่นเข้าด้วยกัน',
    ingredients: [
      { type: 'dirt', count: 4 },
      { type: 'leaves', count: 4 },
    ],
  },
  {
    id: 'craft_diamond_block',
    result: 'diamond_block',
    resultCount: 1,
    label: 'บล็อกเพชรแท้ (Diamond Block) x1',
    description: 'บล็อกแร่เพชรบริสุทธิ์สีฟ้าระยิบระยับ บ่งบอกถึงบารมีและความมั่งคั่งมหาศาล',
    ingredients: [{ type: 'diamond', count: 9 }],
  },
  {
    id: 'craft_diamond_pickaxe',
    result: 'diamond_pickaxe',
    resultCount: 1,
    label: 'ที่ขุดเพชร (Diamond Pickaxe) x1',
    description: 'ที่ขุดเพชรขั้นสุดยอด! ช่วยเพิ่มอัตราการขุดทำลายบล็อกทุกชนิดเร็วขึ้นทันที 3 เท่า!',
    ingredients: [
      { type: 'diamond', count: 3 },
      { type: 'stick', count: 2 },
    ],
  },
];

// Texture cache to prevent memory leaks
const texturesCache: Record<string, THREE.CanvasTexture> = {};

function getVoxelTexture(type: BlockType, face: 'top' | 'side' | 'bottom'): THREE.Texture {
  const cacheKey = `${type}_${face}`;
  if (texturesCache[cacheKey]) return texturesCache[cacheKey];

  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;

  // Resolve base pixelated block color
  let baseColor = '#78350f';
  if (type === 'grass') {
    baseColor = face === 'top' ? '#22c55e' : (face === 'bottom' ? '#78350f' : '#4f7d2f');
  } else if (type === 'dirt') {
    baseColor = '#653c15';
  } else if (type === 'stone') {
    baseColor = '#737373';
  } else if (type === 'wood') {
    baseColor = face === 'top' ? '#d9a05b' : '#854d0e';
  } else if (type === 'leaves') {
    baseColor = '#166534';
  } else if (type === 'diamond') {
    baseColor = '#525252'; // stone backer
  } else if (type === 'obsidian') {
    baseColor = '#120f26';
  } else if (type === 'planks') {
    baseColor = '#ca8a04';
  } else if (type === 'crafting_table') {
    baseColor = face === 'top' ? '#ca8a04' : (face === 'bottom' ? '#78350f' : '#a16207');
  } else if (type === 'stone_brick') {
    baseColor = '#6b7280';
  } else if (type === 'tnt') {
    baseColor = face === 'top' || face === 'bottom' ? '#ef4444' : '#dc2626';
  } else if (type === 'diamond_block') {
    baseColor = '#22d3ee';
  } else if (type === 'stick') {
    baseColor = '#a16207';
  } else if (type === 'diamond_pickaxe') {
    baseColor = '#3f3f46';
  }

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 16, 16);

  // Add 3D noise pixelated detail blocks
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      const r = Math.random();
      if (r < 0.18) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(x, y, 1, 1);
      } else if (r < 0.32) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  // Draw overlay traits
  if (type === 'grass' && face === 'side') {
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, 0, 16, 4);
    for (let x = 0; x < 16; x++) {
      if (Math.random() < 0.7) {
        ctx.fillRect(x, 4, 1, Math.floor(Math.random() * 3) + 1);
      }
    }
  } else if (type === 'diamond') {
    ctx.fillStyle = '#22d3ee'; // cyan minerals
    ctx.fillRect(2, 3, 2, 2);
    ctx.fillRect(9, 10, 3, 3);
    ctx.fillRect(12, 2, 2, 2);
    ctx.fillRect(3, 11, 2, 2);
    ctx.fillStyle = '#e0f7fa'; // specular sparkler
    ctx.fillRect(10, 11, 1, 1);
  } else if (type === 'wood' && face === 'side') {
    ctx.fillStyle = '#451a03'; // Bark vertical cuts
    ctx.fillRect(3, 0, 2, 16);
    ctx.fillRect(11, 0, 2, 16);
  } else if (type === 'obsidian') {
    ctx.fillStyle = '#4c1d95'; // dark glowing magical obsidian core
    ctx.fillRect(4, 4, 2, 2);
    ctx.fillRect(10, 9, 2, 2);
    ctx.fillStyle = '#2e1065';
    ctx.fillRect(8, 2, 1, 1);
  } else if (type === 'leaves') {
    // dark leaf details
    ctx.fillStyle = '#14532d';
    ctx.fillRect(2, 2, 3, 1);
    ctx.fillRect(8, 9, 4, 1);
    ctx.fillRect(11, 3, 2, 2);
  } else if (type === 'planks') {
    ctx.fillStyle = '#78350f'; // plank horizontal seam lines
    ctx.fillRect(0, 4, 16, 1);
    ctx.fillRect(0, 9, 16, 1);
    ctx.fillRect(0, 13, 16, 1);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(4, 0, 1, 4);
    ctx.fillRect(11, 4, 1, 5);
    ctx.fillRect(6, 9, 1, 4);
  } else if (type === 'crafting_table') {
    if (face === 'top') {
      ctx.fillStyle = '#78350f'; // table grid lines
      ctx.fillRect(0, 0, 16, 1);
      ctx.fillRect(0, 15, 16, 1);
      ctx.fillRect(0, 0, 1, 16);
      ctx.fillRect(15, 0, 1, 16);
      ctx.fillRect(4, 4, 8, 8);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(5, 5, 6, 6);
    } else {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 0, 16, 2); // top wood plank strip
      ctx.fillStyle = '#e2e8f0'; // metal iron saw hanging on side
      ctx.fillRect(3, 4, 2, 8);
      ctx.fillStyle = '#78350f'; // tool grip handle
      ctx.fillRect(2, 11, 4, 2);
    }
  } else if (type === 'stone_brick') {
    ctx.fillStyle = '#44403c'; // mortar lines
    ctx.fillRect(0, 5, 16, 1);
    ctx.fillRect(0, 11, 16, 1);
    ctx.fillRect(4, 0, 1, 5);
    ctx.fillRect(12, 0, 1, 5);
    ctx.fillRect(8, 5, 1, 6);
    ctx.fillRect(2, 11, 1, 5);
    ctx.fillRect(10, 11, 1, 5);
  } else if (type === 'tnt') {
    if (face === 'top' || face === 'bottom') {
      ctx.fillStyle = '#1e293b'; // fuse string center
      ctx.fillRect(7, 7, 2, 2);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(6, 6, 1, 1);
      ctx.fillRect(9, 8, 1, 1);
    } else {
      ctx.fillStyle = '#ffffff'; // white paper band middle
      ctx.fillRect(0, 5, 16, 6);
      ctx.fillStyle = '#000000'; // letter T N T
      // T
      ctx.fillRect(2, 6, 3, 1);
      ctx.fillRect(3, 7, 1, 3);
      // N
      ctx.fillRect(6, 6, 1, 4);
      ctx.fillRect(7, 7, 1, 1);
      ctx.fillRect(8, 6, 1, 4);
      // T
      ctx.fillRect(11, 6, 3, 1);
      ctx.fillRect(12, 7, 1, 3);
    }
  } else if (type === 'diamond_block') {
    ctx.fillStyle = '#e0f7fa'; // specular highlights
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 0, 1, 16);
    ctx.fillStyle = '#0891b2'; // darker cyan bounds
    ctx.fillRect(0, 15, 16, 1);
    ctx.fillRect(15, 0, 1, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, 4, 2, 2);
    ctx.fillRect(10, 10, 2, 2);
  } else if (type === 'stick') {
    // Diagonal wood rod stick
    ctx.fillStyle = '#78350f';
    for (let i = 0; i < 11; i++) {
      ctx.fillRect(2 + i, 13 - i, 2, 2);
    }
  } else if (type === 'diamond_pickaxe') {
    // Diagonal wooden stick shaft
    ctx.fillStyle = '#78350f';
    for (let i = 0; i < 9; i++) {
      ctx.fillRect(2 + i, 13 - i, 1.5, 1.5);
    }
    // Blue diamond pick head curved
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(10, 1, 5, 2);
    ctx.fillRect(13, 2, 2, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(14, 1, 1, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texturesCache[cacheKey] = texture;
  return texture;
}

const materialsCache: Record<string, THREE.Material[]> = {};

function getVoxelMaterials(type: BlockType): THREE.Material[] {
  if (materialsCache[type]) return materialsCache[type];

  const mats: THREE.Material[] = [];
  const createMaterial = (face: 'top' | 'side' | 'bottom') => {
    return new THREE.MeshStandardMaterial({
      map: getVoxelTexture(type, face),
      roughness: 0.85,
      metalness: 0.05,
    });
  };

  if (type === 'grass') {
    mats.push(createMaterial('side')); // +X
    mats.push(createMaterial('side')); // -X
    mats.push(createMaterial('top'));  // +Y
    mats.push(createMaterial('bottom'));// -Y
    mats.push(createMaterial('side')); // +Z
    mats.push(createMaterial('side')); // -Z
  } else if (type === 'wood') {
    mats.push(createMaterial('side')); // +X
    mats.push(createMaterial('side')); // -X
    mats.push(createMaterial('top'));  // +Y
    mats.push(createMaterial('top'));  // -Y
    mats.push(createMaterial('side')); // +Z
    mats.push(createMaterial('side')); // -Z
  } else if (type === 'crafting_table') {
    mats.push(createMaterial('side')); // +X
    mats.push(createMaterial('side')); // -X
    mats.push(createMaterial('top'));  // +Y
    mats.push(createMaterial('bottom'));// -Y
    mats.push(createMaterial('side')); // +Z
    mats.push(createMaterial('side')); // -Z
  } else if (type === 'tnt') {
    mats.push(createMaterial('side')); // +X
    mats.push(createMaterial('side')); // -X
    mats.push(createMaterial('top'));  // +Y
    mats.push(createMaterial('top'));  // -Y
    mats.push(createMaterial('side')); // +Z
    mats.push(createMaterial('side')); // -Z
  } else {
    const defaultMat = createMaterial('side');
    for (let i = 0; i < 6; i++) {
      mats.push(defaultMat);
    }
  }

  materialsCache[type] = mats;
  return mats;
}

export default function GameWorld({ customKeys, onBackToMenu }: GameWorldProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Voxel 3D Grid Dimensions
  const worldSizeX = 20;
  const worldSizeY = 14;
  const worldSizeZ = 20;

  // React local score metrics & inventories
  const [score, setScore] = useState(0);
  const [minedCount, setMinedCount] = useState<Record<BlockType, number>>({
    grass: 12, dirt: 16, stone: 10, wood: 8, leaves: 10, diamond: 0, obsidian: 0,
    planks: 0, crafting_table: 0, stone_brick: 0, tnt: 0, diamond_block: 0, stick: 0, diamond_pickaxe: 0, air: 0
  });
  const [latestAward, setLatestAward] = useState<string | null>(null);
  const [activeSelectedBlock, setActiveSelectedBlock] = useState<BlockType>('grass');
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [creativeFlight, setCreativeFlight] = useState(false);

  // Inventory and Crafting UI states
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [activeInventoryTab, setActiveInventoryTab] = useState<'inventory' | 'crafting'>('inventory');
  const [survivalMode, setSurvivalMode] = useState(true);

  // Sound option toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Keys Down state tracking
  const keysDown = useRef<Record<string, boolean>>({});
  
  // Game state reference for Three.js animation frame access
  const gameStateRef = useRef({
    world: {} as Record<string, BlockType>,
    playerPos: new THREE.Vector3(10.5, 9.0, 10.5),
    playerVel: new THREE.Vector3(0, 0, 0),
    isGrounded: false,
    yaw: -Math.PI / 4,
    pitch: -Math.PI / 8,
    activeSelectedBlock: 'grass' as BlockType,
    score: 0,
    minedCount: { 
      grass: 12, dirt: 16, stone: 10, wood: 8, leaves: 10, diamond: 0, obsidian: 0,
      planks: 0, crafting_table: 0, stone_brick: 0, tnt: 0, diamond_block: 0, stick: 0, diamond_pickaxe: 0, air: 0
    } as Record<BlockType, number>,
    miningTarget: null as { x: number, y: number, z: number, progress: number } | null,
    creativeFlight: false,
  });

  // Hotbar Numeric Keys 1-7 Selection
  useEffect(() => {
    const handleNumericSelect = (e: KeyboardEvent) => {
      const indexMap: Record<string, BlockType> = {
        '1': 'grass',
        '2': 'dirt',
        '3': 'stone',
        '4': 'wood',
        '5': 'leaves',
        '6': 'diamond',
        '7': 'obsidian'
      };
      if (e.key in indexMap) {
        const type = indexMap[e.key];
        setActiveSelectedBlock(type);
        gameStateRef.current.activeSelectedBlock = type;
        if (soundEnabled) sound.playClick();
      }
    };
    window.addEventListener('keydown', handleNumericSelect);
    return () => window.removeEventListener('keydown', handleNumericSelect);
  }, [soundEnabled]);

  // Bind keys mappings based on customKeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyStr = e.key.toLowerCase();
      const codeStr = e.code.toLowerCase();

      const isMatch = (targetKey: string) => {
        const cleanedTarget = targetKey.toLowerCase();
        if (cleanedTarget === 'space' && (keyStr === ' ' || codeStr === 'space')) return true;
        return keyStr === cleanedTarget || codeStr === cleanedTarget;
      };

      if (isMatch(customKeys.forward)) keysDown.current.forward = true;
      if (isMatch(customKeys.backward)) keysDown.current.backward = true;
      if (isMatch(customKeys.left)) keysDown.current.left = true;
      if (isMatch(customKeys.right)) keysDown.current.right = true;
      if (isMatch(customKeys.jump)) keysDown.current.jump = true;
      if (isMatch(customKeys.mine)) keysDown.current.mine = true;
      if (isMatch(customKeys.place)) keysDown.current.place = true;

      // Handle custom inventory screen toggling
      if (isMatch(customKeys.inventory)) {
        setIsInventoryOpen(prev => {
          const next = !prev;
          if (next) {
            document.exitPointerLock();
          }
          if (soundEnabled) sound.playClick();
          return next;
        });
      }

      // Handle custom flight toggle with 'F' or double press space
      if (e.key.toLowerCase() === 'f') {
        setCreativeFlight(prev => {
          const next = !prev;
          gameStateRef.current.creativeFlight = next;
          setLatestAward(next ? 'เปิดใช้งานโหมดบินอิสระ (Fly Mode)!' : 'สลับกลับเป็นโหมดจำลองแรงโน้มถ่วง');
          setTimeout(() => setLatestAward(null), 3000);
          if (soundEnabled) sound.playSelect();
          return next;
        });
      }

      // Handle custom game mode toggle with 'N'
      if (e.key.toLowerCase() === 'n') {
        setSurvivalMode(prev => {
          const next = !prev;
          setLatestAward(next ? 'สลับเข้าสู่โหมดเอาชีวิตรอด! บล็อกจะหมดไปเมื่อใช้งาน' : 'สลับเข้าสู่โหมดสร้างสรรค์! วางบล็อกได้ไม่จำกัดจำนวน');
          setTimeout(() => setLatestAward(null), 3000);
          if (soundEnabledRef.current) sound.playSelect();
          return next;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keyStr = e.key.toLowerCase();
      const codeStr = e.code.toLowerCase();

      const isMatch = (targetKey: string) => {
        const cleanedTarget = targetKey.toLowerCase();
        if (cleanedTarget === 'space' && (keyStr === ' ' || codeStr === 'space')) return true;
        return keyStr === cleanedTarget || codeStr === cleanedTarget;
      };

      if (isMatch(customKeys.forward)) keysDown.current.forward = false;
      if (isMatch(customKeys.backward)) keysDown.current.backward = false;
      if (isMatch(customKeys.left)) keysDown.current.left = false;
      if (isMatch(customKeys.right)) keysDown.current.right = false;
      if (isMatch(customKeys.jump)) keysDown.current.jump = false;
      if (isMatch(customKeys.mine)) keysDown.current.mine = false;
      if (isMatch(customKeys.place)) keysDown.current.place = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [customKeys, soundEnabled]);

  // Handle pointer lock state event listeners
  useEffect(() => {
    const handleLockChange = () => {
      const container = containerRef.current;
      if (!container) return;
      const canvas = container.querySelector('canvas');
      const isLocked = document.pointerLockElement === canvas;
      setIsPointerLocked(isLocked);
    };
    document.addEventListener('pointerlockchange', handleLockChange);
    return () => document.removeEventListener('pointerlockchange', handleLockChange);
  }, []);

  // Sync React state to refs so the Three.js loop can read them in real-time
  const isInventoryOpenRef = useRef(false);
  useEffect(() => {
    isInventoryOpenRef.current = isInventoryOpen;
  }, [isInventoryOpen]);

  const activeSelectedBlockRef = useRef<BlockType>('grass');
  useEffect(() => {
    activeSelectedBlockRef.current = activeSelectedBlock;
  }, [activeSelectedBlock]);

  const survivalModeRef = useRef(true);
  useEffect(() => {
    survivalModeRef.current = survivalMode;
  }, [survivalMode]);

  const soundEnabledRef = useRef(true);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Main Three.js Sandbox World Logic
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clean up previous elements
    container.innerHTML = '';

    // Initialize WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    const rect = container.getBoundingClientRect();
    renderer.setSize(rect.width, Math.max(500, window.innerHeight - 320));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Initialize Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#38bdf8'); // Sky blue
    scene.fog = new THREE.FogExp2('#38bdf8', 0.03); // Minecraft realistic distance fogging

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      rect.width / Math.max(500, window.innerHeight - 320),
      0.1,
      1000
    );
    camera.rotation.order = 'YXZ';

    // Lighting (Daylight sun & deep voxel ambient shading)
    const ambientLight = new THREE.AmbientLight('#fef08a', 0.55); // Warm ambient light
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#ffffff', 0.9);
    sunLight.position.set(20, 35, 15);
    sunLight.castShadow = true;
    
    // Shadow tuning
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    const d = 25;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Grid World creation & seeding helpers
    const gridKey = (x: number, y: number, z: number) => `${x},${y},${z}`;
    const worldGrid: Record<string, BlockType> = {};
    const meshesMap: Record<string, THREE.Mesh> = {};
    const blockGroup = new THREE.Group();
    scene.add(blockGroup);

    // Shared geometry
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

    const addBlockToScene = (x: number, y: number, z: number, type: BlockType) => {
      if (type === 'air') return;
      const key = gridKey(x, y, z);
      
      const materials = getVoxelMaterials(type);
      const mesh = new THREE.Mesh(cubeGeometry, materials);
      mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { gx: x, gy: y, gz: z, blockType: type };
      
      blockGroup.add(mesh);
      meshesMap[key] = mesh;
    };

    const removeBlockFromScene = (x: number, y: number, z: number) => {
      const key = gridKey(x, y, z);
      const mesh = meshesMap[key];
      if (mesh) {
        blockGroup.remove(mesh);
        mesh.geometry.dispose();
        delete meshesMap[key];
      }
    };

    // Populate initial world grid
    for (let x = 0; x < worldSizeX; x++) {
      for (let z = 0; z < worldSizeZ; z++) {
        for (let y = 0; y < worldSizeY; y++) {
          let type: BlockType = 'air';

          if (y <= 3) {
            // stone layers
            if (y <= 1 && Math.random() < 0.12) {
              type = 'obsidian';
            } else if (y >= 2 && y <= 3 && Math.random() < 0.08) {
              type = 'diamond';
            } else {
              type = 'stone';
            }
          } else if (y <= 5) {
            // dirt layers
            type = 'dirt';
          } else if (y === 6) {
            // grass level top layer
            type = 'grass';
          }

          if (type !== 'air') {
            worldGrid[gridKey(x, y, z)] = type;
            addBlockToScene(x, y, z, type);
          }
        }
      }
    }

    // Spawn 3D Minecraft Trees procedurally
    const treeCoords = [
      { x: 4, z: 4 },
      { x: 15, z: 5 },
      { x: 5, z: 14 },
      { x: 14, z: 15 }
    ];

    treeCoords.forEach((coord) => {
      // Wood trunk
      for (let ty = 7; ty <= 10; ty++) {
        const key = gridKey(coord.x, ty, coord.z);
        worldGrid[key] = 'wood';
        addBlockToScene(coord.x, ty, coord.z, 'wood');
      }
      // Leaves crown
      for (let lx = coord.x - 1; lx <= coord.x + 1; lx++) {
        for (let lz = coord.z - 1; lz <= coord.z + 1; lz++) {
          for (let ly = 10; ly <= 11; ly++) {
            if (lx === coord.x && lz === coord.z && ly === 10) continue; // skip trunk intersection
            const key = gridKey(lx, ly, lz);
            if (!worldGrid[key] || worldGrid[key] === 'air') {
              worldGrid[key] = 'leaves';
              addBlockToScene(lx, ly, lz, 'leaves');
            }
          }
        }
      }
      // Tree crown tip leaf
      const tipKey = gridKey(coord.x, 12, coord.z);
      worldGrid[tipKey] = 'leaves';
      addBlockToScene(coord.x, 12, coord.z, 'leaves');
    });

    gameStateRef.current.world = worldGrid;

    // Target selector wireframe block highlight
    const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02));
    const targetWireframe = new THREE.LineSegments(
      edgeGeo,
      new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2.5 })
    );
    targetWireframe.visible = false;
    scene.add(targetWireframe);

    // Holding block asset in bottom-right corner (Steve active block hand view)
    const handGroup = new THREE.Group();
    camera.add(handGroup);
    scene.add(camera);

    const handBlockMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24));
    handBlockMesh.position.set(0.38, -0.32, -0.65);
    handBlockMesh.rotation.set(0.2, -0.4, 0.1);
    handGroup.add(handBlockMesh);

    // Raycaster for mining and placing blocks
    const raycaster = new THREE.Raycaster();
    const mouseCenter = new THREE.Vector2(0, 0);

    // Particle pool for block digging/breaking bursts
    const particlesGroup = new THREE.Group();
    scene.add(particlesGroup);
    interface Particle {
      mesh: THREE.Mesh;
      velocity: THREE.Vector3;
      life: number;
    }
    const activeParticles: Particle[] = [];

    const spawnBlockParticles = (x: number, y: number, z: number, colorStr: string) => {
      const pCount = 14;
      const partGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const partMat = new THREE.MeshBasicMaterial({ color: colorStr });

      for (let i = 0; i < pCount; i++) {
        const mesh = new THREE.Mesh(partGeo, partMat);
        mesh.position.set(x + 0.5 + (Math.random() - 0.5) * 0.5, y + 0.5 + (Math.random() - 0.5) * 0.5, z + 0.5 + (Math.random() - 0.5) * 0.5);
        particlesGroup.add(mesh);

        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 0.14,
          Math.random() * 0.16 + 0.05,
          (Math.random() - 0.5) * 0.14
        );
        activeParticles.push({ mesh, velocity, life: 1.0 });
      }
    };

    // Client-side mouse drag / Touch look state logic
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    const handleCanvasMouseDown = (e: MouseEvent) => {
      // If inventory is open, do not handle canvas clicks
      if (isInventoryOpenRef.current) return;

      const canvas = renderer.domElement;
      if (e.button === 0) {
        // Left click initiates Pointer Lock on direct click on canvas
        if (document.pointerLockElement !== canvas) {
          canvas.requestPointerLock();
        } else {
          isMouseDownLeft = true;
        }
      } else if (e.button === 2) {
        isMouseDownRight = true;
      }

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
    };

    const handleCanvasMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === renderer.domElement) {
        gameStateRef.current.yaw -= e.movementX * 0.0025;
        gameStateRef.current.pitch -= e.movementY * 0.0025;
      } else if (isDragging) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        gameStateRef.current.yaw -= dx * 0.005;
        gameStateRef.current.pitch -= dy * 0.005;
        startX = e.clientX;
        startY = e.clientY;
      }
      // Clamp pitch look angle to avoid flipping camera backwards
      gameStateRef.current.pitch = Math.max(-Math.PI / 2.05, Math.min(Math.PI / 2.05, gameStateRef.current.pitch));
    };

    const handleCanvasMouseUp = (e: MouseEvent) => {
      if (e.button === 0) isMouseDownLeft = false;
      if (e.button === 2) isMouseDownRight = false;
      isDragging = false;
    };

    const handleCanvasTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    };

    const handleCanvasTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length === 1) {
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        gameStateRef.current.yaw -= dx * 0.006;
        gameStateRef.current.pitch -= dy * 0.006;
        gameStateRef.current.pitch = Math.max(-Math.PI / 2.05, Math.min(Math.PI / 2.05, gameStateRef.current.pitch));
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleCanvasMouseDown);
    window.addEventListener('mousemove', handleCanvasMouseMove);
    window.addEventListener('mouseup', handleCanvasMouseUp);
    dom.addEventListener('touchstart', handleCanvasTouchStart, { passive: true });
    dom.addEventListener('touchmove', handleCanvasTouchMove, { passive: true });
    dom.addEventListener('touchend', () => { isDragging = false; });

    // Internal input triggers inside active frame loops
    let isMouseDownLeft = false;
    let isMouseDownRight = false;
    let placeBlockCooldown = 0;
    let walkBobbingTime = 0;
    let handSwingTime = 0;

    // Helper functions for grid collision checks
    const getBlockAtCoords = (bx: number, by: number, bz: number): BlockType => {
      const fx = Math.floor(bx);
      const fy = Math.floor(by);
      const fz = Math.floor(bz);
      if (fx < 0 || fx >= worldSizeX || fy < 0 || fy >= worldSizeY || fz < 0 || fz >= worldSizeZ) {
        return 'air';
      }
      return worldGrid[gridKey(fx, fy, fz)] || 'air';
    };

    const isPlayerCollidingAt = (px: number, py: number, pz: number) => {
      const rad = 0.35; // bounding box horizontal width bounds
      const h = 1.75;  // tallness height bounds
      
      const minX = Math.floor(px - rad);
      const maxX = Math.floor(px + rad);
      const minY = Math.floor(py);
      const maxY = Math.floor(py + h);
      const minZ = Math.floor(pz - rad);
      const maxZ = Math.floor(pz + rad);

      for (let cx = minX; cx <= maxX; cx++) {
        for (let cy = minY; cy <= maxY; cy++) {
          for (let cz = minZ; cz <= maxZ; cz++) {
            const block = getBlockAtCoords(cx, cy, cz);
            if (block && block !== 'air') {
              return true; // intersection detected!
            }
          }
        }
      }
      return false;
    };

    // Game loop ticks
    let animationId: number;
    
    const tick = () => {
      const gs = gameStateRef.current;

      // Update held block mesh appearance
      if (handBlockMesh.userData.currentBlockType !== activeSelectedBlock) {
        handBlockMesh.material = getVoxelMaterials(activeSelectedBlock);
        handBlockMesh.userData.currentBlockType = activeSelectedBlock;
      }

      // Decrement place cooldowns
      if (placeBlockCooldown > 0) placeBlockCooldown--;

      // Render 3D particles physics simulation
      for (let i = activeParticles.length - 1; i >= 0; i--) {
        const p = activeParticles[i];
        p.velocity.y -= 0.007; // gravity rate
        p.mesh.position.add(p.velocity);
        p.life -= 0.024;
        p.mesh.scale.setScalar(p.life);
        
        if (p.life <= 0) {
          particlesGroup.remove(p.mesh);
          p.mesh.geometry.dispose();
          activeParticles.splice(i, 1);
        }
      }

      // --- MOVEMENT PHYSICS (Walking & Gravity inside 3D environment) ---
      const sinY = Math.sin(gs.yaw);
      const cosY = Math.cos(gs.yaw);
      let moveDirX = 0;
      let moveDirZ = 0;

      if (keysDown.current.forward) {
        moveDirX -= sinY;
        moveDirZ -= cosY;
      }
      if (keysDown.current.backward) {
        moveDirX += sinY;
        moveDirZ += cosY;
      }
      if (keysDown.current.left) {
        moveDirX -= cosY;
        moveDirZ += sinY;
      }
      if (keysDown.current.right) {
        moveDirX += cosY;
        moveDirZ -= sinY;
      }

      // Walk velocity scaling
      const walkSpeedMultiplier = gs.creativeFlight ? 0.16 : 0.075;
      const walkLength = Math.sqrt(moveDirX * moveDirX + moveDirZ * moveDirZ);
      if (walkLength > 0) {
        moveDirX /= walkLength;
        moveDirZ /= walkLength;
        gs.playerVel.x = moveDirX * walkSpeedMultiplier;
        gs.playerVel.z = moveDirZ * walkSpeedMultiplier;
        
        // Bobbing sway effect when moving on surface
        if (gs.isGrounded) {
          walkBobbingTime += 0.22;
          camera.position.y += Math.sin(walkBobbingTime) * 0.012;
        }
      } else {
        // High surface friction deceleration
        gs.playerVel.x *= 0.55;
        gs.playerVel.z *= 0.55;
      }

      // Vertical movement & gravity
      if (gs.creativeFlight) {
        // Fly controls: Jump goes up, backward/custom goes down or float still
        if (keysDown.current.jump) {
          gs.playerVel.y = 0.15;
        } else if (keysDown.current.backward && keysDown.current.jump) {
          gs.playerVel.y = -0.15;
        } else {
          // Hover flight dampener
          gs.playerVel.y *= 0.7;
        }
      } else {
        // Standard gravity
        gs.playerVel.y -= 0.009; // Gravity pull rate
        if (gs.playerVel.y < -0.3) gs.playerVel.y = -0.3; // Terminal fall velocity

        // Jump physics
        if (keysDown.current.jump && gs.isGrounded) {
          gs.playerVel.y = 0.165;
          gs.isGrounded = false;
          if (soundEnabled) sound.playJump();
        }
      }

      // Check collision and apply horizontal axis displacements independently
      gs.playerPos.x += gs.playerVel.x;
      if (isPlayerCollidingAt(gs.playerPos.x, gs.playerPos.y, gs.playerPos.z)) {
        gs.playerPos.x -= gs.playerVel.x;
        gs.playerVel.x = 0;
      }

      gs.playerPos.z += gs.playerVel.z;
      if (isPlayerCollidingAt(gs.playerPos.x, gs.playerPos.y, gs.playerPos.z)) {
        gs.playerPos.z -= gs.playerVel.z;
        gs.playerVel.z = 0;
      }

      gs.playerPos.y += gs.playerVel.y;
      if (isPlayerCollidingAt(gs.playerPos.x, gs.playerPos.y, gs.playerPos.z)) {
        if (gs.playerVel.y < 0) {
          gs.isGrounded = true;
        }
        gs.playerPos.y -= gs.playerVel.y;
        gs.playerVel.y = 0;
      } else {
        gs.isGrounded = false;
      }

      // Prevent bottomless world drops (Void boundary check)
      if (gs.playerPos.y < -15) {
        gs.playerPos.set(10.5, 11.0, 10.5);
        gs.playerVel.set(0, 0, 0);
        if (soundEnabled) sound.playSuccess();
      }

      // Set First-Person camera coords
      camera.position.set(gs.playerPos.x, gs.playerPos.y + 1.55, gs.playerPos.z);
      camera.rotation.y = gs.yaw;
      camera.rotation.x = gs.pitch;

      // Animating the held voxel block hand sway
      if (walkLength > 0 && gs.isGrounded) {
        handBlockMesh.position.y = -0.32 + Math.sin(walkBobbingTime * 2) * 0.015;
        handBlockMesh.position.x = 0.38 + Math.cos(walkBobbingTime) * 0.01;
      } else {
        handBlockMesh.position.y = -0.32;
        handBlockMesh.position.x = 0.38;
      }

      // Held item swing animation logic when mining or placing
      if (handSwingTime > 0) {
        handSwingTime -= 0.12;
        handBlockMesh.rotation.z = Math.sin(handSwingTime * Math.PI) * 0.45;
        handBlockMesh.rotation.x = 0.2 + Math.sin(handSwingTime * Math.PI) * 0.3;
      } else {
        handBlockMesh.rotation.set(0.2, -0.4, 0.1);
      }

      // --- VOXEL TARGETING RAYCAST MECHANICS ---
      raycaster.setFromCamera(mouseCenter, camera);
      const intersects = raycaster.intersectObjects(blockGroup.children);

      let targetFound = false;

      if (intersects.length > 0) {
        const intersection = intersects[0];
        // Enforce maximum reach zone (6.5 blocks distance)
        if (intersection.distance <= 6.5) {
          const targetedMesh = intersection.object as THREE.Mesh;
          const { gx, gy, gz, blockType } = targetedMesh.userData;

          targetWireframe.position.set(gx + 0.5, gy + 0.5, gz + 0.5);
          targetWireframe.visible = true;
          targetFound = true;

          // MINING & DIGGING OPERATION LOGIC
          const miningActive = keysDown.current.mine || isMouseDownLeft;
          if (miningActive) {
            handSwingTime = 1.0; // trigger swing hand block animation

            if (!gs.miningTarget || gs.miningTarget.x !== gx || gs.miningTarget.y !== gy || gs.miningTarget.z !== gz) {
              gs.miningTarget = { x: gx, y: gy, z: gz, progress: 0 };
            } else {
              // Dig speed depends slightly on durability
              let speedFactor = 4.2;
              if (blockType === 'obsidian') speedFactor = 1.5; // slow
              else if (blockType === 'diamond') speedFactor = 2.5;
              else if (blockType === 'leaves') speedFactor = 9.0; // super fast

              // Increase mining speed by 3x if holding diamond pickaxe!
              if (activeSelectedBlockRef.current === 'diamond_pickaxe') {
                speedFactor *= 3.0;
              }

              gs.miningTarget.progress += speedFactor;

              // sound feedback while grinding block
              if (Math.floor(gs.miningTarget.progress) % 15 < 2) {
                if (soundEnabled) sound.playMine();
              }

              // Drop subtle crack chips particles during mine progress
              if (Math.random() < 0.25) {
                spawnBlockParticles(gx, gy, gz, BLOCKS_CONFIG[blockType]?.color || '#ffffff');
              }

              if (gs.miningTarget.progress >= 100) {
                // BREAK BLOCK SUCCESS!
                if (soundEnabled) sound.playMine();
                removeBlockFromScene(gx, gy, gz);
                delete worldGrid[gridKey(gx, gy, gz)];
                
                // Spawn break explosion debris
                spawnBlockParticles(gx, gy, gz, BLOCKS_CONFIG[blockType]?.color || '#ffffff');

                // Track and award points
                const bonusPoints: Record<BlockType, number> = {
                  diamond: 120, obsidian: 85, wood: 25, stone: 15, grass: 5, dirt: 5, leaves: 3, air: 0,
                  planks: 10, crafting_table: 20, stone_brick: 15, tnt: 30, diamond_block: 150, stick: 0, diamond_pickaxe: 0
                };
                const awardScore = bonusPoints[blockType] || 5;

                setScore(prev => prev + awardScore);

                // Add to inventory count
                const currentType = blockType;
                gs.minedCount[currentType] = (gs.minedCount[currentType] || 0) + 1;
                setMinedCount({ ...gs.minedCount });

                // Check achievements
                if (currentType === 'diamond' && gs.minedCount.diamond === 1) {
                  setLatestAward('สำเร็จรางวัล: นักขุดเพชรมือใหม่! (+120 คะแนน)');
                  setTimeout(() => setLatestAward(null), 3500);
                } else if (currentType === 'obsidian' && gs.minedCount.obsidian === 1) {
                  setLatestAward('สำเร็จรางวัล: สู่ความคงกระพัน! ได้ออบซิเดียนแล้ว (+85 คะแนน)');
                  setTimeout(() => setLatestAward(null), 3500);
                }

                gs.miningTarget = null;
              }
            }
          }

          // PLACING BLOCK COOLDOWN LOGIC
          const placingActive = keysDown.current.place || isMouseDownRight;
          if (placingActive && placeBlockCooldown === 0) {
            handSwingTime = 1.0;
            placeBlockCooldown = 11; // 11 frames delay cooldown

            const normal = intersection.face?.normal;
            if (normal) {
              const nx = gx + Math.round(normal.x);
              const ny = gy + Math.round(normal.y);
              const nz = gz + Math.round(normal.z);

              // Boundary constraint checks for placements
              if (nx >= 0 && nx < worldSizeX && ny >= 0 && ny < worldSizeY && nz >= 0 && nz < worldSizeZ) {
                // Check if target coordinates collide with player bounding size
                const minPlayerX = gs.playerPos.x - 0.35;
                const maxPlayerX = gs.playerPos.x + 0.35;
                const minPlayerY = gs.playerPos.y;
                const maxPlayerY = gs.playerPos.y + 1.75;
                const minPlayerZ = gs.playerPos.z - 0.35;
                const maxPlayerZ = gs.playerPos.z + 0.35;

                const overlapsPlayer = (nx >= Math.floor(minPlayerX) && nx <= Math.floor(maxPlayerX)) &&
                                       (ny >= Math.floor(minPlayerY) && ny <= Math.floor(maxPlayerY)) &&
                                       (nz >= Math.floor(minPlayerZ) && nz <= Math.floor(maxPlayerZ));

                const currentVal = worldGrid[gridKey(nx, ny, nz)];
                if (!overlapsPlayer && (!currentVal || currentVal === 'air')) {
                  // Determine if we can place this block type
                  const currentBlock = activeSelectedBlockRef.current;
                  const inventoryCount = gs.minedCount[currentBlock] || 0;
                  const isPlaceable = currentBlock !== 'stick' && currentBlock !== 'diamond_pickaxe' && currentBlock !== 'air';
                  const canPlace = !survivalModeRef.current || (isPlaceable && inventoryCount > 0);

                  if (canPlace) {
                    worldGrid[gridKey(nx, ny, nz)] = currentBlock;
                    addBlockToScene(nx, ny, nz, currentBlock);
                    if (soundEnabled) sound.playPlace();

                    if (survivalModeRef.current) {
                      gs.minedCount[currentBlock]--;
                      setMinedCount({ ...gs.minedCount });
                    }
                  } else {
                    if (survivalModeRef.current && !isPlaceable) {
                      setLatestAward('ไอเทมนี้ไม่สามารถนำมาวางเป็นบล็อกได้!');
                      setTimeout(() => setLatestAward(null), 2500);
                    } else if (survivalModeRef.current && inventoryCount <= 0) {
                      setLatestAward(`จำนวนบล็อก ${BLOCKS_CONFIG[currentBlock]?.label || currentBlock} ไม่พอในคลัง!`);
                      setTimeout(() => setLatestAward(null), 2500);
                    }
                  }
                }
              }
            }
          }
        }
      }

      if (!targetFound) {
        targetWireframe.visible = false;
        gs.miningTarget = null;
      }

      // Render 3D frame update
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);

    // Initial awards greeting
    setLatestAward('ยินดีต้อนรับสู่โลกมายคราฟ 3D! ลากเมาส์เพื่อหันกล้อง');
    setTimeout(() => setLatestAward(null), 4000);

    // Handle viewport resize triggers
    const handleResize = () => {
      const containerRect = container.getBoundingClientRect();
      const w = containerRect.width;
      const h = Math.max(500, window.innerHeight - 320);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObs = new ResizeObserver(handleResize);
    resizeObs.observe(container);

    // Cleanups on unmount
    return () => {
      cancelAnimationFrame(animationId);
      resizeObs.disconnect();
      dom.removeEventListener('mousedown', handleCanvasMouseDown);
      window.removeEventListener('mousemove', handleCanvasMouseMove);
      window.removeEventListener('mouseup', handleCanvasMouseUp);
      
      // Dispose materials & geometry
      cubeGeometry.dispose();
      edgeGeo.dispose();
      blockGroup.clear();
      
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [activeSelectedBlock, soundEnabled]);

  // Restart new world generator
  const handleResetWorld = () => {
    if (soundEnabled) sound.playSuccess();
    window.location.reload(); // Quick reset
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#070b19] text-gray-100 select-none font-sans">
      
      {/* 3D Premium Header Console */}
      <div className="flex flex-wrap items-center justify-between p-4 bg-[#0d1530]/95 border-b border-[#1e2d5a] shadow-lg backdrop-blur-md gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (soundEnabled) sound.playClick();
              onBackToMenu();
            }}
            id="back_to_menu_btn"
            className="flex items-center gap-2 px-4 py-2 bg-[#1e2d5a] hover:bg-[#2c3f7c] text-white font-semibold rounded-lg transition-all border border-[#3b4f8c] text-xs cursor-pointer shadow-md"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            กลับหน้าหลัก
          </button>
          
          <div className="h-6 w-px bg-[#1e2d5a] hidden md:block"></div>
          
          {/* Real-time moving advice banner */}
          <span className="text-gray-400 font-mono text-[11px] hidden lg:inline-block leading-relaxed">
            ปุ่มนำทาง: <span className="text-emerald-400 font-bold bg-[#040817] px-1.5 py-0.5 rounded border border-[#141b3a]">{customKeys.forward.toUpperCase()}</span> หน้า | 
            <span className="text-emerald-400 font-bold bg-[#040817] px-1.5 py-0.5 rounded ml-1 border border-[#141b3a]">{customKeys.backward.toUpperCase()}</span> หลัง | 
            <span className="text-emerald-400 font-bold bg-[#040817] px-1.5 py-0.5 rounded ml-1 border border-[#141b3a]">{customKeys.left.toUpperCase()}</span> ซ้าย | 
            <span className="text-emerald-400 font-bold bg-[#040817] px-1.5 py-0.5 rounded ml-1 border border-[#141b3a]">{customKeys.right.toUpperCase()}</span> ขวา | 
            <span className="text-cyan-400 font-bold bg-[#040817] px-1.5 py-0.5 rounded ml-1 border border-[#141b3a]">{customKeys.jump.toUpperCase()}</span> กระโดด |
            <span className="text-yellow-400 font-bold bg-[#040817] px-1.5 py-0.5 rounded ml-1 border border-[#141b3a]">F</span> บิน/เดิน |
            <span className="text-rose-400 font-bold bg-[#040817] px-1.5 py-0.5 rounded ml-1 border border-[#141b3a]">N</span> สลับโหมด
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Game Mode Switcher */}
          <button
            onClick={() => {
              const nextMode = !survivalMode;
              setSurvivalMode(nextMode);
              setLatestAward(nextMode ? 'สลับเข้าสู่โหมดเอาชีวิตรอด! บล็อกจะหมดไปเมื่อใช้งาน' : 'สลับเข้าสู่โหมดสร้างสรรค์! วางบล็อกได้ไม่จำกัดจำนวน');
              setTimeout(() => setLatestAward(null), 3000);
              if (soundEnabled) sound.playSelect();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
              survivalMode 
                ? 'bg-rose-500/20 text-rose-300 border-rose-500' 
                : 'bg-[#121c3b] text-gray-400 border-gray-700 hover:border-gray-500'
            }`}
            title="คลิกเพื่อสลับระหว่างโหมดเอาชีวิตรอด (Survival) และโหมดสร้างสรรค์ (Creative)"
          >
            <Smile className="w-3.5 h-3.5 text-yellow-400" />
            {survivalMode ? 'โหมด Survival' : 'โหมด Creative'}
          </button>

          {/* Inventory & Crafting toggle */}
          <button
            onClick={() => {
              setIsInventoryOpen(prev => {
                const next = !prev;
                if (next) {
                  document.exitPointerLock();
                }
                if (soundEnabled) sound.playClick();
                return next;
              });
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
              isInventoryOpen 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md scale-105' 
                : 'bg-[#121c3b] text-gray-400 border-gray-700 hover:border-gray-500'
            }`}
            title="เปิดกระเป๋าเก็บของและคราฟต์บล็อกเครื่องมือต่างๆ (ปุ่ม E)"
          >
            <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
            คลังเก็บของ & คราฟต์ (E)
          </button>

          {/* Creative flight status */}
          <button
            onClick={() => {
              const next = !creativeFlight;
              setCreativeFlight(next);
              gameStateRef.current.creativeFlight = next;
              setLatestAward(next ? 'เปิดใช้งานโหมดบินอิสระ (Fly Mode)!' : 'สลับกลับเป็นโหมดเดินปรกติ');
              setTimeout(() => setLatestAward(null), 3000);
              if (soundEnabled) sound.playSelect();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
              creativeFlight 
                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500' 
                : 'bg-[#121c3b] text-gray-400 border-gray-700'
            }`}
            title="กดปุ่ม F เพื่อสลับโหมดบินบินอิสระด่วน"
          >
            <Zap className={`w-3.5 h-3.5 ${creativeFlight ? 'animate-pulse text-yellow-400' : ''}`} />
            {creativeFlight ? 'โหมดบิน 3D (Fly)' : 'โหมดเดิน (Gravity)'}
          </button>

          {/* Sound configuration */}
          <button
            onClick={() => {
              setSoundEnabled(prev => !prev);
              sound.playClick();
            }}
            className={`p-2 rounded-lg border cursor-pointer transition-all ${
              soundEnabled ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
            }`}
            title={soundEnabled ? "ปิดเสียงเกม" : "เปิดเสียงเกม"}
          >
            <Volume2 className="w-4 h-4" />
          </button>

          <div className="bg-[#050814] px-3.5 py-1.5 rounded-lg border border-[#1b254d] flex items-center gap-2">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">คะแนนสะสม:</span>
            <span className="text-yellow-400 font-mono font-bold text-sm tracking-wide">{score}</span>
          </div>

          <button
            onClick={handleResetWorld}
            id="reset_world_btn"
            title="รีเซ็ตสร้างโลก 3D ใหม่หมด"
            className="p-2 bg-[#1b254d] hover:bg-[#283870] active:rotate-180 text-gray-300 hover:text-white rounded-lg border border-[#2b3a6d] transition-all cursor-pointer shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main 3D Sandbox Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Achievements / Alert Ticker */}
        <div className="h-10 mb-2 flex items-center justify-center">
          {latestAward && (
            <div className="bg-emerald-950/95 text-emerald-200 border border-emerald-400/40 px-5 py-1.5 rounded-full text-xs font-semibold shadow-xl shadow-emerald-950/50 animate-bounce flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
              <span>{latestAward}</span>
            </div>
          )}
        </div>

        {/* 3D Viewport container stage */}
        <div className="relative w-full max-w-5xl rounded-xl border-4 border-[#1e2d5a] bg-[#02050f] overflow-hidden shadow-2xl shadow-emerald-950/20">
          
          {/* Main Three.js container */}
          <div ref={containerRef} className="w-full h-full cursor-crosshair min-h-[500px]" />

          {/* Interactive Inventory and Crafting System overlay */}
          {isInventoryOpen && (
            <div className="absolute inset-0 bg-[#060814]/95 backdrop-blur-md flex flex-col z-30 animate-fade-in text-gray-100 select-none">
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-[#0d132a] border-b border-[#1f2d5c] flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-400 animate-bounce" />
                  <h3 className="text-xs font-bold text-white tracking-wide">
                    🎒 คลังเก็บของ & โต๊ะคราฟต์ไอเทม 3D
                  </h3>
                </div>
                
                {/* Tabs selection */}
                <div className="flex gap-2 bg-[#050814] p-1 rounded-lg border border-[#1b254a]">
                  <button
                    onClick={() => {
                      setActiveInventoryTab('inventory');
                      if (soundEnabled) sound.playClick();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold cursor-pointer transition-all ${
                      activeInventoryTab === 'inventory'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    คลังเก็บของ ({Object.values(minedCount).reduce((sum, val) => (sum as number) + (val as number), 0)})
                  </button>
                  <button
                    onClick={() => {
                      setActiveInventoryTab('crafting');
                      if (soundEnabled) sound.playClick();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold cursor-pointer transition-all ${
                      activeInventoryTab === 'crafting'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Hammer className="w-3.5 h-3.5" />
                    โต๊ะคราฟต์สูตร ({CRAFTING_RECIPES.length})
                  </button>
                </div>

                <button
                  onClick={() => {
                    setIsInventoryOpen(false);
                    if (soundEnabled) sound.playClick();
                  }}
                  className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-700/50 rounded-lg text-xs font-bold text-rose-300 transition-all cursor-pointer"
                >
                  ✕ ปิดหน้าต่าง (E)
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5">
                {activeInventoryTab === 'inventory' ? (
                  <div>
                    <div className="mb-4 bg-[#090d22] p-3 rounded-xl border border-[#1f2d5c] flex justify-between items-center flex-wrap gap-2">
                      <span className="text-xs text-gray-400">
                        💡 คลิกที่บล็อกเพื่อทำการ **"สวมใส่เพื่อถือใช้งาน"** บล็อกที่เลือกจะมีขอบเรืองแสงสีเขียว
                      </span>
                      <div className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/50 px-2 py-1 rounded border border-emerald-800/40">
                        สวมใส่อยู่: {BLOCKS_CONFIG[activeSelectedBlock]?.label || activeSelectedBlock}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {(Object.keys(BLOCKS_CONFIG) as BlockType[])
                        .filter((type) => type !== 'air')
                        .map((type) => {
                          const count = minedCount[type] || 0;
                          const cfg = BLOCKS_CONFIG[type];
                          const isSelected = activeSelectedBlock === type;
                          const isEmptySlot = survivalMode && count <= 0;

                          if (isEmptySlot) {
                            return (
                              <div
                                key={type}
                                className="p-3 rounded-xl border-2 border-dashed border-[#1b254a]/40 bg-[#060814]/30 flex flex-col items-center justify-center text-center min-h-[142px] select-none"
                              >
                                <div className="w-8 h-8 rounded-lg border border-dashed border-gray-800/60 bg-[#0a0f25]/40 mb-2 flex items-center justify-center text-xs text-gray-700 font-mono">
                                  ?
                                </div>
                                <div className="text-[10px] text-gray-500 font-bold leading-snug">
                                  ช่องว่างเปล่า
                                </div>
                                <div className="text-[8px] text-gray-600 font-mono mt-1">
                                  ไม่มีไอเทม
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={type}
                              onClick={() => {
                                if (soundEnabled) sound.playSelect();
                                setActiveSelectedBlock(type);
                                gameStateRef.current.activeSelectedBlock = type;
                                setLatestAward(`ถือสวมใส่ไอเทม: ${cfg.label}`);
                                setTimeout(() => setLatestAward(null), 2500);
                              }}
                              className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-between text-center cursor-pointer select-none bg-[#0a0f25] ${
                                isSelected
                                  ? 'border-emerald-400 bg-[#142345] shadow-lg shadow-emerald-500/10'
                                  : 'border-[#1b254a] hover:border-[#2b3a6e] hover:bg-[#0f1737]'
                              }`}
                            >
                              {/* Thumbnail shape */}
                              <div
                                className="w-10 h-10 rounded shadow-md transform rotate-12 mb-2 flex items-center justify-center text-lg font-bold text-white relative shrink-0"
                                style={{
                                  backgroundColor: cfg.color,
                                  border: `2px solid ${cfg.border}`,
                                }}
                              >
                                {cfg.textureSymbol}
                              </div>

                              <div className="text-[11px] font-bold text-white mb-1.5 leading-snug">
                                {cfg.label.split(' ')[0]}
                              </div>

                              <div className="w-full flex items-center justify-between mt-auto pt-2 border-t border-gray-800">
                                <span className="text-[10px] text-gray-400 font-mono">
                                  {survivalMode ? `จำนวน: x${count}` : 'โหมด: ∞'}
                                </span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                    isSelected
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                      : 'bg-gray-800 text-gray-400'
                                  }`}
                                >
                                  {isSelected ? 'ถืออยู่' : 'เลือกใช้'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4 bg-[#090d22] p-3 rounded-xl border border-[#1f2d5c] text-xs text-gray-400">
                      ⚒ คราฟต์บล็อกพรีเมียมและอุปกรณ์คุณภาพสูงได้ทันทีจากทรัพยากรที่คุณหามาได้จากการขุดทำลายในโลก 3D!
                    </div>

                    <div className="space-y-3.5">
                      {CRAFTING_RECIPES.map((recipe) => {
                        // Check ingredients sufficiency
                        const hasIngredients = recipe.ingredients.every((ing) => {
                          const currentCount = minedCount[ing.type] || 0;
                          return !survivalMode || currentCount >= ing.count;
                        });

                        const resultCfg = BLOCKS_CONFIG[recipe.result];

                        return (
                          <div
                            key={recipe.id}
                            className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all bg-[#0a0f25] ${
                              hasIngredients
                                ? 'border-emerald-500/30 bg-[#0e1737]'
                                : 'border-[#1b254a] opacity-80'
                            }`}
                          >
                            {/* Left: Result item */}
                            <div className="flex items-center gap-3">
                              <div
                                className="w-12 h-12 rounded shadow-md transform rotate-12 flex items-center justify-center text-xl font-bold text-white shrink-0"
                                style={{
                                  backgroundColor: resultCfg?.color || '#ffffff',
                                  border: `2px solid ${resultCfg?.border || '#ffffff'}`,
                                }}
                              >
                                {resultCfg?.textureSymbol}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                                  <span>{recipe.label}</span>
                                  {recipe.result === 'diamond_pickaxe' && (
                                    <span className="bg-cyan-500/20 text-cyan-400 text-[9px] px-1.5 py-0.5 rounded border border-cyan-500/40 animate-pulse">
                                      เครื่องมือขุด 3 เท่า
                                    </span>
                                  )}
                                </h4>
                                <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed max-w-md">
                                  {recipe.description}
                                </p>
                              </div>
                            </div>

                            {/* Middle: Ingredients */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] text-gray-500 uppercase font-mono mr-1">วัตถุดิบ:</span>
                              {recipe.ingredients.map((ing) => {
                                const currentCount = minedCount[ing.type] || 0;
                                const ingCfg = BLOCKS_CONFIG[ing.type];
                                const hasEnough = !survivalMode || currentCount >= ing.count;

                                return (
                                  <div
                                    key={ing.type}
                                    className={`px-2 py-1 rounded-lg border text-[10px] font-mono flex items-center gap-1.5 ${
                                      hasEnough
                                        ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
                                        : 'bg-rose-950/40 border-rose-800/40 text-rose-300'
                                    }`}
                                  >
                                    <span
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: ingCfg?.color || '#ffffff' }}
                                    />
                                    <span>
                                      {ingCfg?.label.split(' ')[0]}: {survivalMode ? `${currentCount}/${ing.count}` : `∞/${ing.count}`}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Right: Craft button */}
                            <button
                              disabled={!hasIngredients}
                              onClick={() => {
                                if (survivalMode) {
                                  // Deduct
                                  recipe.ingredients.forEach((ing) => {
                                    gameStateRef.current.minedCount[ing.type] = (gameStateRef.current.minedCount[ing.type] || 0) - ing.count;
                                  });
                                  // Add
                                  gameStateRef.current.minedCount[recipe.result] = (gameStateRef.current.minedCount[recipe.result] || 0) + recipe.resultCount;
                                } else {
                                  // creative has infinite but we can add anyway
                                  gameStateRef.current.minedCount[recipe.result] = (gameStateRef.current.minedCount[recipe.result] || 0) + recipe.resultCount;
                                }

                                setMinedCount({ ...gameStateRef.current.minedCount });

                                if (soundEnabled) sound.playSuccess();
                                setLatestAward(`คราฟต์สำเร็จ! ได้รับ ${recipe.label}`);
                                setTimeout(() => setLatestAward(null), 3000);
                              }}
                              className={`px-4 py-2 rounded-lg font-bold text-xs cursor-pointer transition-all shrink-0 ${
                                hasIngredients
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                              }`}
                            >
                              🔨 คราฟต์ไอเทม
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Voxel Center Targeting reticle Crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-10">
            <div className="w-4 h-4 relative">
              <div className="absolute top-1.5 left-0 w-4 h-0.5 bg-white/80 mix-blend-difference rounded" />
              <div className="absolute top-0 left-1.5 w-0.5 h-4 bg-white/80 mix-blend-difference rounded" />
            </div>
          </div>

          {/* Pointer Lock guide screen overlay */}
          {!isPointerLocked && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 transition-all z-20 pointer-events-auto">
              <div className="bg-[#0b0f1f]/90 p-6 rounded-2xl border-2 border-[#1e2d5a] max-w-md shadow-2xl">
                <Compass className="w-12 h-12 text-emerald-400 mx-auto mb-3 animate-spin" />
                <h3 className="text-lg font-bold text-white mb-2">เปิดใช้งานมุมมองแบบ 3D มายคราฟเต็มรูปแบบ!</h3>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  กดปุ่มด้านล่างเพื่อล็อกเมาส์และบังคับหันกล้องได้อิสระ 360 องศาเหมือนในเกมคอมพิวเตอร์จริง (หรือลากเมาส์/สัมผัสจอภาพเพื่อหันมุมมองแบบปกติ)
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      const canvas = containerRef.current?.querySelector('canvas');
                      canvas?.requestPointerLock();
                    }}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-lg shadow-emerald-800/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Maximize className="w-4 h-4" />
                    ล็อกเมาส์ควบคุม 3D (Pointer Lock)
                  </button>
                  <button
                    onClick={() => setIsPointerLocked(true)}
                    className="px-4 py-3 bg-[#1e2d5a] hover:bg-[#2c3f7c] text-gray-300 hover:text-white font-semibold text-xs rounded-xl cursor-pointer transition-all"
                  >
                    เล่นแบบไม่ล็อกเมาส์
                  </button>
                </div>
                <div className="mt-4 text-[10px] text-gray-500">
                  *กดปุ่ม <kbd className="bg-gray-800 text-white px-1 py-0.5 rounded">ESC</kbd> บนคีย์บอร์ดเมื่อต้องการนำเมาส์ออก
                </div>
              </div>
            </div>
          )}

          {/* In-viewport stats dashboard overlay */}
          <div className="absolute top-4 left-4 bg-[#050918]/85 p-3 rounded-lg border border-[#1e2d5a]/60 font-mono text-[11px] text-gray-300 pointer-events-none select-none backdrop-blur-md shadow-xl">
            <div className="text-emerald-400 font-bold mb-1.5 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> สถิติวิศวกรรมการขุด 3D:
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div>หญ้า (Grass): <span className="text-emerald-400 font-bold">{minedCount.grass}</span></div>
              <div>ดิน (Dirt): <span className="text-yellow-700 font-bold">{minedCount.dirt}</span></div>
              <div>หิน (Stone): <span className="text-gray-400 font-bold">{minedCount.stone}</span></div>
              <div>แกนไม้ (Wood): <span className="text-amber-600 font-bold">{minedCount.wood}</span></div>
              <div>ใบไม้ (Leaves): <span className="text-emerald-600 font-bold">{minedCount.leaves}</span></div>
              <div className="text-cyan-400 font-bold">เพชรล้ำค่า: {minedCount.diamond}</div>
              <div className="text-violet-400 font-bold">ออบซิเดียน: {minedCount.obsidian}</div>
            </div>
          </div>

          {/* Instruction helper button bottom left */}
          <div className="absolute bottom-4 left-4 bg-black/50 px-2 py-1.5 rounded text-[10px] text-gray-300 flex items-center gap-1.5 pointer-events-none font-mono">
            <Move className="w-3 h-3 text-emerald-400" />
            <span>คลิกซ้าย: ขุดบล็อก | คลิกขวา: วางบล็อก | ปุ่ม N: สลับโหมด</span>
          </div>
        </div>

        {/* 3D Minecraft Hotbar (บล็อกสำหรับวาง 1-7) */}
        <div className="mt-6 bg-[#091024]/90 border-2 border-[#203166] p-3 rounded-2xl flex items-center gap-2.5 shadow-2xl backdrop-blur-md">
          <span className="text-xs text-gray-400 font-bold px-2 uppercase tracking-widest font-mono hidden md:inline-block">ช่องไอเทมด่วน:</span>
          
          {(Object.keys(BLOCKS_CONFIG) as BlockType[])
            .filter((type) => type !== 'air' && type !== 'stick')
            .map((type, idx) => {
              const isActive = activeSelectedBlock === type;
              const cfg = BLOCKS_CONFIG[type];
              const count = minedCount[type] || 0;
              const isEmptySlot = survivalMode && count <= 0;

              if (isEmptySlot) {
                return (
                  <div
                    key={type}
                    className="w-14 h-14 flex flex-col items-center justify-between p-1.5 rounded-xl border border-dashed border-[#1e2d5a]/30 bg-[#050814]/30 select-none relative"
                    title="ช่องว่างเปล่า (ยังไม่มีไอเทมนี้)"
                  >
                    <div className="w-7 h-7 flex items-center justify-center text-[10px] text-gray-700 font-mono font-bold">
                      -
                    </div>
                    <span className="text-[10px] text-gray-600 font-mono font-bold">
                      {idx + 1}
                    </span>
                  </div>
                );
              }

              return (
                <button
                  key={type}
                  onClick={() => {
                    if (soundEnabled) sound.playClick();
                    setActiveSelectedBlock(type);
                    gameStateRef.current.activeSelectedBlock = type;
                  }}
                  title={`กดปุ่มเลข ${idx + 1} เพื่อสลับเลือกไอเทมนี้ด่วน`}
                  className={`w-14 h-14 flex flex-col items-center justify-between p-1.5 rounded-xl transition-all relative group cursor-pointer ${
                    isActive 
                      ? 'border-4 border-emerald-400 bg-[#162145] scale-110 shadow-lg shadow-emerald-500/20' 
                      : 'border-2 border-[#1e2d5a] bg-[#050814] hover:bg-[#121c3b]'
                  }`}
                >
                  {/* Item count badge */}
                  <span className="absolute top-1 right-1 text-[8px] font-mono font-bold text-yellow-400 bg-black/65 px-1 rounded border border-[#203166]/60">
                    {survivalMode ? count : '∞'}
                  </span>

                  {/* Pseudo-3D design for active block representation inside hotbar */}
                  <div
                    className="w-7 h-7 rounded shadow-inner transform rotate-12 transition-transform group-hover:rotate-45 flex items-center justify-center text-xs select-none"
                    style={{
                      backgroundColor: cfg.color,
                      border: `1.5px solid ${cfg.border}`,
                    }}
                  >
                    <span className="text-[10px] text-white font-bold drop-shadow-md">
                      {cfg.textureSymbol}
                    </span>
                  </div>

                  <span className="text-[10px] text-gray-400 font-mono font-bold">
                    {idx + 1}
                  </span>
                  
                  {/* Tooltip detail metadata */}
                  <div className="absolute bottom-18 left-1/2 -translate-x-1/2 bg-[#040817] border border-[#1e2d5a] px-3 py-1.5 rounded-lg text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none font-mono shadow-xl">
                    {cfg.label} {survivalMode ? `(เหลือ: x${count})` : '(ไม่จำกัด)'}
                  </div>
                </button>
              );
            })}
        </div>

      </div>
    </div>
  );
}
