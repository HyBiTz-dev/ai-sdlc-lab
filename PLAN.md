# Farmart — Implementation Plan

แผนพัฒนาเว็บร้านขายของชำออนไลน์ "Farmart" แบ่งเป็นเฟสตาม Requirement 1–6
อ้างอิงดีไซน์: `DESIGN.md` (Farmart-design-analysis) · ข้อมูลสินค้า: `src/data/store.ts`

---

## สถานะปัจจุบัน (Baseline)

ตรวจสอบโค้ดแล้ว หน้าแรก **render ครบตามดีไซน์แล้ว** แต่เป็น UI แบบ static ทั้งหมด

| ส่วน | สถานะ | ไฟล์ |
|---|---|---|
| Header + NavBar + search bar | มี markup ครบ แต่ input/select ไม่มี state | `src/components/header.tsx` |
| Hero (gradient banners) | เสร็จ | `src/components/hero.tsx` |
| Browse by Category | เสร็จ (carousel) | `src/components/sections.tsx` |
| Featured Brands | เสร็จ | `src/components/sections.tsx` |
| Top Saver Today + 15% OFF panel | เสร็จ (countdown เป็น text คงที่) | `src/components/sections.tsx` |
| Best Seller + filter tabs | เสร็จ (filter tab ไม่ทำอะไร) | `src/components/sections.tsx` |
| ProductCard (ราคา/ส่วนลด/rating/Add To Cart) | เสร็จ (ปุ่มไม่มี onClick) | `src/components/product-card.tsx` |
| Carousel | เสร็จ | `src/components/carousel.tsx` |
| Dialog (native `<dialog>`) | เสร็จ ใช้แล้วที่ `/design` | `src/components/dialog.tsx` |
| **Cart state / store** | **ยังไม่มี** | — |
| **Search / filter logic** | **ยังไม่มี** | — |
| **Product detail page** | เสร็จ `/product/[id]` | `src/app/product/[id]/page.tsx` |
| **Footer** | **ยังไม่มี** | — |

**สรุป:** งานที่เหลือคือเปลี่ยนจาก "แสดงผล" → "ใช้งานได้จริง" (interactive layer) บนโครงหน้าที่มีอยู่แล้ว

---

## Phase 0 — Foundation (ต้องทำก่อนทุกเฟส)

- [ ] **0.1** สร้าง `src/lib/cart-store.tsx` — Cart Context + `useReducer`
  - `CartLine = { id, name, image, price: number, oldPrice?, qty }`
  - actions: `ADD_ITEM`, `SET_QTY`, `REMOVE_ITEM`, `CLEAR_CART`
  - API: `{ lines, itemCount, subtotal, discountTotal, shipping, grandTotal, add, setQty, remove, clear }`
  - persist ลง `localStorage` (key `farmart.cart`) + hydrate ใน `useEffect` เพื่อกัน hydration mismatch
- [ ] **0.2** แปลง `price` ใน `src/data/store.ts` จาก `string` (`"$38.00"`) เป็น `number` (`38`) เพื่อคำนวณยอดได้
  - แสดงผลด้วย `formatPrice()` ใน `src/lib/format.ts` (Intl, คงที่ 2 ตำแหน่ง)
  - เพิ่ม `category` และ `originalPrice` ให้สินค้าเพื่อรองรับการ filter
- [ ] **0.3** เพิ่ม `products` array รวม (bestSellers + topSavers + สินค้าเพิ่มอีก ~16 ชิ้น ให้ครบ 5 หมวด: ผัก/ผลไม้, เนื้อ, นม/ไขม, เครื่องดื่ม, ขนม) — ใช้เป็นแหล่งข้อมูลเดียวของ search/listing
- [ ] **0.4** ติด `CartProvider` ใน `src/app/layout.tsx` (client wrapper)
- [ ] **0.5** ยืนยัน `next.config.ts` มี `images.remotePatterns` ครอบคลุม host ที่ใช้ (`images.unsplash.com`)
- [ ] **0.6** รัน `npm run lint` + `npm run build` เป็น baseline ที่ผ่าน

---

## Phase 1 — Search & Browse (Requirement 1)

เป้าหมาย: ลูกค้าค้นหา + เลือกซื้อเองผ่านเว็บ ไม่ต้องไปหน้าร้าน

