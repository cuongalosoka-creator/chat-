import React, {useState} from 'react';
import {Eye, EyeOff, Lock, MessageCircle, Moon, Smartphone, Sun, User} from 'lucide-react';
import {validateDisplayName, validateRoomCodeInput} from '../shared/chatLogic';

interface JoinScreenProps {
  onJoin: (name: string, roomCode: string) => void;
  authError: string | null;
  onClearError: () => void;
  isJoining: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenInstallModal: () => void;
}

export const JoinScreen: React.FC<JoinScreenProps> = ({
  onJoin,
  authError,
  onClearError,
  isJoining,
  darkMode,
  onToggleDarkMode,
  onOpenInstallModal,
}) => {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayedError = localError || authError;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nameCheck = validateDisplayName(name);
    if (!nameCheck.valid) {
      setLocalError(nameCheck.error || 'Tên người dùng không hợp lệ.');
      return;
    }
    const codeCheck = validateRoomCodeInput(roomCode);
    if (!codeCheck.valid) {
      setLocalError(codeCheck.error || 'Mã phòng không hợp lệ.');
      return;
    }
    setLocalError(null);
    onJoin(nameCheck.normalized, codeCheck.normalized);
  };

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex items-center justify-end px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onToggleDarkMode}
          aria-label={darkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* App Logo & Title */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <MessageCircle className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              CHAT RIÊNG
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              Phòng chat nhóm riêng tư cho điện thoại và máy tính
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
            <div>
              <label
                htmlFor="join-username"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Tên người dùng
              </label>
              <div className="relative mt-1.5">
                <User
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="join-username"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (localError) setLocalError(null);
                    if (authError) onClearError();
                  }}
                  placeholder="Ví dụ: Cường hoặc Minh"
                  maxLength={28}
                  autoComplete="nickname"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[46px]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="join-room-code"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Mã phòng
              </label>
              <div className="relative mt-1.5">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="join-room-code"
                  type={showCode ? 'text' : 'password'}
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value);
                    if (localError) setLocalError(null);
                    if (authError) onClearError();
                  }}
                  placeholder="Nhập mã phòng bí mật"
                  maxLength={64}
                  autoComplete="off"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[46px]"
                />
                <button
                  type="button"
                  onClick={() => setShowCode((v) => !v)}
                  aria-label={showCode ? 'Ẩn mã phòng' : 'Hiện mã phòng'}
                  className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {displayedError && (
              <p
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-300"
              >
                {displayedError}
              </p>
            )}

            <button
              type="submit"
              disabled={isJoining}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors min-h-[48px]"
            >
              {isJoining ? 'Đang kiểm tra...' : 'Vào phòng'}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-4 text-center dark:border-slate-800">
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors min-h-[40px]"
            >
              <Smartphone className="h-4 w-4" aria-hidden="true" />
              <span>Mở trên điện thoại & Cài App / APK</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
