import React, {useEffect, useRef, useState} from 'react';
import {
  ArrowLeft,
  MessageCircle,
  Monitor,
  Moon,
  SendHorizontal,
  Smile,
  Smartphone,
  Sun,
  Users,
  X,
} from 'lucide-react';
import {
  QUICK_EMOJIS,
  formatMessageTime,
  isOwnMessage,
  validateMessageText,
  type PrivateMessage,
  type RoomUser,
} from '../shared/chatLogic';
import type {ConnectionState} from '../hooks/useChatSocket';

interface ChatScreenProps {
  currentUser: RoomUser;
  messages: PrivateMessage[];
  members: RoomUser[];
  connectionState: ConnectionState;
  chatError: string | null;
  onClearChatError: () => void;
  onSendMessage: (text: string) => boolean;
  onLeaveRoom: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenInstallModal: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  currentUser,
  messages,
  members,
  connectionState,
  chatError,
  onClearChatError,
  onSendMessage,
  onLeaveRoom,
  darkMode,
  onToggleDarkMode,
  onOpenInstallModal,
}) => {
  const [draft, setDraft] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const feedRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({behavior: 'auto'});
  }, []);

  const submitMessage = () => {
    const check = validateMessageText(draft);
    if (!check.valid) {
      setLocalError(check.error || 'Vui lòng nhập nội dung tin nhắn.');
      return;
    }
    const ok = onSendMessage(check.normalized);
    if (ok) {
      setDraft('');
      setLocalError(null);
      setShowEmojiPicker(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  const displayedError = localError || chatError;

  return (
    <div className="h-dvh flex flex-col bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Main Centered Responsive Chat Container */}
      <div className="mx-auto flex h-full w-full max-w-4xl flex-col bg-white dark:bg-slate-900 md:border-x md:border-slate-200 dark:md:border-slate-800">
        {/* Top Bar */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-3 sm:px-5 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onLeaveRoom}
              aria-label="Rời phòng chat"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <h1 className="font-display text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">
                CHAT RIÊNG
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {connectionState === 'connected'
                  ? `${currentUser.name} · Trực tuyến`
                  : 'Đang kết nối lại...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label={darkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => setShowMembers(true)}
              aria-label={`Xem thành viên trong phòng (${members.length})`}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              <span className="font-mono tabular-nums">{members.length}</span>
            </button>
          </div>
        </header>

        {/* Message List */}
        <main
          ref={feedRef}
          data-testid="message-feed"
          className="flex-1 overflow-y-auto bg-slate-50/70 px-3 py-4 sm:px-6 space-y-3 dark:bg-slate-950/60"
        >
          {messages.length === 0 ? (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center px-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-900">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                Chưa có tin nhắn nào
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Hãy gửi lời chào đầu tiên đến mọi người trong phòng.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const mine = isOwnMessage(msg, currentUser.id);
              return (
                <div
                  key={msg.id}
                  data-testid="chat-message"
                  data-own={mine ? 'true' : 'false'}
                  className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}
                >
                  {/* Sender name above bubble */}
                  <div className="mb-1 flex items-center gap-1.5 px-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {msg.senderName}
                    </span>
                    {!mine && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{msg.senderDevice === 'mobile' ? 'Điện thoại' : 'Máy tính'}</span>
                      </>
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[82%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-2xs ${
                      mine
                        ? 'rounded-br-sm bg-emerald-600 text-white'
                        : 'rounded-bl-sm border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100'
                    }`}
                  >
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                      {msg.text}
                    </p>
                    <div
                      className={`mt-1 text-right font-mono text-[11px] tabular-nums ${
                        mine ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {formatMessageTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </main>

        {/* Composer */}
        <footer className="relative shrink-0 border-t border-slate-200 bg-white px-3 py-2.5 pb-safe sm:px-5 sm:py-3 dark:border-slate-800 dark:bg-slate-900">
          {displayedError && (
            <p
              role="alert"
              className="mb-2 text-xs font-medium text-rose-600 dark:text-rose-400"
            >
              {displayedError}
            </p>
          )}

          {showEmojiPicker && (
            <div className="mb-2 flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1.5 dark:border-slate-800 dark:bg-slate-800">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setDraft((prev) => prev + emoji);
                    inputRef.current?.focus();
                  }}
                  aria-label={`Chèn biểu cảm ${emoji}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-lg hover:bg-white dark:hover:bg-slate-700"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker((v) => !v)}
              aria-label="Chọn biểu cảm"
              aria-expanded={showEmojiPicker}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              <Smile className="h-5 w-5" />
            </button>

            <label htmlFor="chat-message-input" className="sr-only">
              Nhập tin nhắn
            </label>
            <textarea
              id="chat-message-input"
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (localError) setLocalError(null);
                if (chatError) onClearChatError();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
              maxLength={1500}
              className="min-h-[44px] max-h-32 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
            />

            <button
              type="button"
              onClick={submitMessage}
              aria-label="Gửi tin nhắn"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <SendHorizontal className="h-5 w-5" />
            </button>
          </div>
        </footer>
      </div>

      {/* Members & Mobile Connect Modal */}
      {showMembers && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="members-modal-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h2
                id="members-modal-title"
                className="font-display text-base font-bold text-slate-900 dark:text-white"
              >
                Thành viên trong phòng ({members.length})
              </h2>
              <button
                type="button"
                onClick={() => setShowMembers(false)}
                aria-label="Đóng danh sách thành viên"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto p-4 space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-800/60"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {m.name} {m.id === currentUser.id ? '(bạn)' : ''}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      {m.device === 'mobile' ? (
                        <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Monitor className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span>{m.device === 'mobile' ? 'Điện thoại' : 'Máy tính'}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 p-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowMembers(false);
                  onOpenInstallModal();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 min-h-[42px]"
              >
                <Smartphone className="h-4 w-4" aria-hidden="true" />
                <span>Mở QR & Cài App / APK trên điện thoại</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
