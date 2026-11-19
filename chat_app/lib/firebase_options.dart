// Tệp này sẽ được tạo tự động khi bạn chạy lệnh:
//   flutterfire configure
//
// Hãy thay toàn bộ nội dung file này bằng file firebase_options.dart do FlutterFire CLI sinh ra.
// Xem hướng dẫn chi tiết trong README.md.

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError(
        'Chưa cấu hình Firebase cho Web. Hãy chạy `flutterfire configure`.',
      );
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.windows:
        return windows;
      default:
        throw UnsupportedError(
          'Nền tảng này chưa được cấu hình. Hãy chạy `flutterfire configure`.',
        );
    }
  }

  // THAY CÁC GIÁ TRỊ BÊN DƯỚI BẰNG CẤU HÌNH THẬT TỪ `flutterfire configure`
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'YOUR_ANDROID_API_KEY',
    appId: 'YOUR_ANDROID_APP_ID',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    projectId: 'YOUR_FIREBASE_PROJECT_ID',
    storageBucket: 'YOUR_FIREBASE_PROJECT_ID.firebasestorage.app',
  );

  static const FirebaseOptions windows = FirebaseOptions(
    apiKey: 'YOUR_WINDOWS_API_KEY',
    appId: 'YOUR_WINDOWS_APP_ID',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    projectId: 'YOUR_FIREBASE_PROJECT_ID',
    storageBucket: 'YOUR_FIREBASE_PROJECT_ID.firebasestorage.app',
  );
}
