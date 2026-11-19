import 'package:cloud_firestore/cloud_firestore.dart';

class ChatMessage {
  final String id;
  final String senderId;
  final String senderName;
  final String senderPlatform;
  final String text;
  final DateTime timestamp;

  const ChatMessage({
    required this.id,
    required this.senderId,
    required this.senderName,
    required this.senderPlatform,
    required this.text,
    required this.timestamp,
  });

  factory ChatMessage.fromFirestore(
    DocumentSnapshot<Map<String, dynamic>> doc,
  ) {
    final data = doc.data() ?? <String, dynamic>{};
    final ts = data['timestamp'];
    DateTime parsedTime = DateTime.now();
    if (ts is Timestamp) {
      parsedTime = ts.toDate();
    } else if (ts is DateTime) {
      parsedTime = ts;
    }

    return ChatMessage(
      id: doc.id,
      senderId: (data['senderId'] ?? '').toString(),
      senderName: (data['senderName'] ?? 'Ẩn danh').toString(),
      senderPlatform: (data['senderPlatform'] ?? 'Thiết bị').toString(),
      text: (data['text'] ?? '').toString(),
      timestamp: parsedTime,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'senderId': senderId,
      'senderName': senderName,
      'senderPlatform': senderPlatform,
      'text': text,
      'timestamp': FieldValue.serverTimestamp(),
    };
  }
}

class RoomMember {
  final String uid;
  final String name;
  final String platform;
  final DateTime lastSeen;

  const RoomMember({
    required this.uid,
    required this.name,
    required this.platform,
    required this.lastSeen,
  });

  factory RoomMember.fromFirestore(
    DocumentSnapshot<Map<String, dynamic>> doc,
  ) {
    final data = doc.data() ?? <String, dynamic>{};
    final ts = data['lastSeen'];
    return RoomMember(
      uid: doc.id,
      name: (data['name'] ?? 'Thành viên').toString(),
      platform: (data['platform'] ?? 'Thiết bị').toString(),
      lastSeen: ts is Timestamp ? ts.toDate() : DateTime.now(),
    );
  }
}
