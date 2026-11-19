import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectDeviceType,
  formatMessageTime,
  isOwnMessage,
  upsertMessageIdempotent,
  validateDisplayName,
  validateMessageText,
  validateRoomCodeInput,
  verifyRoomCodeMatch,
  type PrivateMessage,
} from './chatLogic';

const makeMsg = (overrides: Partial<PrivateMessage> = {}): PrivateMessage => ({
  id: 'm1',
  senderId: 'u1',
  senderName: 'Minh',
  senderDevice: 'mobile',
  text: 'Alo mọi người',
  timestamp: 1700000000000,
  ...overrides,
});

test('validateDisplayName rejects blank or single-char names and normalizes spaces', () => {
  assert.equal(validateDisplayName('').valid, false);
  assert.equal(validateDisplayName(' A ').valid, false);
  const ok = validateDisplayName('  Cường   Nguyễn  ');
  assert.equal(ok.valid, true);
  assert.equal(ok.normalized, 'Cường Nguyễn');
});

test('validateRoomCodeInput enforces minimum length', () => {
  assert.equal(validateRoomCodeInput('123').valid, false);
  assert.equal(validateRoomCodeInput('   ').valid, false);
  const ok = validateRoomCodeInput(' 202688 ');
  assert.equal(ok.valid, true);
  assert.equal(ok.normalized, '202688');
});

test('verifyRoomCodeMatch performs exact trimmed comparison', () => {
  assert.equal(verifyRoomCodeMatch('202688', '202688'), true);
  assert.equal(verifyRoomCodeMatch(' 202688 ', '202688'), true);
  assert.equal(verifyRoomCodeMatch('123456', '202688'), false);
  assert.equal(verifyRoomCodeMatch('', '202688'), false);
});

test('validateMessageText validates empty and oversized messages', () => {
  assert.equal(validateMessageText('   \n  ').valid, false);
  assert.equal(validateMessageText('a'.repeat(1501)).valid, false);
  const ok = validateMessageText('  Alo 😂  ');
  assert.equal(ok.valid, true);
  assert.equal(ok.normalized, 'Alo 😂');
});

test('upsertMessageIdempotent avoids duplicates and keeps chronological order', () => {
  const m2 = makeMsg({id: 'm2', timestamp: 2000, text: 'Tin sau'});
  const m1 = makeMsg({id: 'm1', timestamp: 1000, text: 'Tin đầu'});

  let list = upsertMessageIdempotent([], m2);
  list = upsertMessageIdempotent(list, m1);
  assert.deepEqual(
    list.map((m) => m.id),
    ['m1', 'm2']
  );

  list = upsertMessageIdempotent(list, {...m1, text: 'Tin đầu cập nhật'});
  assert.equal(list.length, 2);
  assert.equal(list[0].text, 'Tin đầu cập nhật');
});

test('isOwnMessage distinguishes sender alignment', () => {
  const msg = makeMsg({senderId: 'user-a'});
  assert.equal(isOwnMessage(msg, 'user-a'), true);
  assert.equal(isOwnMessage(msg, 'user-b'), false);
  assert.equal(isOwnMessage(msg, null), false);
});

test('detectDeviceType and formatMessageTime work accurately', () => {
  assert.equal(detectDeviceType('Android 14 Mobile'), 'mobile');
  assert.equal(detectDeviceType('Windows NT 10.0; Win64; x64'), 'desktop');
  assert.match(formatMessageTime(1700000000000), /^\d{2}:\d{2}$/);
});