- [ ] **1.1** ทำ `Header` + `NavBar` เป็น client component (`"use client"`)
- [ ] **1.2** ผูก search bar: `input-search` ตาม token + `<select>` หมวดสินค้า (เตรียมจาก `categories`)
  - `select` ตั้งค่าเริ่มต้น "All Categories"
  - กด Enter หรือกดปุ่ม magnifier → push ไป `/search?q=...&category=...`
- [ ] **1.3** ทำ `/search` page
  - Server component อ่าน `searchParams`, filter `products` จาก `src/data/store.ts`
  - ค้นจาก `name` + `brand` (case-insensitive, trim)
  - filter ตาม `category` ถ้ามี
- [ ] **1.4** หน้าผลลัพธ์: แสดงจำนวนที่เจอ + grid ของ `ProductCard`
  - grid: 6 → 3 → 2 คอลัมน์ (ตาม `DESIGN.md` Best-seller stair)
  - เรียงตามราคา / คะแนนรีวิว / ส่วนลด (select ซ้ายบน)
- [ ] **1.5** Empty state — ไม่พบสินค้า: ข้อความ + ปุ่ม "Clear Search" + ลิงก์กลับหน้าแรก
- [ ] **1.6** ทำให้ทุกจุดที่ควรนำทางใช้งานได้จริง
  - Category tile ใน `BrowseByCategory` → `/search?category=<name>`
  - Brand card ใน `FeaturedBrands` → `/search?q=<brand>`
  - `SHOP BY CATEGORY` tab + nav links → route ที่มีอยู่
  - Section header link (`All Categories ›`, `All Offers`) → route ที่มีอยู่
- [ ] **1.7** Product card ทั้งหมดคลิกไปหน้า detail (ลิงก์ทั้งใบ)

> หมายเหตุ: ปุ่ม Add To Cart ต้องกันไม่ให้คลิกทะลุลิงก์ของการ์ด (`.stopPropagation()`)

---

## Phase 2 — Homepage ดึงดูด (Requirement 2)

เป้าหมาย: หน้าแรกโชว์โปรโมชัน/ของลดราคา + หมวดสินค้า ให้เลือกซื้อง่าย

- [ ] **2.1** Hero ให้ CTAs ทำงาน: `Shop Now` → `/search`, `20% SALE OFF` → `/search?discount=20`
- [ ] **2.2** Hero carousel ให้เลื่อนได้จริง (`trackId` + `CarouselControls` ที่มีอยู่แล้ว)
- [ ] **2.3** ทำ countdown จริงใน `Top Saver Today`
  - client component + `setInterval` 1 วินาที, นับถอยหลังถึงสิ้นสุดวัน
  - format `HH : MM : SS` ตาม `badge-countdown`
  - หมดเวลา → ซ่อน badge / แสดงสถานะ expired
- [ ] **2.4** Filter tabs ใน `Best Seller` ทำงานจริง (คลิกแล้วเปลี่ยนรายการสินค้า + active state ขีด `border-primary`)
- [ ] **2.5** เพิ่ม section "Fresh Arrivals" / โปรโมชันเพิ่มเติมให้หน้าแรกหนาแน่นขึ้น
  - เลือกจาก design system ที่มี: `card-brand` หรือ carousel สินค้า
  - **ตัดสินใจ band colour ก่อน** เพื่อให้ surface/band สลับกันถูกจังหวะกับ section ข้างเคียง
- [ ] **2.6** Footer (ยังไม่มี) — ข้อมูลติดต่อ / ลิงก์หมวด / ช่องทางชำระเงิน / copyright
  - ทำ `src/components/footer.tsx`
- [ ] **2.7** Sticky header — header หนึบด้านบนเมื่อ scroll (มีอยู่ใน spirit ของ e-commerce)

---

## Phase 3 — ราคา ส่วนลด รีวิว + หยิบใส่ตะกร้า (Requirement 3)

เป้าหมาย: เห็นราคา/ส่วนลด/rating ก่อนตัดสินใจ แล้วหยิบใส่ตะกร้าได้ทันที

