"use client";

import { useEffect } from "react";

interface IntakeNotifyProps {
  show: boolean;
  type: "success" | "warning" | "error";
  title: string;
  message: string;
  onClose: () => void;
}

export default function IntakeNotify({ show, type, title, message, onClose }: IntakeNotifyProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000); // ทำงาน 2 วินาทีแล้วปิดอัตโนมัติ
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity duration-300">
      {/* แทรก Style Keyframes สำหรับ Animation ไว้ในไฟล์โดยตรง */}
      <style>{`
        @keyframes popupBounce {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes strokeCircle {
          to { stroke-dashoffset: 0; }
        }
        @keyframes strokeCheck {
          to { stroke-dashoffset: 0; }
        }

        .animate-popup-bounce {
          animation: popupBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-stroke-circle {
          animation: strokeCircle 0.4s ease-in-out forwards;
        }
        .animate-stroke-check {
          animation: strokeCheck 0.3s ease-in-out 0.3s forwards;
        }
      `}</style>

      {/* Container หลักที่เปลี่ยนมาใช้ Class คอนฟิกตรงจากสไตล์ด้านบน */}
      <div className="bg-[#0f172a] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#334155] relative animate-popup-bounce">
        
        {/* แถบสีด้านบนระบุประเภท */}
        <div className={`h-2 w-full ${type === "success" ? "bg-emerald-500" : type === "warning" ? "bg-amber-500" : "bg-rose-500"}`} />
        
        <div className="p-6 flex flex-col items-center text-center pb-8">
          {/* ไอคอนที่มี Animation วาดเส้นในตัว */}
          <div className="mb-4">
            {type === "success" && (
              <svg className="w-16 h-16 text-emerald-500" viewBox="0 0 52 52" fill="none" stroke="currentColor" strokeWidth="4">
                <circle className="animate-stroke-circle" cx="26" cy="26" r="23" strokeDasharray="150" strokeDashoffset="150" strokeLinecap="round" />
                <path className="animate-stroke-check" d="M14 27l7 7 16-16" strokeDasharray="50" strokeDashoffset="50" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}

            {type === "error" && (
              <svg className="w-16 h-16 text-rose-500" viewBox="0 0 52 52" fill="none" stroke="currentColor" strokeWidth="4">
                <circle className="animate-stroke-circle" cx="26" cy="26" r="23" strokeDasharray="150" strokeDashoffset="150" strokeLinecap="round" />
                <path className="animate-stroke-check" d="M16 16l20 20M36 16L16 36" strokeDasharray="60" strokeDashoffset="60" strokeLinecap="round" />
              </svg>
            )}

            {type === "warning" && (
              <svg className="w-16 h-16 text-amber-500" viewBox="0 0 52 52" fill="none" stroke="currentColor" strokeWidth="4">
                <circle className="animate-stroke-circle" cx="26" cy="26" r="23" strokeDasharray="150" strokeDashoffset="150" strokeLinecap="round" />
                <path className="animate-stroke-check" d="M26 14v16M26 38h.01" strokeDasharray="40" strokeDashoffset="40" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>

          {/* ข้อความแจ้งเตือน */}
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-sm text-gray-400 leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
}