# CHAT RIÊNG (Flutter + Firebase)

Ứng dụng chat nhóm 1 phòng riêng tư dùng chung cho **Android** và **Windows**, đồng bộ realtime qua **Firebase Cloud Firestore** và **Firebase Anonymous Auth**.

## Cấu trúc thư mục

- `lib/main.dart` — Khởi tạo Firebase và giao diện Sáng/Tối.
- `lib/firebase_options.dart` — File cấu hình (sẽ tự động cập nhật khi chạy `flutterfire configure`).
- `lib/models/message.dart` — Model `ChatMessage` và `RoomMember`.
- `lib/services/chat_service.dart` — Kết nối Firebase Auth, mã hóa SHA-256 mã phòng, đọc/ghi Firestore.
- `lib/widgets/message_bubble.dart` — Bong bóng tin nhắn (của mình bên phải, người khác bên trái).
- `lib/screens/login_screen.dart` — Màn hình nhập tên & mã phòng.
- `lib/screens/chat_screen.dart` — Màn hình chat realtime, tự cuộn, Enter để gửi trên Windows.
- `firestore.rules` — Luật bảo mật Firestore.

## Bắt đầu nhanh

1. Tạo project trên Firebase Console, bật **Firestore Database** và **Authentication -> Anonymous**.
2. Tạo document `rooms/private_room` với field `roomCodeHash` (mã SHA-256 của mật khẩu phòng).
3. Dán nội dung `firestore.rules` vào mục **Firestore Database -> Rules -> Publish**.
4. Chạy `flutterfire configure` trong thư mục `chat_app/` để kết nối Android và Windows.
5. Build APK Android: `flutter build apk --release` -> lấy file tại `build/app/outputs/flutter-apk/app-release.apk`.
6. Build Windows: `flutter build windows --release` -> lấy thư mục `build/windows/x64/runner/Release/`.
