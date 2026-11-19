import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import express from 'express';
import {WebSocket, WebSocketServer} from 'ws';
import {
  upsertMessageIdempotent,
  validateDisplayName,
  validateMessageText,
  validateRoomCodeInput,
  verifyRoomCodeMatch,
  type DeviceType,
  type PrivateMessage,
  type RoomUser,
} from './src/shared/chatLogic.ts';

interface PrivateRoomStore {
  messages: PrivateMessage[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'private-room.json');
const MAX_MESSAGES = 500;
const ROOM_CODE = (process.env.ROOM_CODE || '202688').trim();

function createSeedMessages(): PrivateMessage[] {
  const now = Date.now();
  return [
    {
      id: 'seed-msg-1',
      senderId: 'seed-minh',
      senderName: 'Minh',
      senderDevice: 'mobile',
      text: 'Alo mọi người, mình vừa vào phòng bằng điện thoại rồi nhé!',
      timestamp: now - 1000 * 60 * 12,
    },
    {
      id: 'seed-msg-2',
      senderId: 'seed-cuong',
      senderName: 'Cường',
      senderDevice: 'desktop',
      text: 'Ok Minh, bên máy tính Windows nhận tin tức thì luôn 😂',
      timestamp: now - 1000 * 60 * 6,
    },
  ];
}

function loadStore(): PrivateRoomStore {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as Partial<PrivateRoomStore>;
      if (Array.isArray(parsed.messages)) {
        return {messages: parsed.messages.slice(-MAX_MESSAGES)};
      }
    }
  } catch (err) {
    console.error('Failed to read private-room.json, using seed:', err);
  }
  const seed = {messages: createSeedMessages()};
  saveStore(seed);
  return seed;
}

