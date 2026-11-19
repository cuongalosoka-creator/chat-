import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/chat_service.dart';
import 'chat_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({
    super.key,
    required this.isDarkMode,
    required this.onToggleTheme,
  });

  final bool isDarkMode;
  final VoidCallback onToggleTheme;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _codeController = TextEditingController();
  final _chatService = ChatService();

  bool _obscureCode = true;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadSavedName();
  }

  Future<void> _loadSavedName() async {
    final prefs = await SharedPreferences.getInstance();
    final savedName = prefs.getString('saved_username');
    if (savedName != null && savedName.isNotEmpty && mounted) {
      _nameController.text = savedName;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _handleJoin() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final userName = _nameController.text.trim();
    final roomCode = _codeController.text.trim();

    try {
      await _chatService.joinRoom(
        userName: userName,
        roomCode: roomCode,
      );

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('saved_username', userName);

      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => ChatScreen(
            userName: userName,
            chatService: _chatService,
            isDarkMode: widget.isDarkMode,
            onToggleTheme: widget.onToggleTheme,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: widget.onToggleTheme,
            tooltip: widget.isDarkMode ? 'Chế độ sáng' : 'Chế độ tối',
            icon: Icon(
              widget.isDarkMode ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Card(
              elevation: 0,
              color: isDark ? const Color(0xFF0F172A) : Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(28),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Center(
                        child: Container(
                          width: 58,
                          height: 58,
                          decoration: BoxDecoration(
                            color: const Color(0xFF059669),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Icon(
                            Icons.chat_bubble_rounded,
                            color: Colors.white,
                            size: 30,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'CHAT RIÊNG',
                        textAlign: TextAlign.center,
                        style: theme.textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Phòng chat nhóm riêng tư cho Android & Windows',
                        textAlign: TextAlign.center,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: isDark
                              ? const Color(0xFF94A3B8)
                              : const Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(height: 28),
                      TextFormField(
                        controller: _nameController,
                        textInputAction: TextInputAction.next,
                        maxLength: 28,
                        decoration: InputDecoration(
                          labelText: 'Tên người dùng',
                          hintText: 'Ví dụ: Cường hoặc Minh',
                          prefixIcon: const Icon(Icons.person_outline),
                          counterText: '',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        validator: (value) {
                          final trimmed = (value ?? '').trim();
                          if (trimmed.length < 2) {
                            return 'Vui lòng nhập tên ít nhất 2 ký tự';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _codeController,
                        obscureText: _obscureCode,
                        textInputAction: TextInputAction.done,
                        onFieldSubmitted: (_) => _isLoading ? null : _handleJoin(),
                        decoration: InputDecoration(
                          labelText: 'Mã phòng',
                          hintText: 'Nhập mã phòng bí mật',
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            onPressed: () {
                              setState(() {
                                _obscureCode = !_obscureCode;
                              });
                            },
                            icon: Icon(
                              _obscureCode
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                            ),
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        validator: (value) {
                          if ((value ?? '').trim().isEmpty) {
                            return 'Vui lòng nhập mã phòng';
                          }
                          return null;
                        },
                      ),
                      if (_errorMessage != null) ...[
                        const SizedBox(height: 14),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF450A0A)
                                : const Color(0xFFFEF2F2),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isDark
                                  ? const Color(0xFF991B1B)
                                  : const Color(0xFFFECACA),
                            ),
                          ),
                          child: Text(
                            _errorMessage!,
                            style: TextStyle(
                              fontSize: 13,
                              color: isDark
                                  ? const Color(0xFFFCA5A5)
                                  : const Color(0xFFB91C1C),
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(height: 22),
                      SizedBox(
                        height: 48,
                        child: FilledButton(
                          onPressed: _isLoading ? null : _handleJoin,
                          style: FilledButton.styleFrom(
                            backgroundColor: const Color(0xFF059669),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text(
                                  'Vào phòng',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
