# Social Media App �

Đây là dự án mạng xã hội di động được xây dựng bằng [React Native (Expo)](https://expo.dev) và [Supabase](https://supabase.com/) làm backend. Ứng dụng cho phép người dùng đăng nhập, quản lý hồ sơ, kết bạn, đăng bài, bình luận, thích, nhận thông báo và nhiều tính năng xã hội khác.

## Mô tả dự án

- Ứng dụng mạng xã hội đa nền tảng (Android, iOS, Web)
- Đăng nhập, đăng ký, quản lý hồ sơ cá nhân
- Kết bạn, gửi/nhận lời mời kết bạn, chặn bạn
- Đăng bài, bình luận, thích, chia sẻ
- Nhận thông báo về hoạt động bạn bè
- Tích hợp Supabase cho backend, lưu trữ, xác thực

## Nguyên tắc phát triển

- Code rõ ràng, dễ bảo trì, tuân thủ chuẩn TypeScript
- Ưu tiên teamwork, giao tiếp hiệu quả
- Bảo mật thông tin người dùng
- Tuân thủ quy trình Scrum: chia sprint, daily standup, review
- Tối ưu hiệu năng, trải nghiệm người dùng

## Hướng dẫn sử dụng

[//]: # 'Hướng dẫn khởi động máy ảo với Cold booting và kiểm tra kết nối mạng'

### Khởi động máy ảo Android với Cold booting và kiểm tra kết nối mạng

1. Mở Android Studio > Tools > Device Manager.
2. Chọn máy ảo bạn muốn sử dụng, nhấn vào mũi tên cạnh nút "Play" và chọn **Cold Boot** để khởi động lại máy ảo từ đầu (giúp tránh lỗi mạng).
3. Sau khi máy ảo khởi động, mở ứng dụng **Chrome** hoặc **Browser** trên máy ảo và truy cập thử vào trang web như `https://google.com` để kiểm tra kết nối internet.
4. Nếu không vào được mạng, hãy kiểm tra lại cấu hình mạng của máy ảo hoặc khởi động lại máy ảo.

### Cài đặt

```bash
npm install
```

### Chạy ứng dụng

```bash
npx expo start
```

Bạn có thể mở app trên:

- Android Emulator
- iOS Simulator
- Expo Go

Chỉnh sửa mã nguồn tại thư mục **app/**, **components/**, **screens/**. Dự án sử dụng [React Navigation](https://reactnative.dev/docs/navigation).

### Sử dụng biến môi trường với Expo

Để lưu và sử dụng các key bí mật (API key, Supabase key, v.v.) trong Expo, bạn cần:

1. Tạo file `.env` ở thư mục gốc dự án, các biến phải bắt đầu bằng `EXPO_PUBLIC_`, ví dụ:

    ```env
    EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
    EXPO_PUBLIC_SUPABASE_KEY=your-secret-key
    ```

2. Truy cập biến môi trường trong mã nguồn:

    ```ts
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;
    ```

3. Tham khảo thêm: https://docs.expo.dev/guides/environment-variables/

4. Lưu ý bảo mật:
    - Không commit file `.env` lên GitHub (thêm vào `.gitignore`)
    - Chỉ dùng biến môi trường cho các key nhạy cảm

[//]: # 'Hướng dẫn cấu hình Google Sign-In với React Native, @react-native-google-signin/google-signin và Supabase'

### Hướng dẫn cấu hình Google Sign-In với Supabase và React Native

1. **Tạo project trên Google Cloud Console**
    - Vào Google Cloud Console, tạo dự án mới.
    - Cấu hình màn hình xác nhận (consent screen).
    - Tạo credentials cho website (Web application).
        - Lấy Authorized redirect URIs từ Supabase và điền vào.
    - Tạo credentials cho Android (Android application).
        - Nhập package name (lấy từ file `app.json`).
        - Nhập SHA-1 (lấy bằng lệnh `keytool -keystore path-to-debug-or-production-keystore -list -v`).

2. **Cấu hình Supabase**
    - Vào Supabase Dashboard > Authentication > Settings > External OAuth Providers > Google.
    - Bật Google và dán client ID của Android vào trường Client ID.

3. **Cấu hình trong mã nguồn**
    - Thêm các client ID và client secret vào Supabase và vào file `.env` của dự án.
    - Ví dụ file `.env`:
        ```
        EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
        EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
        ```

4. **Thêm quyền truy cập dữ liệu (data access) và branching nếu cần.**

## Tài nguyên tham khảo

- [Expo documentation](https://docs.expo.dev/)
- [React Native](https://reactnative.dev/docs/environment-setup)
- [Supabase](https://supabase.com/docs/guides/auth/quickstarts/react-native)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [Axios](https://github.com/axios/axios)
- [React Native vs ENV](https://docs.expo.dev/guides/environment-variables/)
- [React Native vs Supabase](https://supabase.com/docs/guides/auth/quickstarts/react-native)
- [React Native Google Sign In](https://react-native-google-signin.github.io/)
- [React Native Icons](https://icons.expo.fyi/Index)