function saveStore(store: PrivateRoomStore): void {
  try {
    fs.mkdirSync(DATA_DIR, {recursive: true});
    const trimmed = {messages: store.messages.slice(-MAX_MESSAGES)};
    const tmpPath = `${STORE_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(trimmed, null, 2), 'utf8');
    fs.renameSync(tmpPath, STORE_PATH);
  } catch (err) {
    console.error('Failed to save private-room.json:', err);
  }
}

function resolvePublicOrigin(req: express.Request): string {
  const envUrl = process.env.APP_URL;
  if (envUrl && envUrl.startsWith('http') && !envUrl.includes('MY_APP_URL')) {
    return envUrl.replace(/\/+$/, '');
  }
  const protoHeader = req.headers['x-forwarded-proto'];
  const proto = Array.isArray(protoHeader)
    ? protoHeader[0]
    : (protoHeader || req.protocol || 'https').split(',')[0].trim();
  const hostHeader = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  return `${proto}://${host}`;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const store = loadStore();
  const server = http.createServer(app);
  const wss = new WebSocketServer({server, path: '/ws'});

  const roomSessions = new Map<WebSocket, RoomUser>();
  const aliveSockets = new WeakMap<WebSocket, boolean>();

  function getActiveMembers(): RoomUser[] {
    const byId = new Map<string, RoomUser>();
    for (const user of roomSessions.values()) {
      byId.set(user.id, user);
    }
    return Array.from(byId.values()).sort((a, b) => a.joinedAt - b.joinedAt);
  }

  function sendTo(ws: WebSocket, payload: unknown): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  function broadcastToAuthorized(payload: unknown): void {
    const serialized = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN && roomSessions.has(client)) {
        client.send(serialized);
      }
    }
  }

  wss.on('connection', (ws) => {
    aliveSockets.set(ws, true);
    ws.on('pong', () => aliveSockets.set(ws, true));

    ws.on('message', (rawData) => {
      let packet: {type: string; payload?: Record<string, unknown>};
      try {
        packet = JSON.parse(rawData.toString());
      } catch {
        sendTo(ws, {type: 'auth:error', message: 'Dữ liệu kết nối không hợp lệ.'});
        return;
      }

      if (packet.type === 'room:join') {
        const p = packet.payload ?? {};
        const userId = typeof p.userId === 'string' ? p.userId.trim() : '';
        const rawName = typeof p.name === 'string' ? p.name : '';
        const rawCode = typeof p.roomCode === 'string' ? p.roomCode : '';
        const device: DeviceType = p.device === 'mobile' ? 'mobile' : 'desktop';

        if (!userId) {
          sendTo(ws, {type: 'auth:error', message: 'Thiếu mã định danh thiết bị.'});
          return;
        }

        const nameCheck = validateDisplayName(rawName);
        if (!nameCheck.valid) {
          sendTo(ws, {type: 'auth:error', message: nameCheck.error});
          return;
        }

        const codeCheck = validateRoomCodeInput(rawCode);
        if (!codeCheck.valid) {
          sendTo(ws, {type: 'auth:error', message: codeCheck.error});
          return;
        }

        if (!verifyRoomCodeMatch(codeCheck.normalized, ROOM_CODE)) {
          sendTo(ws, {
            type: 'auth:error',
            message: 'Mã phòng không đúng. Chỉ thành viên có mã phòng mới được tham gia.',
          });
          return;
        }

        const user: RoomUser = {
          id: userId,
          name: nameCheck.normalized,
          device,
          joinedAt: Date.now(),
        };
        roomSessions.set(ws, user);

        sendTo(ws, {
          type: 'room:joined',
          user,
          messages: store.messages,
          members: getActiveMembers(),
        });
        broadcastToAuthorized({
          type: 'members:updated',
          members: getActiveMembers(),
        });
        return;
      }

      if (packet.type === 'room:leave') {
        if (roomSessions.has(ws)) {
          roomSessions.delete(ws);
          broadcastToAuthorized({
            type: 'members:updated',
            members: getActiveMembers(),
          });
        }
        return;
      }

      if (packet.type === 'message:send') {
        const sessionUser = roomSessions.get(ws);
        if (!sessionUser) {
          sendTo(ws, {
            type: 'auth:error',
            message: 'Phiên phòng chat chưa được xác thực. Vui lòng nhập mã phòng.',
          });
          return;
        }

        const p = packet.payload ?? {};
        const rawText = typeof p.text === 'string' ? p.text : '';
        const customId =
          typeof p.id === 'string' && p.id.trim()
            ? p.id.trim()
            : `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const textCheck = validateMessageText(rawText);
        if (!textCheck.valid) {
          sendTo(ws, {type: 'chat:error', message: textCheck.error});
          return;
        }

        const message: PrivateMessage = {
          id: customId,
          senderId: sessionUser.id,
          senderName: sessionUser.name,
          senderDevice: sessionUser.device,
          text: textCheck.normalized,
          timestamp: Date.now(),
        };

        store.messages = upsertMessageIdempotent(store.messages, message);
        saveStore(store);
        broadcastToAuthorized({type: 'message:created', message});
      }
    });

    ws.on('close', () => {
      if (roomSessions.has(ws)) {
        roomSessions.delete(ws);
        broadcastToAuthorized({
          type: 'members:updated',
          members: getActiveMembers(),
        });
      }
    });
  });

  const heartbeatInterval = setInterval(() => {
    for (const client of wss.clients) {
      if (aliveSockets.get(client) === false) {
        client.terminate();
        continue;
      }
      aliveSockets.set(client, false);
      client.ping();
    }
  }, 30000);

  wss.on('close', () => clearInterval(heartbeatInterval));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      membersCount: getActiveMembers().length,
      messagesCount: store.messages.length,
    });
  });

  app.post('/api/verify-room', (req, res) => {
    const rawName = typeof req.body?.name === 'string' ? req.body.name : '';
    const rawCode = typeof req.body?.roomCode === 'string' ? req.body.roomCode : '';
    const nameCheck = validateDisplayName(rawName);
    if (!nameCheck.valid) {
      res.status(400).json({ok: false, error: nameCheck.error});
      return;
    }
    const codeCheck = validateRoomCodeInput(rawCode);
    if (!codeCheck.valid) {
      res.status(400).json({ok: false, error: codeCheck.error});
      return;
    }
    if (!verifyRoomCodeMatch(codeCheck.normalized, ROOM_CODE)) {
      res.status(403).json({ok: false, error: 'Mã phòng không đúng.'});
      return;
    }
    res.json({ok: true, name: nameCheck.normalized});
  });

  app.get('/api/apk-config/twa-manifest.json', (req, res) => {
    const origin = resolvePublicOrigin(req);
    const url = new URL(origin);
    res.setHeader('Content-Disposition', 'attachment; filename="twa-manifest.json"');
    res.json({
      packageId: 'vn.chatrieng.private',
      host: url.host,
      name: 'CHAT RIÊNG',
      launcherName: 'Chat Riêng',
      display: 'standalone',
      themeColor: '#059669',
      navigationColor: '#059669',
      backgroundColor: '#F8FAFC',
      startUrl: '/',
      iconUrl: `${origin}/pwa-512x512.png`,
      maskableIconUrl: `${origin}/pwa-maskable-512x512.png`,
      appVersionName: '1.0.0',
      appVersionCode: 1,
      generatorApp: 'bubblewrap-cli',
      webManifestUrl: `${origin}/manifest.webmanifest`,
    });
  });

  app.get('/api/apk-config/capacitor.config.json', (req, res) => {
    const origin = resolvePublicOrigin(req);
    res.setHeader('Content-Disposition', 'attachment; filename="capacitor.config.json"');
    res.json({
      appId: 'vn.chatrieng.private',
      appName: 'CHAT RIÊNG',
      webDir: 'dist',
      server: {
        url: origin,
        cleartext: origin.startsWith('http://'),
        androidScheme: 'https',
      },
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true, hmr: false},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`CHAT RIÊNG server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
