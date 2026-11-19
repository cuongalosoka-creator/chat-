import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/message.dart';

class MessageBubble extends StatelessWidget {
  const MessageBubble({
    super.key,
    required this.message,
    required this.isMe,
  });

  final ChatMessage message;
  final bool isMe;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final formattedTime = DateFormat('HH:mm').format(message.timestamp);

    final bubbleColor = isMe
        ? const Color(0xFF059669)
        : (isDark ? const Color(0xFF1E293B) : Colors.white);
    final textColor = isMe
        ? Colors.white
        : (isDark ? const Color(0xFFF1F5F9) : const Color(0xFF0F172A));
    final timeColor = isMe
        ? const Color(0xFFD1FAE5)
        : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B));

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Column(
        crossAxisAlignment:
            isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
            child: Text(
              isMe
                  ? message.senderName
                  : '${message.senderName} · ${message.senderPlatform}',
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: isDark
                    ? const Color(0xFF94A3B8)
                    : const Color(0xFF475569),
              ),
            ),
          ),
          ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.74,
            ),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: bubbleColor,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(18),
                  topRight: const Radius.circular(18),
                  bottomLeft: Radius.circular(isMe ? 18 : 4),
                  bottomRight: Radius.circular(isMe ? 4 : 18),
                ),
                border: isMe
                    ? null
                    : Border.all(
                        color: isDark
                            ? const Color(0xFF334155)
                            : const Color(0xFFE2E8F0),
                      ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Align(
                    alignment: Alignment.centerLeft,
                    child: SelectableText(
                      message.text,
                      style: TextStyle(
                        fontSize: 15,
                        height: 1.4,
                        color: textColor,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    formattedTime,
                    style: TextStyle(
                      fontSize: 11,
                      color: timeColor,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
