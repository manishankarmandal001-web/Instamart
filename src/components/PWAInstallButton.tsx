import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Monitor, Smartphone, X, CheckCircle, Share, PlusSquare } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'navbar' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showGenericModal, setShowGenericModal] = useState(false);

  // If already installed and running standalone, hide the button
  if (isInstalled) {
    return null;
  }

  // Handle click: if browser provides prompt, invoke it; otherwise open guidance modal
  const handleInstallClick = async () => {
    if (isInstallable) {
      const res = await install();
      if (!res) {
        setShowGenericModal(true);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowGenericModal(true);
    }
  };

  return (
    <>
      {variant === 'banner' ? (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 shadow-sm transition-all"
          title="Install Trrop App on PC or Mobile"
        >
          <Download className="w-3.5 h-3.5 text-emerald-300" />
          <span>Install App (PC & Mobile)</span>
        </button>
      ) : (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/30 transition-all"
          title="Install Trrop software on your computer or mobile phone"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">App</span>
        </button>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Install Trrop on iPhone / iPad
                </h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Apple Safari does not support automated prompt popups. Follow these 2 quick steps:
            </p>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  1
                </div>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Tap the Share icon</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">Located at the bottom of your Safari browser toolbar.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  2
                </div>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Select &quot;Add to Home Screen&quot;</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">Trrop will be installed as a standalone app on your home screen.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Desktop / Android Fallback Modal */}
      {showGenericModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Install Trrop on Computer or Mobile
                </h3>
              </div>
              <button
                onClick={() => setShowGenericModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              You can install Trrop as a native standalone application on your Computer (Windows, Mac, ChromeOS) and Android device!
            </p>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  <Monitor className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">On Chrome / Edge (Desktop PC & Laptop):</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Look at the right side of the address bar and click the <strong>Install Trrop</strong> icon (or click the three dots menu ⋮ &gt; <em>Install Trrop...</em>).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  <Smartphone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">On Android Mobile:</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Tap the Chrome menu (⋮) in the top-right corner and tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home Screen&quot;</strong>.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowGenericModal(false)}
              className="mt-5 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
};