- [ ] **3.1** `ProductCard` เป็น client component + ผูก `add()` จาก cart store กับปุ่ม `button-primary`
- [ ] **3.2** Feedback หลังหยิบใส่ตะกร้า — เลือก 1 อย่าง
  - toast เล็ก ๆ มุมขวาบน (ไม่มี token เดิม → ใช้ `card-brand` + amber)
  - หรือ: badge นับของตะกร้าใน header กะพริบ + label ปุ่มเปลี่ยนเป็น "Added ✓"
- [ ] **3.3** ยืนยันข้อมูลบนการ์ดครบ 4 อย่าง (ตรวจกับ `DESIGN.md`)
  - [ ] ราคาปัจจุบัน `{colors.alert}` 14px/700
  - [ ] ราคาเดิม ขีดฆ่า `{colors.ink-ghost}`
  - [ ] badge ส่วนลด `-20%` มุมซ้ายบน
  - [ ] ดาวเรท + จำนวนรีวิว `(12)` (เติมที่ `bestSellers` ยังไม่มี rating)
- [x] **3.4** ทำหน้า detail `/product/[id]` — `src/app/product/[id]/page.tsx`
  - [x] รูปใหญ่ (`gallery-frame` object-contain) + `thumb-gallery`, brand eyebrow, ชื่อสินค้า
  - [x] ราคา + ราคาเดิม + badge ส่วนลด (`PriceRow` / `DiscountBadge`)
  - [x] rating + จำนวนรีวิว (`RatingStars`)
  - [x] **quantity stepper** (`stepper-quantity`, clamp ที่ stock)
  - [x] ปุ่ม `Add To Cart` เติมจำนวนตาม stepper (`BuyPanel`) — ยังไม่ผูก cart store รอ Phase 0.1
  - [x] stock progress bar + "Sold: 28/40" (`StockTrack`)
  - [x] description + specs + ข้อมูลส่งต่อ (`tab-detail`)
  - [x] แถว "You May Also Like" reuse `Carousel` + `ProductCard`
- [x] **3.5** Breadcrumb บนหน้า detail — `src/components/breadcrumb.tsx` (หน้า search ยังไม่มี)
- [x] **3.6** หน้า detail ที่ slug ไม่ถูกต้อง → `notFound()` + `src/app/not-found.tsx` ที่มีปุ่มกลับหน้าแรก

---

## Phase 4 — โซนกระตุ้นยอดขาย (Requirement 4)

เป้าหมาย: Best Seller / Top Saver + สมัครสมาชิกรับส่วนลด 15%

- [ ] **4.1** ทำ `Top Saver` + `Best Seller` เป็นข้อมูลจริงจาก `products` (filter `sold/total` สูงสุด / `discount` สูงสุด) แทน array hardcode
- [ ] **4.2** ทำ panel สมัครสมาชิก 15% OFF ให้ validate จริง
  - `input-form` ตาม token (email + password พร้อม icon นำหน้า)
  - validate: รูปแบบ email + ความยาว password ≥ 8
  - error แสดงเป็นข้อความ 12px `{colors.alert}` ใต้ field
  - ใช้ `Dialog` (`size="sm"`) ยืนยันเมื่อสำเร็จ + ปุ่ม `DialogPrimaryButton`
- [ ] **4.3** Member discount engine (`src/lib/pricing.ts`)
  - member ใหม่ได้ 15% (ใช้กับ subtotal)
  - ทดสอบด้วย function ล้วน ๆ ไม่ผูกกับ UI
- [ ] **4.4** Member state (`src/lib/member-store.tsx`) — `isMember`, `join()`
- [ ] **4.5** หัวเว็บแสดงสถานะสมาชิก
  - ไอคอน user เป็นลิงก์ พร้อม badge / ข้อความ "Member · 15% OFF"
  - กดแล้วเปิด `Dialog` สมัครสมาชิก
- [ ] **4.6** Cart dialog แสดงบรรทัดส่วนลดสมาชิกแยกชัดเจน (discount ไม่ถูกกลืนกับยอดรวม)
- [ ] **4.7** "Top Saver Today" — นับถอยหลังเป็น urgency: badge `{colors.alert}`, ห้ามใช้สี amber

---

## Phase 5 — จัดการตะกร้า (Requirement 5)

เป้าหมาย: เพิ่ม / ลบ / ดูยอดรวม ก่อนสั่งซื้อ

