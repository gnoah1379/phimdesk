# PhimDesk

Ứng dụng xem phim trên desktop, dữ liệu lấy từ API công khai của
[phim.nguonc.com](https://phim.nguonc.com/api-document). Viết bằng Electron + React + TypeScript,
trình phát dùng Video.js 8 với engine HLS sẵn có (VHS).

- Duyệt phim theo định dạng, thể loại, quốc gia, năm phát hành
- Tìm kiếm, xem chi tiết, danh sách tập, nhiều server (Vietsub / Thuyết minh)
- Trình phát gốc (HLS) với đầy đủ phím tắt, tua 10s, tốc độ phát, PiP, toàn màn hình
- Tự động chuyển sang trình phát nhúng của nguồn nếu không giải được luồng trực tiếp
- Lưu lịch sử xem, vị trí đang xem của từng tập và danh sách yêu thích ngay trên máy

---

## 1. Yêu cầu môi trường

| Thành phần | Phiên bản | Ghi chú |
| --- | --- | --- |
| Node.js | 20 trở lên | Đang phát triển trên v24 |
| npm | 10 trở lên | Đi kèm Node |
| macOS | 11 trở lên | Chỉ cần khi muốn đóng gói `.dmg` |
| Xcode Command Line Tools | — | Cung cấp `iconutil`, `codesign`. Cài: `xcode-select --install` |

Chỉ cần thêm khi muốn tạo lại logo từ file SVG:

```bash
brew install librsvg   # cung cấp lệnh rsvg-convert
```

Ứng dụng chạy được trên macOS, Windows và Linux, nhưng cấu hình đóng gói trong `package.json`
hiện chỉ khai báo target macOS. Xem mục 6.4 nếu cần build cho hệ khác.

---

## 2. Cài đặt

```bash
git clone <đường-dẫn-repo> phimdesk
cd phimdesk
npm install
```

`npm install` sẽ tự tải Electron 33 (khoảng 100 MB). Nếu mạng chậm hoặc bị chặn, đặt biến môi
trường mirror trước khi cài:

```bash
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
npm install
```

---

## 3. Chạy ở chế độ phát triển

```bash
npm run dev
```

Lệnh này làm ba việc theo thứ tự (xem `scripts/dev.mjs`):

1. Dùng esbuild biên dịch `electron/main.ts` và `electron/preload.ts` sang `dist-electron/*.cjs`
2. Khởi động Vite dev server ở cổng **5173** (cố định, `strictPort: true`)
3. Mở cửa sổ Electron trỏ vào dev server qua biến `VITE_DEV_SERVER_URL`

Giao diện React có hot-reload ngay khi lưu file. **Lưu ý:** sửa file trong thư mục `electron/`
thì phải tắt và chạy lại `npm run dev`, vì tiến trình main không hot-reload.

Đóng cửa sổ Electron sẽ tự tắt luôn Vite dev server.

---

## 4. Danh sách script

| Lệnh | Việc nó làm |
| --- | --- |
| `npm run dev` | Chạy app ở chế độ phát triển (mục 3) |
| `npm run build:electron` | Chỉ biên dịch tiến trình main + preload sang `dist-electron/` |
| `npm run build` | Kiểm tra kiểu (2 project tsconfig) → build main/preload → build giao diện vào `dist/` |
| `npm run dist` | Chạy `npm run build` rồi gọi electron-builder để tạo `.dmg` trong `release/` |
| `npm run preview` | Xem thử bản build giao diện bằng trình duyệt (không có IPC nên không phát được phim) |

---

## 5. Build bản production

```bash
npm run build
```

Kết quả:

| Thư mục | Nội dung |
| --- | --- |
| `dist/` | Giao diện đã build (`index.html` + assets). Nạp qua `file://` nên `vite.config.ts` đặt `base: "./"` |
| `dist-electron/` | `main.cjs`, `preload.cjs` và source map |

Bước kiểm tra kiểu chạy hai project riêng: `tsconfig.json` cho mã React trong `src/`,
`tsconfig.node.json` cho `electron/` và `vite.config.ts`. Build sẽ dừng nếu có lỗi kiểu.

Muốn thử bản production trước khi đóng gói:

```bash
npm run build
npx electron .
```

---

## 6. Đóng gói cho macOS

### 6.1. Đóng gói

```bash
npm run dist
```

Kết quả trong `release/`:

- `PhimDesk-0.1.0-arm64.dmg` — bản cài đặt (~104 MB), đây là file để gửi cho người dùng
- `mac-arm64/PhimDesk.app` — bản app chưa nén
- `PhimDesk-0.1.0-arm64.dmg.blockmap` — dùng cho cập nhật delta, không cần phân phối

Trong quá trình build, electron-builder sẽ in cảnh báo:

```
skipped macOS application code signing
reason=cannot find valid "Developer ID Application" identity
0 valid identities found
```

Đây là điều đã biết trước — dự án **không có chứng chỉ Apple Developer ID**, nên app không được
ký số và không qua notarization. Không cần xử lý gì ở khâu build; người cài chỉ cần làm một
thao tác duy nhất ở mục 6.2.

### 6.2. Cài đặt trên máy khác (app chưa ký số)

Khi tải `.dmg` qua trình duyệt, AirDrop hoặc chat, macOS gắn thuộc tính `com.apple.quarantine`
vào file. Vì app chưa được ký số nên Gatekeeper sẽ chặn ở lần mở đầu tiên.

**Cách xử lý — gỡ cờ quarantine:**

```bash
xattr -dr com.apple.quarantine /Applications/PhimDesk.app
```

Trình tự đầy đủ cho người cài:

1. Mở file `.dmg`, kéo `PhimDesk` vào thư mục `Applications`
2. Mở Terminal, dán lệnh trên và nhấn Enter (lệnh không in ra gì nếu thành công)
3. Mở PhimDesk bình thường bằng double-click

Chỉ cần chạy một lần cho mỗi lần cài đặt. Muốn kiểm tra file còn cờ quarantine hay không:

```bash
xattr -l /Applications/PhimDesk.app
```

Không thấy dòng `com.apple.quarantine` nghĩa là đã sạch.

Hai cách thay thế nếu người dùng không muốn động vào Terminal:

- **Chuột phải → Open**: chuột phải (hoặc Control + click) vào `PhimDesk` trong `Applications`,
  chọn **Open**, rồi bấm **Open** lần nữa ở hộp thoại cảnh báo
- **System Settings**: double-click để macOS chặn trước, sau đó vào
  **System Settings → Privacy & Security**, kéo xuống mục Security và bấm **Open Anyway**

Trên chính máy đã build thì không gặp vấn đề gì, vì file tạo tại chỗ không bị gắn quarantine.

### 6.3. Khi đã có tài khoản Apple Developer

Nếu sau này có chứng chỉ **Developer ID Application** (cần tài khoản Apple Developer Program,
99 USD/năm), người cài sẽ không phải chạy lệnh `xattr` ở mục 6.2 nữa.

Thêm vào phần `build.mac` trong `package.json`:

```json
"mac": {
  "icon": "build/icon.icns",
  "category": "public.app-category.entertainment",
  "darkModeSupport": true,
  "hardenedRuntime": true,
  "gatekeeperAssess": false,
  "entitlements": "build/entitlements.mac.plist",
  "entitlementsInherit": "build/entitlements.mac.plist",
  "notarize": true,
  "target": [{ "target": "dmg", "arch": ["arm64"] }]
}
```

Tạo `build/entitlements.mac.plist` (Electron cần các quyền JIT này):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.allow-dyld-environment-variables</key>
  <true/>
</dict>
</plist>
```

Rồi đặt biến môi trường và build:

```bash
export CSC_LINK=/đường/dẫn/DeveloperID.p12     # hoặc để chứng chỉ sẵn trong Keychain
export CSC_KEY_PASSWORD='mật-khẩu-p12'
export APPLE_ID='email@apple-developer'
export APPLE_APP_SPECIFIC_PASSWORD='xxxx-xxxx-xxxx-xxxx'   # tạo tại appleid.apple.com
export APPLE_TEAM_ID='XXXXXXXXXX'

npm run dist
```

Sau khi notarize thành công, người dùng chỉ cần kéo thả và mở, không cần thao tác nào thêm.

### 6.4. Build cho Intel, Universal hoặc hệ điều hành khác

Sửa mảng `arch` trong `build.mac.target` của `package.json`:

```json
"target": [{ "target": "dmg", "arch": ["arm64", "x64"] }]
```

Giá trị dùng được: `arm64` (Apple Silicon), `x64` (Intel), `universal` (gộp cả hai, file nặng
gần gấp đôi). Hoặc chỉ định trực tiếp khi chạy:

```bash
npx electron-builder --mac dmg --x64
npx electron-builder --mac dmg --universal
```

Cho Windows và Linux (phải chạy trên đúng hệ điều hành đó, hoặc dùng CI):

```bash
npm run build && npx electron-builder --win nsis
npm run build && npx electron-builder --linux AppImage deb
```

---

## 7. Cấu trúc dự án

```
phimdesk/
├── electron/                 # Tiến trình main (Node)
│   ├── main.ts               # Tạo BrowserWindow, đăng ký IPC "resolve-stream"
│   ├── preload.ts            # contextBridge → window.phimdesk
│   └── stream.ts             # Giải luồng HLS + chèn header cho request tới CDN
├── scripts/
│   ├── build-electron.mjs    # esbuild: electron/*.ts → dist-electron/*.cjs
│   └── dev.mjs               # Vite dev server + spawn Electron
├── src/                      # Tiến trình renderer (React)
│   ├── components/           # Player, Sidebar, TopBar, MovieCard/Grid, InfiniteSentinel
│   ├── lib/                  # api.ts, catalog.ts, storage.ts, types.ts,
│   │                         # useAsync.ts, useInfiniteList.ts
│   ├── pages/                # Home, Browse, Search, Detail, Watch, Library
│   ├── App.tsx               # HashRouter (bắt buộc vì bản đóng gói chạy trên file://)
│   └── index.css             # Tailwind v4 + theme Video.js
├── build/                    # Tài nguyên đóng gói
│   ├── icon.svg              # Nguồn vector của logo
│   ├── icon.icns             # Icon macOS, sinh từ icon.svg
│   └── icon.png              # Icon 1024px, dùng cho Windows/Linux
├── vite.config.ts
├── tsconfig.json             # Cho src/
└── tsconfig.node.json        # Cho electron/ và vite.config.ts
```

---

## 8. Kiến trúc hoạt động

**Renderer** gọi API danh mục trực tiếp từ `https://phim.nguonc.com/api` (`src/lib/api.ts`, có
cache 5 phút trong bộ nhớ và tự thử lại 3 lần).

