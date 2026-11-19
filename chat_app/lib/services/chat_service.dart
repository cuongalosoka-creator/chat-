import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:crypto/crypto.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import '../models/message.dart';

class ChatService {
  ChatService({
    FirebaseAuth? auth,
    FirebaseFirestore? firestore,
  })  : _auth = auth ?? FirebaseAuth.instance,
        _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseAuth _auth;
  final FirebaseFirestore _firestore;

  static const String roomId = 'private_room';

  DocumentReference<Map<String, dynamic>> get _roomRef =>
      _firestore.collection('rooms').doc(roomId);

  CollectionReference<Map<String, dynamic>> get _messagesRef =>
      _roomRef.collection('messages');

  CollectionReference<Map<String, dynamic>> get _membersRef =>
      _roomRef.collection('members');

  String? get currentUserId => _auth.currentUser?.uid;

  static String hashRoomCode(String rawCode) {
    final bytes = utf8.encode(rawCode.trim());
    return sha256.convert(bytes).toString();
  }

  static String detectPlatformLabel() {
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'Android';
      case TargetPlatform.windows:
        return 'Windows';
      case TargetPlatform.iOS:
        return 'iPhone';
      case TargetPlatform.macOS:
        return 'macOS';
      case TargetPlatform.linux:
        return 'Linux';
      default:
        return 'Thiết bị';
    }
  }

  /// Đăng nhập ẩn danh và xác thực mã phòng thông qua Firestore Security Rules.
  Future<void> joinRoom({
    required String userName,
    required String roomCode,
  }) async {
    final cleanName = userName.trim().replaceAll(RegExp(r'\s+'), ' ');
    final cleanCode = roomCode.trim();

    if (cleanName.length < 2 || cleanName.length > 28) {
      throw Exception('Tên người dùng cần từ 2 đến 28 ký tự.');
    }
    if (cleanCode.isEmpty) {
      throw Exception('Vui lòng nhập mã phòng.');
    }

    User? user = _auth.currentUser;
    if (user == null) {
      final credential = await _auth.signInAnonymously();
      user = credential.user;
    }

    if (user == null) {
      throw Exception('Không thể khởi tạo phiên đăng nhập Firebase.');
    }

    final codeHash = hashRoomCode(cleanCode);

    try {
      await _membersRef.doc(user.uid).set({
        'name': cleanName,
        'platform': detectPlatformLabel(),
        'roomCodeHash': codeHash,
        'lastSeen': FieldValue.serverTimestamp(),
      });
    } on FirebaseException catch (e) {
      if (e.code == 'permission-denied') {
        throw Exception(
          'Mã phòng không đúng hoặc Firestore chưa có tài liệu rooms/private_room.',
        );
      }
      throw Exception('Lỗi Firebase (${e.code}): ${e.message ?? "Không xác định"}');
    }
  }

  Stream<List<ChatMessage>> watchMessages() {
    return _messagesRef
        .orderBy('timestamp', descending: false)
        .limitToLast(200)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map((doc) => ChatMessage.fromFirestore(doc))
              .toList(growable: false),
        );
  }

  Stream<List<RoomMember>> watchMembers() {
    return _membersRef
        .orderBy('lastSeen', descending: true)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map((doc) => RoomMember.fromFirestore(doc))
              .toList(growable: false),
        );
  }

  Future<void> sendMessage({
    required String senderName,
    required String text,
  }) async {
    final user = _auth.currentUser;
    if (user == null) {
      throw Exception('Phiên đăng nhập đã hết hạn, vui lòng vào phòng lại.');
    }

    final cleanText = text.trim();
    if (cleanText.isEmpty) return;

    final message = ChatMessage(
      id: '',
      senderId: user.uid,
      senderName: senderName.trim(),
      senderPlatform: detectPlatformLabel(),
      text: cleanText,
      timestamp: DateTime.now(),
    );

    await _messagesRef.add(message.toFirestore());
  }

  Future<void> leaveRoom() async {
    final user = _auth.currentUser;
    if (user != null) {
      try {
        await _membersRef.doc(user.uid).delete();
      } catch (_) {
        // Bỏ qua nếu mất mạng khi rời phòng
      }
    }
  }
}
