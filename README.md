# me — Trang web cá nhân của Nguyen Van Thuan

Trang portfolio/CV online cho **Nguyen Van Thuan** — Software Engineer (Java · Node.js/NestJS · CPaaS · AI/MCP), Đà Nẵng.

Trang là **static site thuần** (HTML + CSS + JavaScript, không framework, không build step). Mở `index.html` là chạy.

---

## 1. Chạy thử ở máy

```bash
cd ~/FREE/me

# Cách 1: mở thẳng file
open index.html

# Cách 2 (khuyên dùng, giống môi trường thật hơn): chạy server tĩnh
npx serve .            # hoặc: python3 -m http.server 5173
# rồi mở http://localhost:3000 (serve) hoặc http://localhost:5173 (python)
```

Không cần `npm install`. Font tải từ Google Fonts và three.js tải từ jsDelivr, nên cần có mạng để thấy đúng kiểu chữ và cảnh 3D trong phòng.

---

## 2. Cấu trúc thư mục

```
me/
├── index.html              # Khung trang: sân khấu (stage), 3 máy nhánh, phòng chi tiết, các section CV
├── assets/
│   ├── css/style.css       # Toàn bộ style. Design tokens nằm ở khối :root đầu file
│   └── js/
│       ├── content.js      # TOÀN BỘ NỘI DUNG chữ (EN + VI): ROOMS, EXT, T
│       ├── main.js         # Logic: đổi ngôn ngữ, điều hướng phòng theo #hash, nút copy
│       ├── stage-fx.js     # Hiệu ứng canvas: bụi bay + phản chiếu đèn trên sàn ướt + nền riêng từng phòng
│       └── room-3d.js      # ES module: khối nút xoắn 3D (three.js) ở sảnh và trong phòng
├── CLAUDE.md               # Quy ước ngắn gọn cho Claude Code
└── README.md
```

Thứ tự nạp script ở cuối `index.html` là bắt buộc: `content.js` → `main.js` → `stage-fx.js` (main.js dùng biến toàn cục `ROOMS`, `EXT`, `T` từ content.js), sau đó là importmap và module `room-3d.js`.

---

## 3. Ý tưởng thiết kế

Lấy cảm hứng **cách dàn dựng** của trang adidas CHILE20 (sân khấu tối một màn, cột đèn phát sáng, sàn ướt phản chiếu, chọn một "vật trưng bày" để vào phòng riêng). **Không** dùng logo, chữ, màu hay hình ảnh của adidas — phần nhận diện là của riêng Thuan.

Chủ đề riêng: **tổng đài (switchboard)** — vì Thuan làm nền tảng CPaaS/tổng đài.

| Yếu tố | Ý nghĩa |
|---|---|
| 3 "máy nhánh" EXT 101 / 102 / 103 | 3 mảng năng lực: Migration · Tổng đài (CPaaS) · AI agents (MCP) |
| Đèn LED nhấp nháy + "Line open" | Trạng thái đang nhận việc part-time/freelance |
| "Select an extension to connect" | Lời mời bấm vào máy nhánh (tương đương "select a product") |
| "Connected · EXT 10x" | Trạng thái khi đã vào phòng |
| "Call log" | Section kinh nghiệm |
| Biển tên đóng khung, chữ nghiêng | Logo tên |

Nguyên tắc: **nhà tuyển dụng lướt 30 giây vẫn thấy đủ** — tên, vai trò, liên hệ ở màn đầu; CV đầy đủ nằm ngay bên dưới sân khấu. Phòng chi tiết chỉ là phần đào sâu thêm.

### Design tokens (`assets/css/style.css`, khối `:root`)

Trang có hai theme: **light (mặc định)** trong `:root`, và **dark** trong `html[data-theme="dark"]`. Nút **Dark / Tối** trên thanh trên cùng đổi theme và nhớ lựa chọn trong `localStorage` (`theme`); một đoạn script nhỏ trong `<head>` đặt theme trước khi trang hiện để không bị nháy.

| Token | Light | Dark | Dùng cho |
|---|---|---|---|
| `--void` | `#f3f6f4` | `#040708` | Nền trang |
| `--stage` | `#e8eeeb` | `#071012` | Nền sân khấu |
| `--panel` | `#ffffff` | `#0b1618` | Thẻ, sàn 3D |
| `--line` | `#d2dcd8` | `#1c2b2d` | Viền, đường kẻ |
| `--ink` | `#0e1b18` | `#e9f2ef` | Chữ chính |
| `--mute` | `#5c6b67` | `#84948f` | Chữ phụ, nhãn |
| `--signal` | `#0a8f5c` | `#43f5ac` | **Màu nhấn duy nhất** — xanh tín hiệu |
| `--white-light` | `#1d2b27` | `#f4fbf8` | Ống đèn hai bên (tối trên nền sáng, sáng trên nền tối) |
| `--lamp` | `#f4fbf8` | `#f4fbf8` | Đèn và khối nút xoắn 3D |

