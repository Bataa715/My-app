# Mongol - Хятадад зориулсан Супер Апп (Баримт Бичиг)

Энэхүү баримт бичиг нь "Mongol" аппликейшнийн технологийн стек, үндсэн функц, файлын бүтэц, код хоорондын хамаарлыг дэлгэрэнгүй тайлбарлана. Энэ нь төслийн ирээдүйн хөгжүүлэлт, засвар үйлчилгээнд зориулсан үндсэн гарын авлага болно.

## Технологийн Стек (Technology Stack)

- **Framework**: Next.js 15 (App Router)
- **Хэл**: TypeScript
- **UI**: React, ShadCN UI, Tailwind CSS
- **Backend (BaaS)**: Firebase (Authentication, Firestore, Storage, Cloud Messaging)
- **Form Management**: React Hook Form, Zod (Validation)
- **Мобайл Хөрвүүлэлт**: Capacitor (Native Android, iOS-д хөрвүүлэх боломжтой)
- **AI**: Genkit (Төлөвлөгдсөн)

---

## Үндсэн Функцууд (Core Features)

- **Үйлчилгээ хайх**: Нислэг, буудал, орчуулагч, зах зээл гэх мэт олон төрлийн үйлчилгээг хайх, шүүх.
- **Хэрэглэгчийн систем**: И-мэйлээр бүртгүүлэх, нэвтрэх, нууц үг сэргээх, хувийн мэдээллээ удирдах.
- **Захиалга**: Үйлчилгээг апп дотроос захиалах, захиалгын түүхээ харах.
- **Хадгалах**: Сонирхсон үйлчилгээ, барааг "Хадгалсан" хэсэгт нэмэх, устгах.
- **Мэдэгдэл**: Firebase Cloud Messaging-д суурилсан push notification систем.
- **Олон хэл**: Монгол (mn) болон Хятад (cn) хэлний сонголт.
- **Зургийн менежмент**: Firebase Storage ашиглан зураг байршуулах, Vercel Image Optimization ашиглан хурдасгах.
- **Хувилбарын удирдлага**: Шинэ хувилбар гарсан үед хэрэглэгчид мэдэгдэх систем.

---

## Төслийн Бүтэц (Project Structure)

Энэхүү төсөл нь Next.js App Router-ийн зарчимд суурилсан бөгөөд файлын бүтэц нь дараах байдалтай байна.

### `src/`

Аппын үндсэн код байрлах гол хавтас.

#### `src/app/` - Хуудас ба Замчлал (Routing)

Аппын хуудаснууд болон замчлалыг тодорхойлно. Next.js App Router-ийн хавтаст суурилсан замчлалын системийг ашигладаг.

- **`layout.tsx`**: Хамгийн дээд түвшний (root) layout. Фонт, үндсэн context provider-уудыг (`AuthProvider`, `LanguageProvider`) тодорхойлж, бүх хуудсыг бүрхэнэ.
- **`globals.css`**: Аппын ерөнхий загвар, өнгөний тохиргоо (ShadCN theme-ийн CSS хувьсагчид).
- **`page.tsx`**: Аппын үндсэн орох цэг (`/`). Хэрэглэгчийг шууд `/services` хуудас руу шилжүүлдэг (redirect).

- **`/(auth)/`**: Нэвтрэх, бүртгүүлэхтэй холбоотой хуудсуудын групп. Энэ групп нь өөрийн гэсэн layout-тай.
  - `layout.tsx`: Нэвтрэх, бүртгүүлэх хуудасны голдоо байрласан, логотой загвар.
  - `login/page.tsx`: Нэвтрэх формыг (`LoginForm`) харуулна.
  - `register/page.tsx`: Бүртгүүлэх формыг (`RegisterForm`) харуулна.

- **`/main/`**: **Нэвтэрсэн хэрэглэгчийн** хуудсуудын групп. Энэ хэсэгт хандахын тулд нэвтэрсэн байх шаардлагатай.
  - `layout.tsx`: Нэвтэрсэн хэрэглэгчийн үндсэн аппын layout. `Header`, `BottomNav`, `CityProvider`, `SearchProvider`-г агуулна. Мөн нэвтрээгүй хэрэглэгчийг `/auth/login` руу шилжүүлэх хамгаалалтын логиктой.
  - `notifications/page.tsx`: Хэрэглэгчийн болон системийн мэдэгдлүүдийг харуулна.
  - `orders/page.tsx`: Хэрэглэгчийн хийсэн бүх захиалгын түүхийг харуулна.
  - `profile/`: Хэрэглэгчийн хувийн мэдээлэлтэй холбоотой хуудсууд.
    - `page.tsx`: Профайлын үндсэн цэс.
    - `help-support/page.tsx`: Тусламж, дэмжлэг, Түгээмэл Асуулт Хариулт.
    - `personal-info/page.tsx`: Хувийн мэдээлэл засах форм.
    - `register-translator/page.tsx`: Орчуулагчаар бүртгүүлэх анкет.
    - `settings/page.tsx`: Нууц үг солих хуудас.
  - `saved/page.tsx`: Хэрэглэгчийн хадгалсан зүйлсийн жагсаалт.