- [ ] **5.1** ผูก cart เข้ากับ header — `CountBadge` (จำนวน) + ยอดรวม
  - ลบค่า hardcode (ปัจจุบันคือ `5` และ `$1,240.50`)
  - ซ่อน badge เมื่อ 0 ชิ้น
  - ทำเป็นปุ่มจริงที่เปิดตะกร้า
- [ ] **5.2** ทำ Cart dialog เปิดจาก header — ใช้ `Dialog` เดิม
  - แถวสินค้า: รูปเล็ก + ชื่อ (clamp 2 บรรทัด) + ราคา
  - **Quantity stepper** ต่อแถว (ตาม `dialog-body` ใน `DESIGN.md`)
  - ลบแถว + ล้างตะกร้าทั้งหมด
  - รวมราคาต่อแถวและอัปเดตสดทุกการเปลี่ยน
- [ ] **5.3** สรุปยอดใน Cart dialog
  - Subtotal
  - Member discount −15% (เฉพาะสมาชิก)
  - ค่าจัดส่ง (แสดงตาม threshold ของร้าน)
  - **Grand total** (`heading-md`)
  - `DialogPrimaryButton` ปุ่มเดียว — "Proceed to Checkout"
- [ ] **5.4** ตะกร้าว่าง — empty state พร้อมปุ่ม "Continue Shopping"
- [ ] **5.5** Confirm dialog ตอนลบสินค้า (ปุ่มหลัก = ลบ; ปุ่มรอง = ยกเลิก)
- [ ] **5.6** `/cart` — หน้าตะกร้าเต็มรูปแบบ (fallback เมื่อ deep link / refresh)
  - ตารางสินค้า + stepper + ลบ
  - สรุปยอดชิดขวา sticky
  - `Dialog` ยังทำงานได้จาก header เหมือนเดิม
- [ ] **5.7** `/checkout` — หน้าสั่งซื้อ
  - ขั้นตอน: ข้อมูลจัดส่ง → วิธีชำระเงิน → ยืนยัน
  - `input-form` ทุกช่อง
  - validate ทุก step, ปุ่ม Back / Continue
  - Step ยืนยัน: แสดงรายการ + ยอดรวม + ที่อยู่
- [ ] **5.8** Order success หลังสั่งซื้อ — เลขออเดอร์ + `clear()` ตะกร้า + ปุ่ม "กลับหน้าแรก"
- [ ] **5.9** Persistence — refresh แล้วตะกร้าไม่หาย (โยงกับ 0.1)

> **ขอบเขต Phase 5:** checkout เป็น frontend-only ยังไม่ต่อ payment gateway / backend จริง

---

## Phase 6 — เป้าหมายธุรกิจ + คุณภาพ (Requirement 6)

เป้าหมาย: เพิ่มยอดขาย + ให้ลูกค้ากลับมาซื้อซ้ำ + ลดภาระหน้าร้าน

- [ ] **6.1** Trust signals — "ส่งฟรีเมื่อซื้อครบ X", รับประกันสินค้า, คืนสินค้าภายใน 7 วัน (footer + cart)
- [ ] **6.2** Reorder — เก็บ `recentlyViewed` ลง `localStorage` แล้วแสดงในแถบ nav ที่มีอยู่แล้ว ("Recently Viewed")
- [ ] **6.3** Reorder list — ปุ่ม "ซื้อซ้ำ" จากประวัติคำสั่งซื้อ (เก็บ order history ใน localStorage)
- [ ] **6.4** Free-shipping progress bar ในตะกร้า — เป็น urgency ใช้ `stock track` token (amber fill) พร้อมข้อความ "ซื้ออีก $X เพื่อส่งฟรี"
- [ ] **6.5** Upsell ใน Cart dialog — "เพิ่มสินค้าที่คนมักซื้อพร้อมกัน" (reuse `topSavers`)
- [ ] **6.6** Confirm dialog ก่อน checkout พร้อมสรุปส่วนลดที่ได้ กระตุ้นให้เป็นสมาชิก
- [ ] **6.7** Accessibility audit
  - [ ] `alt` ครบทุกรูป
  - [ ] keyboard เข้าถึง search / stepper / cart ได้
  - [ ] focus ring มองเห็นได้บนพื้นขาว
  - [ ] `aria-label` บนปุ่มไอคอน (ตะกร้า, favourite, carousel)
  - [ ] contrast ของข้อความ 12px/10px ผ่าน WCAG AA