**Danh sách phim** dùng cuộn vô hạn. Nguồn khoá cứng 10 phim mỗi trang và không nhận tham số
`limit`/`per_page`, nên `src/lib/useInfiniteList.ts` phải gộp nhiều trang cho mỗi lượt tải: lô đầu
6 trang (60 phim), mỗi lần cuộn tới đáy thêm 4 trang (40 phim). Trang đầu được gọi riêng để biết
`total_page` trước, sau đó phần còn lại của lô mới tải song song — tránh bắn request vào những
trang không tồn tại. Phim trùng giữa các trang được lọc theo `slug`, vì nguồn cập nhật liên tục
nên các trang liền nhau có thể đẩy trùng nhau. `InfiniteSentinel` đặt `IntersectionObserver` với
`root` là thẻ `<main>` (vùng cuộn thật) và `rootMargin: 800px` để tải trước khi người dùng chạm đáy.

**Phát phim** thì phức tạp hơn, vì nguồn không trả link `.m3u8` công khai:

1. Renderer gọi `window.phimdesk.resolveStream(embedUrl)` (preload → IPC `resolve-stream`)
2. `electron/stream.ts` tải trang embed bằng User-Agent của Safari trên macOS. Nhánh Apple của
   nguồn trả về playlist HLS thường, không bị mã hoá như nhánh web
