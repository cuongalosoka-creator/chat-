import React, {useState} from 'react';
import {QRCodeSVG} from 'qrcode.react';
import {Check, Copy, Download, ExternalLink, Package, Smartphone, X} from 'lucide-react';
import {usePWAInstall} from '../hooks/usePWAInstall';

interface AppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppInstallModal: React.FC<AppInstallModalProps> = ({isOpen, onClose}) => {
  const [activeTab, setActiveTab] = useState<'phone' | 'apk'>('phone');
  const [copied, setCopied] = useState(false);
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked fallback
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2
              id="install-modal-title"
              className="font-display text-base font-bold text-slate-900 dark:text-white text-balance"
            >
              Kết nối Điện thoại & APK
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Chat đồng bộ thời gian thực giữa điện thoại và máy tính từ xa
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại cài đặt"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Segmented Tabs */}
        <div className="px-5 pt-4">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('phone')}
              className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors min-h-[38px] whitespace-nowrap ${
                activeTab === 'phone'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Quét QR & Cài WebAPK</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('apk')}
              className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors min-h-[38px] whitespace-nowrap ${
                activeTab === 'apk'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Package className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Đóng gói file .APK</span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto">
          {activeTab === 'phone' ? (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-center gap-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="rounded-xl bg-white p-3 border border-slate-200 shrink-0">
                  <QRCodeSVG value={shareUrl || 'http://localhost:3000'} size={128} level="M" />
                </div>
                <div className="space-y-2 text-center sm:text-left min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Mở trên điện thoại từ xa
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    Dùng camera điện thoại quét mã QR hoặc gửi liên kết bên dưới để mở đúng phòng chat này từ bất kỳ đâu.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      readOnly
                      aria-label="Liên kết phòng chat từ xa"
                      value={shareUrl}
                      className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2 font-mono text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 whitespace-nowrap shrink-0 min-h-[36px]"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Cài thành App trên màn hình chính (Android WebAPK / iOS)
                </h4>
                {isInstalled ? (
                  <p className="font-medium text-emerald-600 dark:text-emerald-400">
                    Ứng dụng đã được cài đặt ở chế độ độc lập trên thiết bị này.
                  </p>
                ) : isInstallable ? (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={install}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      <span>Cài đặt NhịpChat ngay</span>
                    </button>
                  </div>
                ) : isIOS ? (
                  <ol className="space-y-1.5 pl-1">
                    <li>1. Mở liên kết trên bằng trình duyệt <strong>Safari</strong>.</li>
                    <li>2. Nhấn nút <strong>Chia sẻ (Share)</strong> ở thanh dưới cùng.</li>
                    <li>3. Chọn <strong>Thêm vào màn hình chính</strong> để chạy toàn màn hình.</li>
                  </ol>
                ) : (
                  <ol className="space-y-1.5 pl-1">
                    <li>
                      1. Trên <strong>Android Chrome</strong>: mở liên kết trên, nhấn menu{' '}
                      <strong>⋮</strong> góc trên phải và chọn{' '}
                      <strong>Cài đặt ứng dụng (Install app)</strong> — Chrome sẽ tự tạo gói{' '}
                      <strong>WebAPK</strong> cài thẳng vào máy như app thật.
                    </li>
                    <li>
                      2. Trên <strong>iPhone / iPad</strong>: mở bằng Safari →{' '}
                      <strong>Chia sẻ</strong> → <strong>Thêm vào màn hình chính</strong>.
                    </li>
                  </ol>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50 space-y-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Xuất file .APK cài đặt cho Android
                </h3>
                <p>
                  Máy chủ web không biên dịch trực tiếp file nhị phân <code>.apk</code> tại trình duyệt, nhưng ứng dụng đã chuẩn bị sẵn chuẩn <strong>PWA + WebSocket</strong> và file cấu hình để bạn đóng gói thành <code>.apk</code> trong 1 phút:
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Cách 1: Đóng gói nhanh qua PWABuilder (Không cần Android Studio)
                </h4>
                <ol className="space-y-1.5 pl-1">
                  <li>1. Sao chép liên kết máy chủ của bạn: <code className="font-mono text-emerald-700 dark:text-emerald-400">{shareUrl}</code></li>
                  <li>
                    2. Truy cập{' '}
                    <a
                      href="https://www.pwabuilder.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-emerald-600 underline dark:text-emerald-400"
                    >
                      <span>pwabuilder.com</span>
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>{' '}
                    và dán liên kết vào.
                  </li>
                  <li>3. Chọn <strong>Package for Stores → Android → Download</strong> để tải file <code>.apk</code> đã ký sẵn về cài lên điện thoại Android.</li>
                </ol>
              </div>

              <div className="space-y-2.5 pt-1">
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Cách 2: Tải file cấu hình Capacitor / Bubblewrap CLI
                </h4>
                <p>
                  Hai tệp cấu hình bên dưới đã trỏ sẵn tới máy chủ từ xa hiện tại để ứng dụng APK kết nối WebSocket tức thì:
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="/api/apk-config/twa-manifest.json"
                    download="twa-manifest.json"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 min-h-[40px]"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Tải twa-manifest.json</span>
                  </a>
                  <a
                    href="/api/apk-config/capacitor.config.json"
                    download="capacitor.config.json"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 min-h-[40px]"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Tải capacitor.config.json</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