- [ ] **6.8** Responsive audit ตามตาราง breakpoint ใน `DESIGN.md`
  - [ ] Mobile: hero stack, hero รูปซ่อน, category 2 คอลัมน์, product 2 คอลัมน์, carousel controls ซ่อน
  - [ ] Tablet: category 4, brands 2, top saver 3, best seller 3, signup panel ลงด้านล่าง carousel
  - [ ] Desktop/Wide: ครบตาม spec
- [ ] **6.9** Metadata / SEO พื้นฐาน
  - [ ] `metadata` เป็น Thai ตาม `lang="th"`
  - [ ] `generateMetadata` ต่อหน้า product / search
- [ ] **6.10** Final QA: `npm run lint` + `npm run build` ผ่าน · ไลน์ทุก flow บน mobile

---

## Phase 7 — ความทนทานของระบบ (Stability Hardening)

> **ทำก่อน Phase 1–6** — เกิดจาก code review + reproduce จริงทุกข้อ ปัญหาชัดเจนว่ากระทบผู้ใช้หรือทำให้ทั้งเว็บตาย ไม่ใช่งานเสริม
> วันที่ scope: 2026-10-11 · ที่มา: `grill-me` edge-case audit (data/API, UI/routing, test/build)

### 7.0 กันเว็บตายก่อน (ทำอันดับนี้ก่อนส่วนอื่นทั้งหมด)

- [ ] **7.0.1** เพิ่ม `src/app/error.tsx` (route-level) + `src/app/global-error.tsx` ที่ยังไม่มีเลย
  - ตอนนี้ uncaught throw หลุดไปโดน default Next error page — หน้าตายดิบ ไม่มี nav กดอะไรไม่ได้
  - `error.tsx` ต้องมี `"use client"` + ปุ่ม "Try again" (`reset()`) และลิงก์กลับ `/`
- [ ] **7.0.2** `src/db/queries.ts:112` — guard `JSON.parse(row.lines)` ด้วย `try/catch` fallback เป็น `[row.label]`
  - ค่าใน `categories.lines` ที่ไม่ใช่ JSON ทำให้ `listCategories()` throw → **500 ทั้งหน้าแรก + header ทุกหน้า**
  - เป็นจุด choke point เดียวของ 4 route ที่ได้ผลกระทบ
  - ทำให้เข้ากับ posture เดิมของโค้ด (`coverage.ts` และ `toMatchQuery` ก็ defensive อยู่แล้ว)
- [ ] **7.0.3** `src/db/queries.ts:288,308` — clamp `page` ด้วย `Number.isSafeInteger` ก่อนคูณกับ `limit`
  - `page` ≥ ~7.7e17 → `(page-1)*limit` ล้น int64 → better-sqlite3 bind เป็น REAL → `SQLITE_MISMATCH` → 500
  - clamp **ทั้งสองชั้น** (ดู 7.1) · ทดสอบด้วย `?page=999999999999999999`

### 7.1 Param validation

- [ ] **7.1.1** `src/db/queries.ts:288-289` — `searchProducts` ต้องกันตัวเอง: `Number.isSafeInteger` + clamp `page ≥ 1`, `limit` ในช่วง `[1, 50]`
  - ให้เป็น single source of truth — ใครเรียกก็ปลอดภัย ไม่ต้องพึ่งผู้เรียก
- [ ] **7.1.2** route handlers ทั้ง 3 จุด clamp ซ้ำก่อนเขียน `meta` ลง wire
  - `src/app/api/products/route.ts:16` · `src/app/api/categories/[name]/products/route.ts:18` · `src/app/search/page.tsx:38`
  - เหตุผล: กัน `meta.page` ที่หลุดออกไปถึง client (`?page=1000000000000000` ตอนนี้ตอบ `meta.page` เป็น 1e15)
- [ ] **7.1.3** `src/app/api/products/route.ts:17` — parse `limit` ใหม่ (ตอนนี้ `parseInt("1e3")` → `1`)
  - ขอ 1000 ได้มา 1 ชิ้น พร้อม `totalPages: 29` ให้ client เดิน 29 request
- [ ] **7.1.4** เพิ่ม `maximum` ใน `src/lib/openapi.ts:64` ให้ตรงกับ clamp จริง

