import React, {useState} from 'react';
import {Download, Share} from 'lucide-react';
import {usePWAInstall} from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenInstallGuide?: () => void;
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onOpenInstallGuide,
  compact = false,
}) => {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
      >
        <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{compact ? 'Cài App' : 'Cài đặt ứng dụng'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap shrink-0 min-h-[40px]"
        >
          <Share className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Cài trên iOS</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <h3 id="ios-install-title" className="text-base font-semibold text-slate-900 dark:text-white">
                Cài đặt NhịpChat lên iPhone / iPad
              </h3>
              <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>1. Nhấn vào biểu tượng <strong>Chia sẻ (Share)</strong> trên thanh Safari.</li>
                <li>2. Cuộn xuống và chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>.</li>
                <li>3. Nhấn <strong>Thêm</strong> để mở như ứng dụng độc lập.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  if (onOpenInstallGuide) {
    return (
      <button
        type="button"
        onClick={onOpenInstallGuide}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
      >
        <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{compact ? 'App / APK' : 'Cài App / APK'}</span>
      </button>
    );
  }

  return null;
};
