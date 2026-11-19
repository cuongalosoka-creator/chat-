import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/message.dart';
import '../services/chat_service.dart';
import '../widgets/message_bubble.dart';
import 'login_screen.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({
    super.key,
    required this.userName,
    required this.chatService,
    required this.isDarkMode,
    required this.onToggleTheme,
  });

  final String userName;
  final ChatService chatService;
  final bool isDarkMode;
  final VoidCallback onToggleTheme;

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  final _focusNode = FocusNode();

  bool _showEmojiBar = false;
  int _lastMessageCount = 0;

  static const List<String> _quickEmojis = [
    '😂',
    '👍',
    '❤️',
    '🔥',
    '😊',
    '🎉',
    '🙏',
    '👋',
  ];

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    _messageController.clear();
    _focusNode.requestFocus();

    try {
      await widget.chatService.sendMessage(
        senderName: widget.userName,
        text: text,
      );
      _scrollToBottom();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Không gửi được tin nhắn: $e'),
        ),
      );
    }
  }

  Future<void> _handleLeave() async {
    await widget.chatService.leaveRoom();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        builder: (_) => LoginScreen(
          isDarkMode: widget.isDarkMode,
          onToggleTheme: widget.onToggleTheme,
        ),
      ),
    );
  }

  void _showMembersSheet() {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Thành viên trong phòng',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 12),
                Flexible(
                  child: StreamBuilder<List<RoomMember>>(
                    stream: widget.chatService.watchMembers(),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Center(child: CircularProgressIndicator());
                      }
                      final members = snapshot.data ?? [];
                      if (members.isEmpty) {
                        return const Text('Chưa có thành viên nào.');
                      }
                      return ListView.separated(
                        shrinkWrap: true,
                        itemCount: members.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final member = members[index];
                          final isMe =
                              member.uid == widget.chatService.currentUserId;
                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: CircleAvatar(
                              backgroundColor: const Color(0xFF059669),
                              foregroundColor: Colors.white,
                              child: Text(
                                member.name.isNotEmpty
                                    ? member.name[0].toUpperCase()
                                    : '?',
                              ),
                            ),
                            title: Text(
                              isMe ? '${member.name} (bạn)' : member.name,
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                            subtitle: Text(member.platform),
                          );
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  KeyEventResult _handleKeyEvent(FocusNode node, KeyEvent event) {
    if (event is KeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.enter &&
        !HardwareKeyboard.instance.isShiftPressed) {
      _sendMessage();
      return KeyEventResult.handled;
    }
    return KeyEventResult.ignored;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final myUid = widget.chatService.currentUserId;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          onPressed: _handleLeave,
          tooltip: 'Rời phòng',
          icon: const Icon(Icons.arrow_back),
        ),
        titleSpacing: 0,
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: const Color(0xFF059669),
                borderRadius: BorderRadius.circular(9),
              ),
              child: const Icon(
                Icons.chat_bubble_rounded,
                color: Colors.white,
                size: 18,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'CHAT RIÊNG',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    widget.userName,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: isDark
                          ? const Color(0xFF94A3B8)
                          : const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: widget.onToggleTheme,
            tooltip: 'Đổi giao diện Sáng / Tối',
            icon: Icon(
              widget.isDarkMode ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
            ),
          ),
          IconButton(
            onPressed: _showMembersSheet,
            tooltip: 'Thành viên trong phòng',
            icon: const Icon(Icons.group_outlined),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 860),
          child: Column(
            children: [
              Expanded(
                child: StreamBuilder<List<ChatMessage>>(
                  stream: widget.chatService.watchMessages(),
                  builder: (context, snapshot) {
                    if (snapshot.hasError) {
                      return Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Text(
                            'Lỗi tải tin nhắn: ${snapshot.error}',
                            textAlign: TextAlign.center,
                          ),
                        ),
                      );
                    }

                    if (snapshot.connectionState == ConnectionState.waiting &&
                        !snapshot.hasData) {
                      return const Center(child: CircularProgressIndicator());
                    }

                    final messages = snapshot.data ?? [];
                    if (messages.length != _lastMessageCount) {
                      _lastMessageCount = messages.length;
                      _scrollToBottom();
                    }

                    if (messages.isEmpty) {
                      return const Center(
                        child: Text('Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!'),
                      );
                    }

                    return ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 16,
                      ),
                      itemCount: messages.length,
                      itemBuilder: (context, index) {
                        final msg = messages[index];
                        final isMe = myUid != null && msg.senderId == myUid;
                        return MessageBubble(
                          message: msg,
                          isMe: isMe,
                        );
                      },
                    );
                  },
                ),
              ),
              if (_showEmojiBar)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF0F172A) : Colors.white,
                    border: Border(
                      top: BorderSide(
                        color: isDark
                            ? const Color(0xFF1E293B)
                            : const Color(0xFFE2E8F0),
                      ),
                    ),
                  ),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: _quickEmojis.map((emoji) {
                        return IconButton(
                          onPressed: () {
                            _messageController.text += emoji;
                            _messageController.selection = TextSelection.fromPosition(
                              TextPosition(offset: _messageController.text.length),
                            );
                          },
                          icon: Text(emoji, style: const TextStyle(fontSize: 22)),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              SafeArea(
                top: false,
                child: Container(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF0F172A) : Colors.white,
                    border: Border(
                      top: BorderSide(
                        color: isDark
                            ? const Color(0xFF1E293B)
                            : const Color(0xFFE2E8F0),
                      ),
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      IconButton(
                        onPressed: () {
                          setState(() {
                            _showEmojiBar = !_showEmojiBar;
                          });
                        },
                        tooltip: 'Biểu cảm',
                        icon: const Icon(Icons.emoji_emotions_outlined),
                      ),
                      Expanded(
                        child: Focus(
                          onKeyEvent: _handleKeyEvent,
                          child: TextField(
                            controller: _messageController,
                            focusNode: _focusNode,
                            minLines: 1,
                            maxLines: 4,
                            textInputAction: TextInputAction.newline,
                            decoration: InputDecoration(
                              hintText: 'Nhập tin nhắn...',
                              filled: true,
                              fillColor: isDark
                                  ? const Color(0xFF1E293B)
                                  : const Color(0xFFF1F5F9),
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 10,
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(14),
                                borderSide: BorderSide.none,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        width: 46,
                        height: 46,
                        child: FilledButton(
                          onPressed: _sendMessage,
                          style: FilledButton.styleFrom(
                            backgroundColor: const Color(0xFF059669),
                            padding: EdgeInsets.zero,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: const Icon(Icons.send_rounded, size: 20),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
