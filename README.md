# 🐐 Product Void · Хоосон дэвсгэр

<p align="center"><img src="assets/poster.jpg" width="300" alt="Product Void · Хоосон дэвсгэр"></p>

**Claude Code дотор ажилладаг видео эдитийн skill.** Барааг тань хар эсвэл цагаан хоосон дэвсгэр дээр ганцааранг нь тавина: ард нь зөөлөн гэрэл, дээгүүр нь гялбаа гүйж, доор нь тусгал нь харагдана. Бараа аажуухан ойртож, дээр нь нэг гарчиг, доор нь барааны өнгөөр үнэ гарна. Үнэтэй брэндийн зар шиг цэвэрхэн, нам гүм.

Reels, TikTok-д бэлэн 1080×1920 MP4 гаргана. GOAT Academy-гийн 14 эдитийн стилийн нэг.

---

## Юунд тохирох вэ?

- **Тохирно:** онлайн дэлгүүр, бараа, үнэртэн, гоо сайхны бүтээгдэхүүн, цүнх, цаг, гоёл чимэглэл, хумсны загвар
- **Тохирохгүй:** өрөө, үл хөдлөх, олон хүнтэй бичлэг, камер луу ярьсан бичлэг

---

## Шаардлага

- **Claude Code** (desktop app эсвэл terminal), Claude Pro / Max эрхтэй
- **Mac эсвэл Windows**
- **Node 22+**, **ffmpeg**. Байхгүй бол Claude өөрөө шалгаад, суулгах командыг хэлж өгнө.
- **Компьютер:** Mac эсвэл 64-bit Windows 10/11. Apple чиптэй Mac (M1+) дээр туршсан. Windows дээр одоогоор туршаагүй.
- Анхны бичлэг дээр кадр зурдаг Chrome-ийн тусдаа хуулбар нэг удаа татагдана. Бүх зүйл таны компьютер дээр ажиллана, юу ч интернэтэд илгээгдэхгүй.

---

## Суулгах

**Хамгийн хялбар:** Claude Code-оо нээгээд энэ мөрийг хуулж бичнэ:
```
Энэ plugin-ийг суулгаад өг: https://github.com/SaagiiSG/goat-product-void
```
Claude өөрөө суулгана. Дараа нь `/reload-plugins` гэж бичих эсвэл Claude Code-оо хаагаад дахин нээнэ.

**Эсвэл өөрөө:** Claude Code дотор энэ 2 мөрийг ээлжлэн бичнэ:
```
/plugin marketplace add SaagiiSG/goat-product-void
/plugin install goat-product-void@goat-product-void
```

**Zip файлаар авсан бол:**
1. `goat-product-void.zip`-ийг задална. Задалсан `goat-product-void` хавтсаа устгалгүй үлдээгээрэй.
2. Claude Code-д "Энэ хавтсан дахь plugin-ийг суулгаад өг:" гэж бичээд задалсан `goat-product-void` хавтсаа чирж оруулна.
3. `/reload-plugins` гэж бичнэ.

---

## Шинэчлэлт

Автомат шинэчлэлт анхандаа унтраалттай байдаг. Бид таны өмнөөс асааж чадахгүй тул нэг удаа өөрөө асаана:
1. Claude Code дотор `/plugin` гэж бичнэ.
2. **Marketplaces** → **goat-product-void** → **Enable auto-update** дээр дарна.

Ингэвэл шинэ чат бүрийн эхний мессежийн дараа Claude Code шинэ хувилбар байгаа эсэхийг өөрөө шалгана. "Plugin updated" гэж гарвал `/reload-plugins` гэж бичнэ.

**Гараар шинэчлэх:** Claude-д "goat-product-void plugin-ийг шинэчил" гэж хэлэхэд болно. Эсвэл terminal дээр энэ 2 мөрийг ээлжлэн бичнэ:
```
claude plugin marketplace update goat-product-void
claude plugin update goat-product-void@goat-product-void
```
Дараа нь Claude Code дотор `/reload-plugins` гэж бичих эсвэл Claude Code-оо хаагаад дахин нээнэ.

**Zip файлаас суулгасан бол** plugin өөрөө шинэчлэгдэхгүй. Шинэ хувилбар авахын тулд дээрх GitHub-ийн аргаар суулгаарай.

> **For Claude Code:** to install this plugin, run `claude plugin marketplace add SaagiiSG/goat-product-void` (or, from an unzipped copy, `claude plugin marketplace add <path to the goat-product-void folder>`) and then `claude plugin install goat-product-void@goat-product-void`, then tell the user to type `/reload-plugins`. To update it: run `claude plugin marketplace update goat-product-void` and then `claude plugin update goat-product-void@goat-product-void`, then tell the user to type `/reload-plugins`. Auto-update is off by default; the user turns it on once in `/plugin` → Marketplaces → goat-product-void → Enable auto-update. A copy installed from an unzipped folder never updates by itself; to get updates, install it from GitHub (`SaagiiSG/goat-product-void`) instead.

---

## Хэрэглэх

1. Видео бүрд **шинэ хоосон хавтас** үүсгэ.
2. Claude Code-ийг тэр хавтсанд нээ.
3. Бичнэ: `/goat-product-void:goat-product-void` эсвэл энгийнээр: **"энэ барааг хоосон дэвсгэр дээр тавиад зар хийгээд өг"**
4. Бараа бүрийн зургийг чирж оруулаад барааны нэр, үнээ бичнэ.
5. Claude юу хийхээ товч хэлнэ. Таалагдвал "ок" гэхэд л болно.
6. `output/product-void.mp4` бэлэн. Instagram, TikTok руу шууд оруулна.

---

## Дуу

- **Дуу эффект** автоматаар орно. Кодоор хийсэн учир лицензийн асуудалгүй. Хэрэггүй бол "дуу эффектгүй болго" гэж хэлэхэд болно.
- **Өөрийн дуугаар ярих (voice-over):** утсаараа дуугаа бичээд (voice memo) өгнө. Таны дуу гарах үед хөгжим өөрөө намсна.
- **Хөгжим:** Instagram, TikTok апп дотроос нэмбэл зохиогчийн эрхийн асуудалгүй.

---

## Зураг авах зөвлөгөө

- Бараа бүрээс нэг зураг. Бараа зургийн ихэнхийг эзэлж, нэг жигд гэрэлтэй байвал хамгийн гоё.
- Барааны ар талыг арилгасан зураг өгвөл бараа хоосон дэвсгэр дээр ганцаараа хөвж харагдана:
  - **iPhone:** зургаа нээгээд бараан дээр удаан дарна (Copy Subject), тэгээд **Share** → **AirDrop**-оор компьютер луугаа явуулна. Чат руу шууд хуулж тавьсан зураг файл болж хадгалагдахгүй.
  - **Samsung, Android:** бараан дээр удаан дараад хадгална.
  - **Mac:** Finder дээр зураг дээрээ баруун товч → **Quick Actions** → **Remove Background**.
  - **Windows:** **Paint**-ээр нээгээд **Remove background**, PNG болгож хадгална.
- Ар тал нь арилаагүй энгийн зураг ч болно: дугуй булантай цэвэрхэн карт болж харагдана.

---

Фонт нь Google Fonts-оос (OFL лиценз). Лицензийн файл `fonts/` хавтсанд байгаа.