Ngoài ra còn các token phụ: `--text-2`, `--text-3`, `--card`, `--glass`, `--shade`, `--scan`, `--stage-glow-*`, `--room-stage-*`, các bộ ba `--*-rgb` để dùng trong `rgba()`, và `--glow` (độ mạnh quầng sáng: 1 ở dark, 0.35 ở light).

Font:
- `--font-display`: **Big Shoulders Display** 900 — tên, tiêu đề (in hoa)
- `--font-body`: **IBM Plex Sans** — chữ đọc
- `--font-mono`: **IBM Plex Mono** — nhãn in hoa nhỏ, số EXT, ngày tháng

Quy tắc: mọi màu phải lấy từ token, kể cả màu vẽ trên canvas (`stage-fx.js`, `room-3d.js` đọc token và đọc lại khi có sự kiện `themechange`). Thêm token mới thì phải khai báo ở **cả hai** theme.

---

## 4. Cách trang hoạt động

### Điều hướng phòng (hash routing)
- `#migration`, `#cpaas`, `#ai` → mở phòng tương ứng (có thể gửi link thẳng tới một phòng).
- Không có hash hoặc `#stage` → về sân khấu.
- Phím `Esc` hoặc nút "Back to stage" để quay lại; nút "Next extension" sang phòng kế.
- Khi ở trong phòng, `<body>` có thuộc tính `data-room="..."`; CSS dựa vào đó để ẩn sân khấu, hiện phòng (xem các rule `body[data-room] ...`).

### Đa ngôn ngữ EN / VI
- Phần tử có `data-i18n="key"` được điền nội dung từ `T[lang][key]` (dùng `innerHTML`, nên được phép có `<b>`).
- Nội dung phòng (`T[lang].rooms`) và call log (`T[lang].log`) được render bằng JS trong `main.js`.
- Ngôn ngữ đã chọn được nhớ trong `localStorage` (bọc try/catch, lỗi thì mặc định EN).

### Nút Chuyển động (Motion)
- Mặc định chuyển động **bật**, kể cả khi hệ điều hành đang bật giảm chuyển động (`prefers-reduced-motion`): đây là lựa chọn của chủ trang.
- Nút "Motion / Chuyển động" trên thanh trên cùng cho khách tự tắt/bật; lựa chọn được nhớ trong `localStorage` (`motion`).
- Trạng thái nằm ở `html[data-motion="on|off"]`; CSS tắt animation theo thuộc tính này, còn `stage-fx.js` và `room-3d.js` nghe sự kiện `motionchange`.

### Hiệu ứng (`stage-fx.js`)
- Canvas phủ toàn sân khấu: hạt bụi bay chậm + vệt phản chiếu dưới mỗi ống đèn.
- Mỗi frame đọc vị trí các ống đèn bằng `getBoundingClientRect()` nên tự khớp khi đổi kích thước hoặc vào phòng.
- Khi tắt chuyển động (nút Motion): dừng animation, chỉ vẽ một frame tĩnh.

### Cảnh 3D (`room-3d.js`)
- Ngoại lệ duy nhất cho quy tắc "không dependency": three.js `0.160.0` nạp từ jsDelivr qua importmap trong `index.html`. Không npm, không build.
- Một canvas cố định theo màn hình (`.stage-3d`, `position: fixed`), nằm trên nền sân khấu và canvas bụi, dưới các máy nhánh và phần chữ (`main` có `z-index: 2`).
- Scroll xuống: khối thuộc về trang, nằm cạnh đoạn đang đọc (bên phải trên màn hình rộng, `SIDE`) và cuộn cùng nội dung; khi sang đoạn khác thì nó trượt chậm xuống (hoặc lên) tới đoạn đó (`SLIDE_EASE`). Ngoài sân khấu khối to hơn một chút (`PAGE_SCALE`) và mờ đi (`PAGE_DIM`) để không che chữ.
- Kiểu lắc theo scroll đọc một bản vị trí scroll đã làm mượt (`SCROLL_EASE`), nên lăn chuột từng nấc không làm khối giật.
- Ở sảnh: khối nút xoắn lắc qua lại phía sau các máy nhánh, kiểu xoay của ví dụ three.js instancing/scatter (`rotation.x = sin(t/4)`, `rotation.y = sin(t/2)`); scroll xuống thì đẩy nhanh chuyển động đó (`SCROLL_SPIN`).
- Mở phòng: khối bay vào cột bên trái, nhỏ lại, 3 tấm đèn RectAreaLight (trắng · màu đường dây · trắng) và sàn bóng hiện lên quanh nó. Trên điện thoại cột trái bị ẩn nên khối ở lại giữa, sau thẻ nội dung.
- Mỗi phòng một kiểu nút xoắn và độ sáng riêng (bảng `WORLDS`).
- Màu lấy từ CSS token (`--signal`, `--white-light`, `--mute`, `--panel`).
- Không có WebGL hoặc không tải được CDN thì giữ nguyên cột đèn CSS.