### 7.2 Schema migration

- [ ] **7.2.1** `src/db/schema.ts:108` — เพิ่ม `ALTER TABLE … ADD COLUMN` path ที่ guard ด้วย `PRAGMA table_info`
  - ตอนนี้ `MIGRATIONS` มีแต่ `CREATE TABLE IF NOT EXISTS` ทั้งหมด → เพิ่มคอลัมน์ = **silent no-op**
  - ผลคือ `PRODUCT_COLUMNS` (`queries.ts:47`) throw `no such column` → 500 ทุก endpoint
  - `data/farmart.db` เป็น gitignored → คนที่เจอกู้ด้วยการลบไฟล์ที่ git ไม่เก็บไม่ได้
- [ ] **7.2.2** ใส่ `PRAGMA user_version` เป็น migration ledger + ห่อ `runMigrations` ด้วย transaction
  - ตอนนี้ `db.exec()` รัน DDL หลาย statement โดยไม่มี transaction → พังกลางทางแล้วค้างครึ่ง ๆ ถาวร
- [ ] **7.2.3** แก้ comment ใน `schema.ts` ที่สั่ง "add to end of MIGRATIONS" ให้ตรงกับพฤติกรรมจริง

### 7.3 Seed & FTS durability

> ทั้ง 3 อันนี้เป็นบรรทัดเดียวกัน แต่แยกทำทีละอันเปลือง review — ทำรวดเดียว

- [ ] **7.3.1** `src/db/seed.ts:110-111` — ย้าย `syncSearchIndex(db)` **เข้า** `db.transaction` เดียวกับ `insert()`
  - ตอนนี้อยู่นอก transaction → ถ้าตรงนี้พัง ข้อมูล commit สำเร็จแต่ FTS ว่างถาวร
- [ ] **7.3.2** `src/db/seed.ts:9-17` — `seedIfEmpty` ให้เช็ค `products_fts` count ด้วยและซ่อมอัตโนมัติ
  - ตอนนี้นับแค่ `products` → `count > 0` ก็ return ทิ้ง FTS ที่ว่างโดยไม่มี error ให้เห็น
  - อาการ: catalogue ปกติ แต่ `/search?q=milk` → 0 results ตลอดอายุไฟล์
  - เกี่ยวกับ `AGENTS.md` — ปัจจุบันระบุว่า `doctor.mjs` เป็นตัวจับปัญหานี้ ต้องอัปเดตเอกสารหลังแก้
- [ ] **7.3.3** `src/db/client.ts:28-31` — memoize handle ลง `globalThis` **ก่อน** seed หรือห่อด้วย try/catch
  - ตอนนี้ throw ก่อนถึงบรรทัด memoize → ทุก request รัน migration + seed ใหม่แล้วพังซ้ำ → process ตายทุก route จนกว่าจะ restart
  - trigger: 2 process เปิด db ว่างพร้อมกัน (`npm run dev` ทับกับ `seed-db.mjs`)

### 7.4 UX ที่ทำให้ผู้ใช้หลง

- [ ] **7.4.1** `src/db/queries.ts:288` — clamp `page` ให้อยู่ในช่วง `1..totalPages` (แสดงหน้าสุดท้าย)
  - `/search?page=9999` ตอนนี้ขึ้น "No products found" ทั้งที่มี 29 ชิ้น
  - แถวก่อนหน้าคือ empty state branch ที่ **ซ่อนทั้งจำนวนผลลัพธ์และ `<Pagination>`** ไปด้วย → dead end
- [ ] **7.4.2** `src/db/queries.ts:291` — ใช้ `MATCH` ตามเดิม แต่ `ORDER BY` ตาม sort ที่เลือกแทน `rank`
  - ตอนนี้มี `q` ปุ๊บ `orderByClause` ถูกทิ้งทิ้ง → ผู้ใช้เลือก "Price: low to high" แล้ว select ยังโชว์ว่าเลือกอยู่ แต่ grid ไม่ขยับ
  - FTS5 กรองได้ตามปกติ จัดอันดับไม่ตาม relevance เท่านั้น
  - เพิ่ม test pin พฤติกรรมใหม่ (`queries.test.ts:175` เดิม pin ตัวเก่า)
