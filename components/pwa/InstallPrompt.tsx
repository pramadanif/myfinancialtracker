"use client";

import { useEffect, useState } from "react";
import { Share, X, Smartphone } from "lucide-react";
import { isIOS, isStandalone } from "@/lib/pwa";

const DISMISS_KEY = "finance-pwa-install-dismissed";

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (!isIOS()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-[76px] z-50 px-4 safe-area-bottom pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto">
        <div className="bg-white rounded-2xl shadow-sheet border border-border-light p-4 animate-slide-up">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                <Smartphone size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">Install ke Home Screen</p>
                <p className="text-2xs text-text-tertiary">Terasa seperti app native</p>
              </div>
            </div>
            <button type="button" onClick={dismiss} className="icon-btn w-8 h-8 shrink-0">
              <X size={18} />
            </button>
          </div>

          <ol className="space-y-2.5 text-sm text-text-secondary">
            <li className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary text-white text-2xs font-bold flex items-center justify-center shrink-0">1</span>
              <span>
                Tap tombol <Share size={14} className="inline text-primary mx-0.5" /> <strong>Share</strong> di bawah Safari
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary text-white text-2xs font-bold flex items-center justify-center shrink-0">2</span>
              <span>Scroll ke bawah, pilih <strong>Add to Home Screen</strong></span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary text-white text-2xs font-bold flex items-center justify-center shrink-0">3</span>
              <span>Tap <strong>Add</strong> — buka dari icon di home screen</span>
            </li>
          </ol>

          <button
            type="button"
            onClick={dismiss}
            className="w-full mt-4 py-2.5 text-sm font-medium text-text-tertiary"
          >
            Nanti saja
          </button>
        </div>
      </div>
    </div>
  );
}
