/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ControlKeys {
  forward: string;
  backward: string;
  left: string;
  right: string;
  jump: string;
  mine: string;
  place: string;
  inventory: string;
}

export type ControlKeyName = keyof ControlKeys;

export interface ControlKeyMeta {
  id: ControlKeyName;
  label: string;
  description: string;
  defaultKey: string;
}

export enum AppScreen {
  STARTUP = 'STARTUP',
  MAIN_MENU = 'MAIN_MENU',
  OPTIONS = 'OPTIONS',
  PLAYING = 'PLAYING',
}

export type BlockType = 
  | 'grass' 
  | 'dirt' 
  | 'stone' 
  | 'wood' 
  | 'leaves' 
  | 'diamond' 
  | 'obsidian' 
  | 'planks' 
  | 'crafting_table' 
  | 'stone_brick' 
  | 'tnt' 
  | 'diamond_block' 
  | 'stick' 
  | 'diamond_pickaxe' 
  | 'air';

export interface BlockMeta {
  type: BlockType;
  label: string;
  color: string; // Tailwind class
  border: string; // Tailwind class
  textureSymbol: string; // ASCII symbol or character representation
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  facing: 'left' | 'right';
  selectedBlockType: BlockType;
  score: number;
  miningProgress: number; // 0 to 100
  miningTarget: { x: number; y: number } | null;
}