- **`/services/`**: **Нийтийн** буюу нэвтрээгүй хэрэглэгч ч хандах боломжтой үйлчилгээний хуудсууд.
  - `layout.tsx`: Үйлчилгээний хуудсуудын үндсэн layout. `Header`, `BottomNav`, `CityProvider`, `SearchProvider`-г агуулна.
  - `page.tsx`: Аппын нүүр хуудас. Бүх үйлчилгээний ангиллын мэдээллийг серверээс татаж, карусель хэлбэрээр харуулна.
  - `[category]/page.tsx`: Тухайн ангиллын (жишээ нь, `hotels`, `translators`) бүх үйлчилгээний жагсаалтыг харуулна.
  - `[category]/[id]/page.tsx`: Тухайн үйлчилгээний дэлгэрэнгүй мэдээллийг (жишээ нь, `hotels/hotel_123`) харуулна.

#### `src/components/` - Дахин Ашиглагдах Компонентууд

- **`/auth/`**: Нэвтрэлт, бүртгэлтэй холбоотой компонентууд.
  - `LoginForm.tsx`: Нэвтрэх форм.
  - `RegisterForm.tsx`: Бүртгүүлэх форм.
  - `RegisterTranslatorForm.tsx`: Орчуулагчийн анкет.
  - `ProtectedPage.tsx`: Тухайн хуудсыг зөвхөн нэвтэрсэн хэрэглэгчид харуулах хамгаалалтын компонент.
- **`/layout/`**: Хуудасны ерөнхий загварын компонентууд (`Header`, `BottomNav`).
- **`/profile/`**: Профайлын хэсэгт ашиглагдах компонентууд (`PersonalInfoForm`).
- **`/services/`**: Үйлчилгээтэй холбоотой компонентууд (`FlightSearchForm`, `TranslatorCard` гэх мэт).
- **`/ui/`**: ShadCN UI-аас үүсгэсэн үндсэн компонентууд (Button, Card, Input г.м).
- **`AppInit.tsx`**: Апп эхлэх үеийн тохиргоог хийдэг (Firebase Cloud Messaging).
- **`CitySelector.tsx`, `CitySelectionSheet.tsx`**: Хот сонгох функц бүхий компонентууд.
- **`ServiceCard.tsx`**: Үйлчилгээний ерөнхий картыг харуулдаг компонент.
- **`ServiceReviewForm.tsx`**: Үйлчилгээнд үнэлгээ, сэтгэгдэл үлдээх форм.
- **`VersionCheck.tsx`**: Апп-ын хувилбарыг шалгаж, шинэчлэлт гарсан бол мэдэгдэх компонент.

#### `src/contexts/` - Төлөв Удирдах Context (Global State)

- **`AuthContext.tsx`**: Хэрэглэгчийн нэвтрэлтийн төлөв (`user`, `loading`), хадгалсан зүйлсийн ID (`savedItemIds`), болон холбогдох функцуудыг (`login`, `register`, `logout`, `addFavorite`) апп даяар дамжуулна. `useAuth` hook-оор дамжуулан ашиглана.
- **`CityContext.tsx`**: Сонгогдсон хотын төлөв, хотуудын жагсаалтыг удирдах context. `useCity` hook-оор дамжуулан ашиглана.
- **`LanguageContext.tsx`**: Аппын хэлний сонголт (mn/cn), орчуулгын функц `t()`-г удирдах context. `useLanguage` hook-оор дамжуулан ашиглана.
- **`SearchContext.tsx`**: Хайлтын талбарын утгыг глобал төлөвт хадгалах context. `useSearch` hook-оор дамжуулан ашиглана.

#### `src/hooks/` - Custom Hooks

- **`use-toast.ts`**: "Toast" (жижиг мэдэгдэл) харуулах hook.
- **`useTranslation.ts`**: `LanguageContext`-ийг хялбар ашиглах зориулалттай hook.

