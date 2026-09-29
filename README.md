# TTS.LQS

Ứng dụng web TTS tiếng Việt theo nhịp phù hợp với lớp học. Giáo viên có thể chia bài theo câu, dấu câu hoặc số từ; phát lặp lại từng đoạn; và dành thời gian cho học sinh chép. Ứng dụng dùng Web Speech API cho các giọng của hệ điều hành và có giọng Piper tiếng Việt chạy ngay trên thiết bị.

## Yêu cầu

- Node.js 20.19+ hoặc 22.12+
- Trình duyệt hiện đại có `SpeechSynthesis` (Chrome, Edge, Safari hoặc Firefox mới)
- Chọn giọng **Tiếng Việt · Piper ngoại tuyến** để dùng model đọc tiếng Việt chạy ngay trên thiết bị. Lần đầu dùng, trình duyệt tải khoảng 115 MB model từ kho Piper trên Hugging Face và bộ đọc; các lần sau dùng dữ liệu đã lưu trong trình duyệt.

## Chạy trên máy

```bash
npm install
npm run dev
```

Mở URL Vite hiển thị trong terminal. Production build và xem thử:

```bash
npm run build
npm run preview
```

## Deploy lên Vercel

1. Đưa thư mục dự án lên một Git repository trên GitHub, GitLab hoặc Bitbucket.
2. Đăng nhập [Vercel](https://vercel.com/new), chọn **Add New → Project** và import repository.
3. Framework Preset chọn **Vite**. Build command là `npm run build`, output directory là `dist`; không cần environment variables.
4. Nhấn **Deploy**. Vercel sẽ cấp URL công khai dạng `https://ten-du-an.vercel.app` và tự deploy lại khi có commit mới.

## Deploy lên Netlify

Import repository tại [Netlify](https://app.netlify.com/start). Build command: `npm run build`; publish directory: `dist`. Netlify tự cấp URL `*.netlify.app` sau khi deploy.

## Tính năng

- Hai chế độ: đọc liên tục và giáo viên đọc chép.
- Điều chỉnh giọng, tốc độ 0.5x–2x, cao độ và âm lượng nếu voice hỗ trợ.
- Chia câu, chia theo dấu câu hoặc gom đoạn theo số từ, ưu tiên điểm ngắt dấu câu gần mục tiêu.
- Chọn 1–3 lần đọc, thời gian nghỉ giữa lần đọc và thời gian chép bài.
- Pause/resume kể cả trong lúc đếm ngược; stop, đọc lại, chuyển câu trước/sau.
- Preview có highlight, thanh tiến độ, phím tắt Space, ←, →, R và Esc.
- Cấu hình lưu trong `localStorage`. Nội dung chỉ lưu khi bật **Nhớ nội dung trên thiết bị này**.

## Quyền riêng tư và giới hạn

Văn bản bài đọc không được gửi đi. Giọng Piper tạo âm thanh ngay trong trình duyệt; chỉ model và bộ đọc được tải khi chọn giọng này. Lần đầu có thể cần chờ tải khoảng 115 MB tổng cộng từ trang TTS.LQS và kho model Piper trên Hugging Face; các lần sau trình duyệt dùng dữ liệu đã lưu. Các giọng hệ thống khác vẫn phụ thuộc browser/OS; một số trình duyệt có thể cần thao tác người dùng trước lần đọc đầu.
