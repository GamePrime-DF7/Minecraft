/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ControlKeys, AppScreen } from './types';
import OptionsPanel from './components/OptionsPanel';
import GameWorld from './components/GameWorld';
import { sound } from './utils/audio';
import { Play, Settings, Info, Keyboard, Volume2, HelpCircle } from 'lucide-react';

const DEFAULT_KEYS: ControlKeys = {
  left: 'A',
  right: 'D',
  jump: 'Space',
  mine: 'F',
  place: 'Q',
  forward: 'W',
  backward: 'S',
  inventory: 'E',
};

const LOGO_URL = 'https://res.cloudinary.com/dsucg33fv/image/upload/v1782439979/logo_fj2ctz.png';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.STARTUP);
  const [customKeys, setCustomKeys] = useState<ControlKeys>(DEFAULT_KEYS);
  const [showCredits, setShowCredits] = useState(false);

  // Load custom keys from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('minecraft_start_menu_keys');
      if (saved) {
        setCustomKeys(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load keys from localStorage', e);
    }
  }, []);

  // Save keys callback
  const handleSaveKeys = (newKeys: ControlKeys) => {
    setCustomKeys(newKeys);
    try {
      localStorage.setItem('minecraft_start_menu_keys', JSON.stringify(newKeys));
    } catch (e) {
      console.error('Failed to save keys to localStorage', e);
    }
  };

  // Skip the initial startup screen and show the main menu
  const enterMainMenu = () => {
    sound.playSelect();
    setScreen(AppScreen.MAIN_MENU);
  };

  // Play button click
  const handleStartGame = () => {
    sound.playSuccess();
    setScreen(AppScreen.PLAYING);
  };

  // Options button click
  const handleOpenOptions = () => {
    sound.playClick();
    setScreen(AppScreen.OPTIONS);
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col justify-between overflow-x-hidden relative font-sans">
      
      {/* Absolute floating grid lines for Minecraft visual theme */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(15,23,42,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-10" />

      {/* Screen Routing with AnimatePresence */}
      <AnimatePresence mode="wait">
        
        {/* 1. STARTUP INTRO WITH SOFT FADE-IN */}
        {screen === AppScreen.STARTUP && (
          <motion.div
            key="startup-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: 'easeInOut' }}
            className="flex-1 flex flex-col items-center justify-center p-6 bg-black z-10"
            onClick={enterMainMenu}
          >
            {/* Title & Logo fade container */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1.5, ease: 'easeOut' }}
              className="text-center max-w-lg flex flex-col items-center"
            >
              {/* Custom Logo Image */}
              <motion.img
                src={LOGO_URL}
                alt="Minecraft Logo"
                className="h-32 sm:h-40 md:h-48 object-contain mb-8 filter drop-shadow-[0_10px_15px_rgba(34,197,94,0.15)]"
                initial={{ scale: 0.92, filter: 'blur(5px)' }}
                animate={{ scale: 1, filter: 'blur(0px)' }}
                transition={{ delay: 0.8, duration: 1.5 }}
                referrerPolicy="no-referrer"
              />

              {/* Title Minecraft in Kanit Font */}
              <h1 className="text-4xl sm:text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-gray-100 to-gray-400 font-sans uppercase mb-4 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                MINECRAFT
              </h1>

              {/* Tiny subtext indicator */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.7, 0] }}
                transition={{ repeat: Infinity, duration: 2.2, delay: 2.0 }}
                className="text-xs text-gray-500 tracking-widest uppercase font-mono mt-8 cursor-pointer"
              >
                — คลิกหรือกดปุ่มใดก็ได้เพื่อเข้าเกม —
              </motion.p>
            </motion.div>
          </motion.div>
        )}

        {/* 2. MAIN MENU SCREEN */}
        {screen === AppScreen.MAIN_MENU && (
          <motion.div
            key="main-menu"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6 }}
            className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-950 via-black to-gray-950 z-10"
          >
            {/* Upper Header Header (Logo + Title) */}
            <div className="text-center mb-10 flex flex-col items-center max-w-xl">
              <motion.img
                src={LOGO_URL}
                alt="Minecraft Logo"
                className="h-28 sm:h-36 md:h-40 object-contain mb-6 filter drop-shadow-[0_8px_16px_rgba(16,185,129,0.2)]"
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                referrerPolicy="no-referrer"
              />
              
              <h1 className="text-5xl sm:text-6xl font-black tracking-wider text-white font-sans uppercase mb-2 filter drop-shadow-[0_5px_10px_rgba(0,0,0,0.9)]">
                MINECRAFT
              </h1>
              
              <div className="bg-emerald-950/30 border border-emerald-500/20 px-3 py-1 rounded-full text-xs text-emerald-400 font-medium font-sans">
                โหมดเวิลด์จำลอง 2D Sandbox Sandbox v1.4.0
              </div>
            </div>

            {/* Menu options buttons */}
            <div className="w-full max-w-sm space-y-3.5 mb-8">
              {/* Enter Game Button */}
              <motion.button
                whileHover={{ scale: 1.05, translateY: -2, boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)" }}
                whileTap={{ scale: 0.98, translateY: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                onClick={handleStartGame}
                id="btn_play_game"
                className="w-full group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg active:translate-y-0.5 transition-all flex items-center justify-center gap-3 border border-emerald-400 cursor-pointer"
              >
                <div className="absolute inset-0 w-full h-full bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Play className="w-5 h-5 text-emerald-100 fill-emerald-100" />
                <span className="text-sm tracking-wider uppercase font-bold">เข้าเล่นเกม (Play Game)</span>
              </motion.button>

              {/* Options Button */}
              <motion.button
                whileHover={{ scale: 1.04, translateY: -1, backgroundColor: "#1f2937" }}
                whileTap={{ scale: 0.98, translateY: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                onClick={handleOpenOptions}
                id="btn_options"
                className="w-full bg-gray-900 active:translate-y-0.5 text-gray-200 font-semibold py-3.5 px-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <Settings className="w-5 h-5 text-gray-400 group-hover:rotate-45 transition-transform" />
                <span className="text-sm tracking-wider">ตั้งค่าตัวควบคุม (Options)</span>
              </motion.button>

              {/* Credits Creator Button */}
              <motion.button
                whileHover={{ scale: 1.03, backgroundColor: "#111827" }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                onClick={() => {
                  sound.playClick();
                  setShowCredits(!showCredits);
                }}
                id="btn_credits"
                className="w-full bg-gray-950 active:translate-y-0.5 text-gray-400 hover:text-gray-200 py-3 px-6 rounded-xl border border-gray-900 transition-all flex items-center justify-center gap-3 text-xs font-medium cursor-pointer"
              >
                <Info className="w-4 h-4 text-gray-500" />
                <span>ข้อมูลผู้พัฒนาเกม (Credits)</span>
              </motion.button>
            </div>

            {/* Interactive Custom Keys Mapping Guide Overlay */}
            <div className="w-full max-w-md bg-gray-950/80 border border-gray-800/80 p-4 rounded-xl text-center backdrop-blur-sm shadow-xl">
              <span className="text-xs text-gray-500 block mb-2 font-mono uppercase tracking-wider">ปุ่มควบคุมที่ใช้งานขณะนี้:</span>
              <div className="grid grid-cols-4 gap-2 text-[11px] font-mono">
                <div className="bg-gray-900/60 p-1.5 rounded border border-gray-800">
                  <div className="text-gray-500 text-[10px]">เลี้ยวซ้าย</div>
                  <div className="text-emerald-400 font-bold">{customKeys.left}</div>
                </div>
                <div className="bg-gray-900/60 p-1.5 rounded border border-gray-800">
                  <div className="text-gray-500 text-[10px]">เลี้ยวขวา</div>
                  <div className="text-emerald-400 font-bold">{customKeys.right}</div>
                </div>
                <div className="bg-gray-900/60 p-1.5 rounded border border-gray-800">
                  <div className="text-gray-500 text-[10px]">กระโดด</div>
                  <div className="text-emerald-400 font-bold">{customKeys.jump}</div>
                </div>
                <div className="bg-gray-900/60 p-1.5 rounded border border-gray-800">
                  <div className="text-gray-500 text-[10px]">ขุดบล็อก</div>
                  <div className="text-rose-400 font-bold">{customKeys.mine}</div>
                </div>
              </div>
            </div>

            {/* Credits description collapsible panel */}
            {showCredits && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 max-w-sm w-full bg-gray-900/40 border border-gray-800/60 p-4 rounded-xl text-center"
              >
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  เกม <span className="text-white font-bold">MINECRAFT 2D Sandbox</span> พัฒนาขึ้นมาอย่างสร้างสรรค์เพื่อมอบประสบการณ์การทำเหมืองขุดแร่และสร้างบล็อกที่แสนสนุก 
                  ตอบสนองตามปุ่มที่คุณปรับแต่งในเมนูออปชันได้อย่างราบรื่น 100%
                </p>
                <div className="text-[10px] text-gray-600 font-mono mt-3">
                  Powered by React, Tailwind CSS, and Motion React
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* 3. OPTIONS PANEL SCREEN */}
        {screen === AppScreen.OPTIONS && (
          <motion.div
            key="options-screen"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex flex-col items-center justify-center p-6 bg-black z-10"
          >
            <OptionsPanel
              currentKeys={customKeys}
              onSaveKeys={handleSaveKeys}
              onBack={enterMainMenu}
            />
          </motion.div>
        )}

        {/* 4. PLAYING / GAMEPLAY SCREEN */}
        {screen === AppScreen.PLAYING && (
          <motion.div
            key="gameplay-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 flex flex-col justify-between"
          >
            <GameWorld
              customKeys={customKeys}
              onBackToMenu={enterMainMenu}
            />
          </motion.div>
        )}

      </AnimatePresence>

      {/* Humble Footer containing current status */}
      <footer className="py-4 text-center text-gray-600 text-xs border-t border-gray-900 w-full z-10 bg-black/80 font-sans">
        <div>MINECRAFT Sandbox Menu • Developed with Premium Aesthetics</div>
      </footer>
    </div>
  );
}
