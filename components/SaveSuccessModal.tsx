"use client";

import { useEffect, useState } from "react";

interface SaveSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function SaveSuccessModal({
  isOpen,
  onClose,
  message = "บันทึกข้อมูลเรียบร้อยแล้ว",
}: SaveSuccessModalProps) {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      // ตั้งเวลา 2 วินาที (2000ms) เท่ากับเวลาของ Progress Bar เพื่อปิด Modal อัตโนมัติ
      const timer = setTimeout(() => {
        onClose();
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setIsRendered(false);
    }
  }, [isOpen, onClose]);

  if (!isOpen && !isRendered) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      {/* การ์ดแจ้งเตือนที่มี Animation เด้งขึ้น (Bounce Pop) */}
      <div className="bg-slate-900 border border-slate-700/60 w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center relative overflow-hidden animate-[bouncePop_0.4s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
        
        {/* ไอคอนติ๊กถูกแบบขยับแอนิเมชัน */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/30 animate-[pulse_2s_infinite]">
          <svg
            className="h-8 w-8 animate-[checkmark_0.3s_ease-in-out_0.2s_both]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* ข้อความสถานะ */}
        <h3 className="text-lg font-bold text-white mb-1">สำเร็จ!</h3>
        <p className="text-sm text-slate-400 mb-6">{message}</p>

        {/* 🌟 Progress Bar วิ่ง 2 วินาทีจากซ้ายไปขวา */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
          <div className="h-full bg-linear-to-r from-emerald-500 to-teal-400 animate-[progressBar_2s_linear_forwards]" />
        </div>
      </div>
    </div>
  );
}