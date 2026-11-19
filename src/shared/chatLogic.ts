export type DeviceType = 'mobile' | 'desktop';

export interface RoomUser {
  id: string;
  name: string;
  device: DeviceType;
  joinedAt: number;
}

export interface PrivateMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderDevice: DeviceType;
  text: string;
  timestamp: number;
}

export const QUICK_EMOJIS = ['😂', '👍', '❤️', '🔥', '😊', '🎉', '🙏', '👋'] as const;

export function validateDisplayName(name: string): {
  valid: boolean;
  error?: string;
  normalized: string;
} {
  const normalized = name.replace(/\s+/g, ' ').trim();
  if (normalized.length < 2) {
    return {
      valid: false,
      error: 'Vui lòng nhập tên người dùng (tối thiểu 2 ký tự).',
      normalized,
    };
  }
  if (normalized.length > 28) {
    return {
      valid: false,
      error: 'Tên người dùng tối đa 28 ký tự.',
      normalized,
    };
  }
  return {valid: true, normalized};
}

export function validateRoomCodeInput(code: string): {
  valid: boolean;
  error?: string;
  normalized: string;
} {
  const normalized = code.trim();
  if (normalized.length < 4) {
    return {
      valid: false,
      error: 'Mã phòng cần ít nhất 4 ký tự.',
      normalized,
    };
  }
  if (normalized.length > 64) {
    return {
      valid: false,
      error: 'Mã phòng tối đa 64 ký tự.',
      normalized,
    };
  }
  return {valid: true, normalized};
}

export function verifyRoomCodeMatch(inputCode: string, expectedCode: string): boolean {
  const a = inputCode.trim();
  const b = expectedCode.trim();
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function validateMessageText(text: string): {
  valid: boolean;
  error?: string;
  normalized: string;
} {
  const normalized = text.trim();
  if (normalized.length === 0) {
    return {
      valid: false,
      error: 'Vui lòng nhập nội dung tin nhắn.',
      normalized,
    };
  }
  if (normalized.length > 1500) {
    return {
      valid: false,
      error: 'Tin nhắn tối đa 1.500 ký tự.',
      normalized,
    };
  }
  return {valid: true, normalized};
}

export function upsertMessageIdempotent(
  messages: PrivateMessage[],
  incoming: PrivateMessage
): PrivateMessage[] {
  const idx = messages.findIndex((m) => m.id === incoming.id);
  if (idx !== -1) {
    const next = [...messages];
    next[idx] = incoming;
    return next;
  }
  const next = [...messages, incoming];
  next.sort((a, b) => a.timestamp - b.timestamp);
  return next;
}

export function isOwnMessage(message: PrivateMessage, currentUserId: string | null): boolean {
  return Boolean(currentUserId && message.senderId === currentUserId);
}

export function detectDeviceType(userAgent: string): DeviceType {
  const ua = userAgent.toLowerCase();
  if (/android|iphone|ipad|ipod|mobile|opera mini|iemobile/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

export function formatMessageTime(timestamp: number): string {
  const d = new Date(timestamp);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
