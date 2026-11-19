import {useCallback, useEffect, useRef, useState} from 'react';
import {
  detectDeviceType,
  upsertMessageIdempotent,
  type PrivateMessage,
  type RoomUser,
} from '../shared/chatLogic';

const SESSION_KEY = 'chatrieng_session_v1';
const USER_ID_KEY = 'chatrieng_user_id_v1';

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting';

interface SavedSession {
  userId: string;
  name: string;
  roomCode: string;
}

function getOrCreateUserId(): string {
  const existing = localStorage.getItem(USER_ID_KEY);
  if (existing) return existing;
  const created = `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  localStorage.setItem(USER_ID_KEY, created);
  return created;
}

function loadInitialSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedSession>;
    if (
      typeof parsed.name === 'string' &&
      parsed.name.trim().length >= 2 &&
      typeof parsed.roomCode === 'string' &&
      parsed.roomCode.trim().length >= 4
    ) {
      return {
        userId: parsed.userId || getOrCreateUserId(),
        name: parsed.name.trim(),
        roomCode: parsed.roomCode.trim(),
      };
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

export function useChatSocket() {
  const [currentUser, setCurrentUser] = useState<RoomUser | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [members, setMembers] = useState<RoomUser[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [authError, setAuthError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const sessionRef = useRef<SavedSession | null>(loadInitialSession());
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const sendJoin = useCallback((ws: WebSocket, session: SavedSession) => {
    ws.send(
      JSON.stringify({
        type: 'room:join',
        payload: {
          userId: session.userId,
          name: session.name,
          roomCode: session.roomCode,
          device: detectDeviceType(navigator.userAgent),
        },
      })
    );
  }, []);

  useEffect(() => {
    let disposed = false;

    function connect() {
      if (disposed) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (disposed) return;
        reconnectAttemptsRef.current = 0;
        setConnectionState('connected');
        if (sessionRef.current) {
          sendJoin(ws, sessionRef.current);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'room:joined': {
              setIsJoining(false);
              setAuthError(null);
              setChatError(null);
              if (data.user) {
                setCurrentUser(data.user as RoomUser);
              }
              if (Array.isArray(data.messages)) {
                setMessages(() => {
                  let list: PrivateMessage[] = [];
                  for (const m of data.messages as PrivateMessage[]) {
                    list = upsertMessageIdempotent(list, m);
                  }
                  return list;
                });
              }
              if (Array.isArray(data.members)) {
                setMembers(data.members as RoomUser[]);
              }
              break;
            }
            case 'members:updated': {
              if (Array.isArray(data.members)) {
                setMembers(data.members as RoomUser[]);
              }
              break;
            }
            case 'message:created': {
              if (data.message) {
                setMessages((prev) => upsertMessageIdempotent(prev, data.message as PrivateMessage));
              }
              break;
            }
            case 'auth:error': {
              setIsJoining(false);
              setAuthError(typeof data.message === 'string' ? data.message : 'Không thể vào phòng.');
              sessionRef.current = null;
              localStorage.removeItem(SESSION_KEY);
              setCurrentUser(null);
              break;
            }
            case 'chat:error': {
              setChatError(typeof data.message === 'string' ? data.message : 'Không thể gửi tin nhắn.');
              break;
            }
          }
        } catch {
          // ignore invalid frame
        }
      };

      ws.onclose = () => {
        if (disposed) return;
        setConnectionState('reconnecting');
        const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 8000);
        reconnectAttemptsRef.current += 1;
        reconnectTimerRef.current = window.setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      disposed = true;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      wsRef.current?.close();
    };
  }, [sendJoin]);

  const joinRoom = useCallback(
    (name: string, roomCode: string) => {
      const userId = getOrCreateUserId();
      const session: SavedSession = {
        userId,
        name: name.trim(),
        roomCode: roomCode.trim(),
      };
      sessionRef.current = session;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setAuthError(null);
      setIsJoining(true);

      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        sendJoin(ws, session);
      }
    },
    [sendJoin]
  );

  const leaveRoom = useCallback(() => {
    sessionRef.current = null;
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
    setMessages([]);
    setMembers([]);
    setAuthError(null);
    setChatError(null);

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({type: 'room:leave'}));
    }
  }, []);

  const sendMessage = useCallback((text: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setChatError('Đang kết nối lại máy chủ, vui lòng thử lại sau giây lát.');
      return false;
    }
    setChatError(null);
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    ws.send(
      JSON.stringify({
        type: 'message:send',
        payload: {id, text},
      })
    );
    return true;
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);
  const clearChatError = useCallback(() => setChatError(null), []);

  return {
    currentUser,
    messages,
    members,
    connectionState,
    authError,
    chatError,
    isJoining,
    joinRoom,
    leaveRoom,
    sendMessage,
    clearAuthError,
    clearChatError,
  };
}