#### `src/lib/` - Туслах функц ба Тохиргоо

- **`constants.ts`**: Аппад ашиглагдах тогтмол өгөгдлүүд (үйлчилгээний ангилал, нисэх онгоцны буудлуудын жагсаалт г.м).
- **`firebase.ts`**: Firebase-ийн бүх үйлчилгээг (Auth, Firestore, Storage, Messaging) эхлүүлж, экспортлодог гол файл.
- **`storageService.ts`**: Firebase Storage-тай ажиллах функцуудыг агуулдаг (зураг байршуулах г.м).
- **`utils.ts`**: `cn` гэх мэт жижиг туслах функцууд.

#### `src/types/` - TypeScript Төрлүүд

- **`index.ts`**: Аппын бүх custom TypeScript төрлүүдийг (`UserProfile`, `Order`, `Translator` г.м) нэг дор тодорхойлсон файл. Энэ нь кодын уншигдах байдал, засварлахад хялбар байдлыг хангана.

---

## Мобайл Хувилбар (Capacitor)

Энэхүү төсөл нь Capacitor ашиглан Native Android болон iOS апп болгон хөрвүүлэх боломжтой.

### Үндсэн тохиргоо:

- **`capacitor.config.ts`**: Capacitor-ийн үндсэн тохиргоог агуулдаг. Апп-ын ID (`appId`), нэр (`appName`), болон вэб файлууд байрлах хавтас (`webDir`) зэргийг энд тодорхойлно. `webDir` нь `'out'` гэж тохируулагдсан бөгөөд энэ нь Next.js-ийн статик экспорт хийсэн файлуудыг ашиглана гэсэн үг.

- **`next.config.ts`**: Мобайл болон вэб хувилбарын build-ийг ялгаатай хийх зорилгоор нөхцөлт логик ашигласан. `CAPACITOR_BUILD=true` орчны хувьсагч тохируулагдсан үед `output: 'export'` болон `images: { unoptimized: true }` тохиргоог автоматаар идэвхжүүлдэг. Энэ нь Capacitor-т зориулсан статик хувилбар үүсгэхэд шаардлагатай.

- **`package.json`**: Мобайл хувилбар үүсгэх ажлыг хөнгөвчлөх script-үүд нэмэгдсэн:
  - `capacitor:sync`: Вэб хувилбарыг статикаар build хийж (`CAPACITOR_BUILD=true` хувьсагчтайгаар), үүссэн `out` хавтасны агуулгыг Android болон iOS-ийн native төслүүд рүү хуулна.
  - `capacitor:copy`: Зөвхөн хуулах үйлдлийг хийнэ.
  - `capacitor:open:android`: Android Studio-д төслийг нээнэ.
  - `capacitor:open:ios`: Xcode-д төслийг нээнэ.

### Мобайл хувилбар үүсгэх заавар:

1.  **Dependencies суулгах**: `npm install`
2.  **Native төсөл үүсгэх (анхны удаа)**:
    ```bash
    npx cap add android
    npx cap add ios
    ```
3.  **Sync хийх**: Вэб кодын өөрчлөлтийг native төсөл рүү хуулахын тулд дараах командыг ажиллуулна:
    ```bash
    npm run capacitor:sync
    ```
4.  **Native IDE-д нээх**:
    - Android: `npm run capacitor:open:android`
    - iOS: `npm run capacitor:open:ios`
5.  **Build хийж, ажиллуулах**: Android Studio эсвэл Xcode ашиглан аппликейшнээ build хийж, эмулятор эсвэл бодит төхөөрөмж дээр ажиллуулна.

---
## Төслийн бусад файлууд

- **`next.config.ts`**: Next.js-ийн үндсэн тохиргооны файл. Зургийн домайн, орчны хувьсагч зэргийг энд тохируулна.
- **`tailwind.config.ts`**: Tailwind CSS-ийн тохиргоо (фонт, өргөтгөлүүд).
- **`tsconfig.json`**: TypeScript-ийн тохиргоо.
- **`package.json`**: Төслийн хамаарлууд (dependencies) болон script-үүдийг тодорхойлно.
- **`firestore.rules`**: Firestore өгөгдлийн сангийн аюулгүй байдлын дүрмүүд. Хэрэглэгчийн хандалтыг хязгаарлаж, зөвхөн зөвшөөрөгдсөн үйлдлүүдийг хийх боломжийг олгоно.
- **`README.md`**: Энэхүү баримт бичиг.