3. Tìm link playlist trong thuộc tính `data-obf` (chuỗi base64 chứa JSON), có phương án dự phòng
   là quét regex `.m3u8` trong HTML
4. Đọc playlist, ghi nhớ hostname của playlist và của toàn bộ segment vào một bảng
5. `session.webRequest.onBeforeSendHeaders` chèn `User-Agent` Safari và `Referer` đúng cho mọi
   request tới các hostname đó; `onHeadersReceived` ghi đè `Access-Control-Allow-Origin: *`
6. Renderer nhận URL playlist và đưa thẳng cho Video.js

Nhờ vậy không cần proxy nội bộ: Chromium tự tải playlist và segment, chỉ khác là header được
tiến trình main sửa lại trước khi gửi đi.

Nếu bất kỳ bước nào lỗi, `Player.tsx` tự chuyển sang `<iframe>` trình phát của nguồn và hiện nút
"Thử phát trực tiếp lại".

---

## 9. Phím tắt trong trình phát

Phím tắt được bắt ở cấp `document` (capture phase) nên dùng được ngay, không cần bấm vào player
trước. Chỉ khi con trỏ đang ở ô nhập liệu thì phím mới trả về cho ô đó.

| Phím | Chức năng |
| --- | --- |
| `Space` / `K` | Phát – tạm dừng |
| `←` / `→` hoặc `J` / `L` | Tua lùi / tới 10 giây |
| `↑` / `↓` | Tăng / giảm âm lượng 10% |
| `0`–`9` | Nhảy tới 0% – 90% thời lượng |
| `M` | Tắt / bật tiếng |
| `F` | Toàn màn hình (`Esc` để thoát) |
| `I` | Thu nhỏ cửa sổ nổi (Picture-in-Picture) |
| `<` / `>` | Giảm / tăng tốc độ phát |