- [ ] **7.4.3** `src/components/search-bar.tsx:5-6` — ให้ `SearchBar` อ่าน `useSearchParams()` ให้ตรงกับ URL
  - ตอนนี้ `/search?q=milk` แสดงผลลัพธ์ แต่ช่องค้นาว่างเปล่า และ dropdown ขึ้น "All Categories"
  - `search-controls.tsx:25` ทำถูกแล้ว — ใช้เป็นต้นแบบ
- [ ] **7.4.4** `src/components/search-bar.tsx:35-38` — clone `URLSearchParams` เดิมแทนการสร้างใหม่
  - เปลี่ยน category ตอนนี้ทิ้ง `brand` / `sort` / `onSale` / `page` หมดโดยไม่เตือน
  - `SearchControls.withParam` (`search-controls.tsx:11`) ทำถูกแล้วในไฟล์เดียวกัน
- [ ] **7.4.5** `src/components/search-results.tsx:21-39` — `href()` รับ `string[]` ไม่ตก param
  - `/search?q=milk&q=cream` → ทุกลิงก์ facet ทิ้ง `q` ทั้งหมด (ผู้ใช้หายคำค้นเงียบ ๆ)
  - พร้อมกัน: อย่า emit URL `/search?` ท้ายเปล่า ตอนไม่มี param เหลือ
- [ ] **7.4.6** `src/components/search-results.tsx:150` — `hasFilters` นับเฉพาะ `q`/`category`/`brand`/`sort`/`onSale`
  - ตอนนี้ `page` และ utm param นับเป็น filter → ปุ่ม "Clear all filters" โผล่ตอนไม่ได้ filter อะไรเลย
- [ ] **7.4.7** `src/components/sections.tsx:26,81` + `src/components/header.tsx:23` — แก้ `href="#"` ที่ตาย
  - "All Categories ›" / "All Offers ›" บนหน้าแรก และโลโก้ คลิกแล้วแค่เลื่อนขึ้นบน
  - เปลี่ยน default ของ `SectionHeader` (`sections.tsx:26`) เป็น route จริง หรือบังคับให้ส่ง `linkHref`

### 7.5 Housekeeping (ของที่เสียอยู่ตอนนี้ — ไม่แตะ product behavior)

- [ ] **7.5.1** `npm run lint` แดงตอนนี้ — เพิ่ม `.opencode/` (และ `graphify-out/`, `skills-lock.json`) ใน `eslint.config.mjs:72` `globalIgnores` **หรือ** gitignore
  - error จริง: `.opencode/plugins/block-rm-rf.ts:16,17` — `no-explicit-any`
  - `git check-ignore` ไม่ match ทั้ง 4 path และทั้งหมดขึ้น `??` → `git add -A` จะ commit เข้าไป
  - verification step แรกตาม `AGENTS.md` พังตั้งแต่ตอนนี้
- [ ] **7.5.2** `vitest.config.ts` — เพิ่ม `coverage.include: ["src/**/*.{ts,tsx}"]`
  - ตอนนี้ไม่มี `include` → Vitest 4 ไม่เพิ่มไฟล์ที่ไม่มี test → 34 source file (รวม `src/lib/data.ts`, ทุก component) **ไม่โผล่ในรายงานเลย**
  - `/tests` เลยโชว์ 98.87% จากตัวหาร 14/51 ไฟล์ — ตัวเลขโกหก
  - `TARGET = 90` (`tests/page.tsx:12`) วัดกับ denominator ที่ config เลือกเอง ไม่ใช่กับ repo
- [ ] **7.5.3** `src/db/seed.test.ts:57,74,88,118` — 4 assertion ที่ผ่านได้แม้ตารางว่าง
  - loop รัน 0 ครั้ง (`toBe(0)` ผ่าน), `COUNT(*) === 0` ผ่าน, `0 === 0` ผ่าน
  - ตอนนี้ยังพึ่ง test อื่นในไฟล์เดียวกันที่เรียก `restore()` ก่อน
  - แก้: `beforeEach(restore)` + `expect(rows.length).toBeGreaterThan(0)` ใน loop
- [ ] **7.5.4** `src/lib/coverage.ts:70,83` — ย้าย `Object.entries` และ `fs.statSync` เข้า `try` ด้วย
  - ไฟล์ coverage ที่เป็น `null` → throw → `/tests` เป็น prerender = **crash ตอน `next build`**
  - `{}` → render 0.0% แทน empty state
