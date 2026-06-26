/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ControlKeys, ControlKeyName, ControlKeyMeta } from '../types';
import { sound } from '../utils/audio';
import { ArrowLeft, Key, RotateCcw, Save, ShieldAlert, Check } from 'lucide-react';

interface OptionsPanelProps {
  currentKeys: ControlKeys;
  onSaveKeys: (keys: ControlKeys) => void;
  onBack: () => void;
}

const CONTROL_METADATA: ControlKeyMeta[] = [
  { id: 'left', label: 'เลี้ยวซ้าย (Move Left)', description: 'บังคับตัวละครเดินไปทางซ้ายของหน้าจอ', defaultKey: 'A' },
  { id: 'right', label: 'เลี้ยวขวา (Move Right)', description: 'บังคับตัวละครเดินไปทางขวาของหน้าจอ', defaultKey: 'D' },
  { id: 'jump', label: 'กระโดด (Jump)', description: 'สั่งให้ตัวละครกระโดดข้ามบล็อกสูง', defaultKey: 'Space' },
  { id: 'mine', label: 'ขุดบล็อก / โจมตี (Mine / Attack)', description: 'ขุดหรือทำลายบล็อกวัสดุตรงหน้า', defaultKey: 'F' },
  { id: 'place', label: 'วางบล็อก (Place Block)', description: 'วางบล็อกชนิดที่เลือกใส่พิกัดเป้าหมาย', defaultKey: 'Q' },
  { id: 'forward', label: 'บินขึ้น / เดินหน้า (Forward / Up)', description: 'ปุ่มอเนกประสงค์สำหรับควบคุมทิศทาง', defaultKey: 'W' },
  { id: 'backward', label: 'บินลง / ถอยหลัง (Backward / Down)', description: 'ปุ่มอเนกประสงค์สำหรับควบคุมทิศทาง', defaultKey: 'S' },
];

export default function OptionsPanel({ currentKeys, onSaveKeys, onBack }: OptionsPanelProps) {
  const [keys, setKeys] = useState<ControlKeys>({ ...currentKeys });
  const [listeningKeyId, setListeningKeyId] = useState<ControlKeyName | null>(null);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Keyboard listener for key recording mode
  useEffect(() => {
    if (!listeningKeyId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      let pressedKey = e.key;
      
      // Simplify space bar representation
      if (e.code === 'Space' || pressedKey === ' ') {
        pressedKey = 'Space';
      } else if (pressedKey.length === 1) {
        pressedKey = pressedKey.toUpperCase();
      }

      setKeys((prev) => ({
        ...prev,
        [listeningKeyId]: pressedKey,
      }));

      sound.playSuccess();
      setListeningKeyId(null);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [listeningKeyId]);

  const handleResetDefaults = () => {
    sound.playSelect();
    const defaultKeys: ControlKeys = {
      left: 'A',
      right: 'D',
      jump: 'Space',
      mine: 'F',
      place: 'Q',
      forward: 'W',
      backward: 'S',
      inventory: 'E',
    };
    setKeys(defaultKeys);
  };

  const handleSave = () => {
    sound.playSuccess();
    onSaveKeys(keys);
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
    }, 2500);
  };

  return (
    <div className="max-w-2xl w-full bg-gray-900/90 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative backdrop-blur-md">
      {/* Save Success Toast */}
      {showSavedToast && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 shadow-lg animate-bounce z-20 font-sans">
          <Check className="w-4 h-4" />
          <span>บันทึกการตั้งค่าปุ่มเรียบร้อยแล้ว!</span>
        </div>
      )}

      {/* Title */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide font-sans">ตัวเลือกการควบคุม (Controls)</h2>
            <p className="text-xs text-gray-400 mt-0.5">ปรับแต่งปุ่มบังคับของคุณให้เหมาะสมตามความถนัด</p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.1, rotate: -15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors border border-gray-700 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Controls Grid */}
      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
        {CONTROL_METADATA.map((control) => {
          const isListening = listeningKeyId === control.id;
          const currentBoundKey = keys[control.id];

          return (
            <div
              key={control.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all gap-4 ${
                isListening
                  ? 'bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/5'
                  : 'bg-gray-950/40 border-gray-800/80 hover:bg-gray-950/60'
              }`}
            >
              <div className="flex-1">
                <span className="text-sm font-semibold text-gray-200 block">{control.label}</span>
                <span className="text-xs text-gray-500 mt-0.5 block leading-relaxed">{control.description}</span>
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.08, boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    sound.playClick();
                    setListeningKeyId(control.id);
                  }}
                  id={`btn_config_${control.id}`}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all min-w-[90px] text-center border cursor-pointer ${
                    isListening
                      ? 'bg-emerald-500 text-white border-emerald-400 animate-pulse'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700 active:translate-y-0.5'
                  }`}
                >
                  {isListening ? 'กดปุ่มที่ต้องการ...' : currentBoundKey}
                </motion.button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Guide/Alert Box */}
      <div className="mt-6 p-3 bg-gray-950 rounded-xl border border-gray-800/80 flex gap-2.5 items-start">
        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
          <span className="text-amber-500 font-bold">แนะนำ:</span> หลีกเลี่ยงการกำหนดปุ่มซ้ำซ้อนกันเพื่อป้องกันการควบคุมสับสนขณะขุดและต่อบล็อกภายในโหมดจำลองสถานการณ์
        </p>
      </div>

      {/* Footer Action buttons */}
      <div className="mt-8 pt-4 border-t border-gray-800 flex flex-wrap items-center justify-between gap-4">
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: "#1f2937" }}
          whileTap={{ scale: 0.95 }}
          onClick={handleResetDefaults}
          id="btn_reset_defaults"
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 active:translate-y-0.5 rounded-lg transition-colors border border-gray-800 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          คืนค่าเริ่มต้น
        </motion.button>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "#111827" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 cursor-pointer"
          >
            ยกเลิก
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05, translateY: -1, boxShadow: "0 6px 18px rgba(16, 185, 129, 0.25)" }}
            whileTap={{ scale: 0.96 }}
            onClick={handleSave}
            id="btn_save_options"
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:translate-y-0.5 text-white text-xs font-bold rounded-lg transition-all border border-emerald-500 shadow-md shadow-emerald-950/20 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            บันทึกการตั้งค่า
          </motion.button>
        </div>
      </div>
    </div>
  );
}