---

## 10. Dữ liệu lưu trên máy

Lưu trong `localStorage` của ứng dụng, không gửi đi đâu:

| Khoá | Nội dung |
| --- | --- |
| `phimdesk:history` | Lịch sử xem, tối đa 120 mục, kèm vị trí đang xem của từng tập |
| `phimdesk:favorites` | Danh sách phim yêu thích |
| `phimdesk:volume` | Mức âm lượng gần nhất |
| `phimdesk:rate` | Tốc độ phát gần nhất |

Muốn xoá sạch: dùng nút "Xoá tất cả" trong mục Đang xem, hoặc xoá thư mục
`~/Library/Application Support/phimdesk`.

---

## 11. Tạo lại logo

`build/icon.svg` là nguồn duy nhất. Sau khi sửa file SVG, chạy lại pipeline sau để sinh
`icon.icns` và `icon.png`:

```bash
cd phimdesk
OUT=build/PhimDesk.iconset
rm -rf "$OUT" && mkdir -p "$OUT"

render() { rsvg-convert -w "$1" -h "$1" build/icon.svg -o "$OUT/$2.png"; }
render 16   icon_16x16
render 32   icon_16x16@2x
render 32   icon_32x32
render 64   icon_32x32@2x
render 128  icon_128x128
render 256  icon_128x128@2x
render 256  icon_256x256
render 512  icon_256x256@2x
render 512  icon_512x512
render 1024 icon_512x512@2x

iconutil -c icns "$OUT" -o build/icon.icns
rsvg-convert -w 1024 -h 1024 build/icon.svg -o build/icon.png
rm -rf "$OUT"
```

Đủ 10 kích thước như trên thì `iconutil` mới chấp nhận. Sau đó chạy lại `npm run dist`.

---

## 12. Xử lý sự cố

**`npm run dev` báo cổng 5173 đang bận**

`strictPort: true` nên Vite không tự đổi cổng. Tìm và tắt tiến trình đang giữ cổng:

```bash
lsof -nP -iTCP:5173 -sTCP:LISTEN
kill <PID>
```

**Build dừng vì lỗi TypeScript**

`npm run build` chạy `tsc` trước. Xem lỗi thuộc project nào rồi chạy riêng để dò:

```bash
npx tsc -p tsconfig.json --noEmit        # mã React trong src/
npx tsc -p tsconfig.node.json --noEmit   # electron/ và vite.config.ts
```

**Mở bản đóng gói thấy màn hình trắng**

Thường là do `dist/` chưa được build hoặc đường dẫn asset sai. Chạy lại `npm run build` và kiểm
tra `vite.config.ts` vẫn giữ `base: "./"`. Mở DevTools bằng `View → Toggle Developer Tools` để
xem lỗi cụ thể.

**Phim không phát, hiện thông báo màu vàng**

App đã tự chuyển sang trình phát nhúng của nguồn. Nguyên nhân thường gặp: nguồn đổi cách giấu
link, server tập đó chết, hoặc mất mạng. Bấm "Thử phát trực tiếp lại", đổi sang server khác
(Vietsub / Thuyết minh), hoặc xem log trong DevTools.

**electron-builder báo `0 valid identities found`**

Bình thường, dự án không có chứng chỉ Developer ID. Xem mục 6.1 và 6.2.

**macOS báo `"PhimDesk" is damaged and can't be opened`**

Thường chỉ là do cờ quarantine, chạy lệnh ở mục 6.2 là xong. Nếu đã gỡ quarantine mà vẫn báo
hỏng, ký ad-hoc ngay trên máy đang dùng rồi mở lại:

```bash
codesign --force --deep --sign - /Applications/PhimDesk.app
xattr -dr com.apple.quarantine /Applications/PhimDesk.app
```

**Sửa file trong `electron/` mà không thấy thay đổi**

Tiến trình main không hot-reload. Tắt `npm run dev` rồi chạy lại.

---

## 13. Ghi chú

Ứng dụng chỉ đóng vai trò client đọc API công khai của phim.nguonc.com; toàn bộ nội dung và luồng
phát thuộc về nguồn. Dự án phục vụ mục đích học tập và sử dụng cá nhân.