- [ ] **7.5.5** `vitest.config.ts` — pin `pool: "forks"`
  - `coverage.test.ts:31` เรียก `process.chdir()` ซึ่งใช้ไม่ได้ใน worker threads
  - วันนี้ default คือ forks เลยยังไม่พัง — แต่พังทันทีถ้า default เปลี่ยนหรือมีคนส่ง `--pool=threads`
- [ ] **7.5.6** `package.json` — เพิ่ม `"engines": { "node": ">=22" }`
  - `better-sqlite3@13` ต้องใช้ Node ≥ 22 แต่ `npm ci` บน Node 20 ผ่านแล้วพังตอน import
- [ ] **7.5.7** `src/db/queries.ts:76` — guard `discountRate` ด้วย `Number.isFinite`
  - badge ที่ไม่ใช่ตัวเลข (`"Flash Sale"`) → `NaN` → `JSON.stringify` ออกมาเป็น `null`
  - ผิดสัญญา `openapi.ts:29` (`type: integer` ไม่ nullable) และ `api-types.ts:21`
- [ ] **7.5.8** `src/lib/api.ts:21` vs `src/lib/sorts.ts:28` — ทำ case handling ให้ตรงกัน
  - ตอนนี้ `?sort=PRICE_ASC` มีผลบน `/api/products` แต่ไม่มีผลบน `/search` — URL เดียวกันคนละความหมาย
  - `AGENTS.md` เขียนว่าทั้งสองทางใช้ allowlist เดียวกัน แต่ไม่จริง

---

## ลำดับส่งมอบ (Milestones)

| Milestone | เฟส | ผลลัพธ์ |
|---|---|---|
| **M0** | **Phase 7.0 + 7.1–7.5** | **เว็บไม่พังจาก input แปลก · ข้อมูลไม่หาย · lint/test เขียว (ทำก่อนเฟสอื่น)** |
| M1 | Phase 0 + 1 | ค้นหาและเลือกซื้อได้จริง |
| M2 | Phase 2 + 3 | หน้าแรกดึงดูด, เห็นราคา/ส่วนลด/รีวิว, หยิบใส่ตะกร้าได้ |
| M3 | Phase 4 | ระบบสมาชิกและส่วนลด 15% |
| M4 | Phase 5 | จัดการตะกร้า + checkout ครบวงจร |
| M5 | Phase 6 | ปิดงานธุรกิจ + polish คุณภาพ |

## Requirement → Phase

| Requirement | Phase |
|---|---|
| 1. ค้นหา + เลือกซื้อเองผ่านเว็บ | 1 (รองรับโดย 0, 3.4) |
| 2. หน้าแรกดึงดูด + หมวดสินค้า | 2 |
| 3. ราคา + ส่วนลด + rating + หยิบใส่ตะกร้า | 3 |
| 4. โซนกระตุ้นยอด + สมัครสมาชิก 15% | 4 |
| 5. จัดการตะกร้าก่อนสั่งซื้อ | 5 |
| 6. เป้าหมายธุรกิจ | 6 |

## กฎที่ต้องยึดตลอด (จาก `DESIGN.md`)

- **สี amber = การกระทำ**, **สีแดง = ความเร่งด่วน** (ราคา, ส่วนลด, countdown, หัวข้อโปรโมชัน) ห้ามสลับ
- ไม่มีเส้นคั่นระหว่าง section — ใช้การสลับสี band เท่านั้น
- ชื่อสินค้า clamp 2 บรรทัด สูง 34px พอดี ห้ามขยายบรรทัดที่ 3
- ปุ่ม Add To Cart ต้อง `mt-auto` ให้ขอบล่างการ์ดเรียงเสมอ
- การ์ดตอนนิ่งไม่มีเงา — แยกด้วยเส้น 1px
- ขนาดตัวอักษรในการ์ด/ปุ่มไม่เกิน 14px
- ปุ่ม carousel มน 0 radius และซ่อนใต้ `md`
- Dialog มีปุ่ม amber หลักได้หนึ่งปุ่มเท่านั้น และปิดได้ด้วย `Esc` / คลิก scrim เสมอ
- ข้อมูลสินค้าอยู่ใน `src/data/store.ts` — copy และ layout อยู่ใน component