---

## 5. Các việc chỉnh sửa thường gặp

**Sửa nội dung chữ** → chỉ sửa `assets/js/content.js`. Luôn sửa **cả `en` và `vi`**.

**Thêm một phòng mới (EXT 104):**
1. `content.js`: thêm id vào `ROOMS`, thêm số vào `EXT`, thêm khóa `n_<id>` và object `rooms.<id>` cho cả `en` và `vi`.
2. `index.html`: nhân bản một `<button class="exhibit" data-room="...">` trong `.floor`, đổi SVG glyph và nhãn.
3. `style.css`: `.floor` đang `repeat(3, ...)` → đổi thành 4, kiểm tra lại ở màn hình 400px.

**Đổi màu nhấn** → sửa `--signal` và `--signal-soft` trong `:root`, rồi tìm `67, 245, 172` (giá trị RGB của màu cũ) trong `style.css` và `stage-fx.js` để đổi theo.

**Chứng chỉ / liên hệ** → nằm thẳng trong `index.html` (section Certifications và `#contact`).

---

## 6. Deploy

Trang đang chạy trên **Vercel** (gói Hobby, miễn phí):

- Link chính: **https://www.thuanday.blog** (tên miền mua ở Porkbun). `thuanday.blog` chuyển hướng 308 sang `www`.
- Link mặc định của Vercel: https://me-gamma-sage.vercel.app
- Mỗi lần push lên `main`, Vercel tự deploy lại. Cấu hình project: Application Preset = **Other**, Root Directory = `./`, Build Command để trống.
- DNS ở Porkbun: bản ghi `A` cho tên gốc và `CNAME` cho `www`, giá trị lấy từ Vercel → Project → **Domains** → *View DNS configuration*. Các bản ghi mặc định trỏ tới `pixie.porkbun.com` đã được xoá.
- Link chính cũng nằm trong `index.html` (`<link rel="canonical">` và `og:url`); đổi tên miền thì sửa cả hai chỗ đó.

Nhớ thêm link vào CV, LinkedIn (phần Contact info → Website) và GitHub profile.

---

## 7. Việc còn lại (TODO)

- [x] Deploy lên Vercel, tên miền `www.thuanday.blog`.
- [ ] Gắn link vào CV/LinkedIn/GitHub profile.
- [ ] Ảnh Open Graph (`og:image`) 1200×630 để khi chia sẻ link có ảnh đẹp.
- [ ] Favicon.
- [ ] Bản CV PDF cùng phong cách + nút "Download CV" (đặt file vào `assets/` và link tới).
- [ ] Thêm số liệu cụ thể cho phòng Migration nếu có (ví dụ % giảm tài nguyên server).
- [ ] Repo GitHub mẫu (MCP server bằng NestJS) rồi thêm phòng/khối "Projects" trỏ tới.
- [ ] Cân nhắc ẩn số điện thoại trên bản public (chỉ giữ email).
- [ ] Kiểm tra lại trên Safari iOS và Android (hiệu ứng `backdrop-filter`, canvas).

---

## 8. Tiếp tục bằng Claude Code

```bash
cd ~/FREE/me
claude
```

Gợi ý câu lệnh để bắt đầu:

- `Đọc README.md và CLAUDE.md, rồi chạy trang bằng npx serve và kiểm tra giao diện ở 400px và 1440px.`
- `Thêm favicon SVG và og:image theo đúng design tokens.`
- `Thêm nút Download CV, file đặt ở assets/cv/Nguyen-Van-Thuan-CV.pdf.`
- `Hướng dẫn và thiết lập deploy lên GitHub Pages.`

Claude Code sẽ tự đọc `CLAUDE.md` khi mở trong thư mục này.
