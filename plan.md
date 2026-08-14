# Plan: Portfolio Site — AI Engineer (target market: Malaysia)

Status: **v1 built with dummy assets** (2026-08-11) — semua 4 halaman jadi, build produksi sukses (`dist/` 2.1MB). Lihat §10 untuk status detail & langkah selanjutnya.

---

## 1. Ringkasan Riset

Sumber: pencarian web Agustus 2026 (lihat catatan di bawah tiap keputusan).

| Temuan | Implikasi untuk kita |
|---|---|
| Portfolio developer paling efektif pakai **Terminal/IDE aesthetic** atau **Bento grid** — projects-first, recruiter-friendly | Kita pakai bento-style grid di homepage + aksen monospace, sejalan dengan keputusan "Hybrid Technical-Professional" sebelumnya |
| Case study terbaik 2026: pimpin dengan **problem + outcome**, baru proses (bukan "I designed this" → wireframe dump) | Tiap portfolio page dibuka dengan 1 kalimat hasil/impact, bukan daftar teknologi |
| **Batch prediction pattern** (precompute lalu serve hasil) adalah pola desain ML system yang sah, bukan trik | Demo YOLO interaktif Anda memakai pola ini secara legit — kita akan transparan soal ini ke pengunjung (lihat §4) |
| Vercel Hobby: 100GB bandwidth/bln, serverless timeout 10 detik, tidak untuk komersial | Karena hasil YOLO precomputed & statis, kita **tidak butuh serverless function sama sekali** — seluruh demo jalan di client-side. Jauh di bawah limit apapun |
| RAG/LLM + CV project dianggap paling relevan untuk profil AI Engineer 2026 | Sejalan dengan 2 case study utama Anda (text2SQL agent + CV/YOLO) |

---

## 2. Peta Situs (Sitemap)

```
/                       Homepage
/about                  About Me
/work/agentic-erp       Portfolio: Agentic AI ERP (text2SQL + data viz)
/work/vision-kpi        Portfolio: Computer Vision KPI Scoring (interactive YOLO demo)
```

Proyek lain Anda (image-diff bbox, pallet detection, Excel/Gsheet automation) **tidak dapat halaman sendiri** — ditampilkan sebagai kartu ringkas ("Other Work") di homepage, cukup 1 gambar + 2 baris deskripsi + link GitHub kalau ada repo publik. Ini asumsi saya karena Anda hanya minta 4 halaman eksplisit — kalau mau salah satu dari mereka jadi case study penuh juga, tinggal bilang, tinggal tambah 1 route.

---

## 3. Homepage (`/`)

Struktur top-to-bottom:

1. **Hero** — nama, title "AI Engineer — Computer Vision & Data Automation", satu kalimat value prop konkret, badge kecil "Open to relocate to Malaysia · EP-eligible", tombol: [Download CV] [Contact].
2. **Bento grid ringkasan** (3-4 kartu): "1 tahun production AI di FMCG (Wings Group)", "2 tahun fokus AI", "Fullstack capable", "Computer Vision → real KPI impact" — angka besar + label pendek, gaya stat tile, bukan paragraf.
3. **Featured Work** (2 kartu besar) — Agentic ERP AI & CV KPI Scoring, masing-masing dengan thumbnail/GIF preview, 1 kalimat outcome, tombol "View case study →".
4. **Skills** — dikelompokkan (AI/ML & LLM, Computer Vision, Data Engineering, Fullstack, Tools), ditampilkan sebagai tag/pill dengan font mono, bukan progress bar.
5. **Other Work** (grid kecil, 3 kartu) — image-diff bbox, pallet detection, Excel/BigQuery automation.
6. **Experience strip** — timeline singkat (Wings Group + pendidikan), link ke `/about` untuk detail.
7. **Footer/Contact** — email, LinkedIn, GitHub, lokasi.

---

## 4. Portfolio Page 1 — Agentic AI ERP (`/work/agentic-erp`)

**Framing pembuka (problem → outcome dulu):**
> "Tim non-teknis di [Wings Group] perlu jawaban cepat dari database ERP tanpa menunggu antrian request ke tim data. Saya bangun AI agent yang menerjemahkan pertanyaan bahasa natural jadi query SQL dan menyajikan hasilnya sebagai visualisasi langsung di chat."

Konten:
- **Video/GIF demo** (embed dari Loom/YouTube unlisted, bukan file upload langsung — hindari bandwidth Vercel) menunjukkan: user mengetik pertanyaan → agent generate SQL → hasil muncul sebagai chart.
- **Architecture diagram** sederhana: User → LLM Agent (text2SQL) → ERP DB → Result formatter → Chart. Dibuat custom (SVG/diagram sendiri), bukan template AI-generated yang terlalu rapi.
- **Tech stack** (tag mono font): LLM/framework yang dipakai, database, chart lib.
- **Tantangan teknis** (1-2 paragraf): mis. bagaimana handle skema ERP yang kompleks, guardrail supaya query aman (read-only, dsb), bagaimana memastikan akurasi SQL yang di-generate.
- **Hasil/impact**: kalau ada angka (mis. "mengurangi waktu tunggu laporan dari X jam ke Y menit"), pakai; kalau tidak ada angka pasti, gunakan deskripsi kualitatif yang jujur, jangan karang angka.
- **Data viz showcase**: screenshot 2-3 contoh chart yang dihasilkan (bar/line/pie sesuai kasus nyata).

---

## 5. Portfolio Page 2 — Computer Vision KPI Scoring (`/work/vision-kpi`)

Ini halaman paling kompleks secara UX. Dipecah jadi dua bagian: **case study text** (di atas) + **interactive demo** (di bawah, jadi centerpiece halaman).

### 5a. Case study framing
> "Sales rep icecream perlu cara cepat mengukur kepatuhan planogram di freezer toko tanpa audit manual satu-satu. Saya bangun model YOLO yang mendeteksi produk di rak freezer dari 1 foto dan langsung menghasilkan skor KPI planogram."

### 5b. Interactive Demo — mekanisme detail

**Alur user:**
1. User melihat 4 thumbnail foto planogram freezer (raw, belum diproses) dalam bentuk kartu pilihan (radio card style, bisa diklik/keyboard-accessible).
2. User pilih 1 gambar → klik tombol "Run Detection".
3. **Fake processing state** (± 2.5–3.5 detik): animasi scanning line di atas gambar + teks status berganti tiap ~800ms: `Loading model weights...` → `Running YOLO inference...` → `Calculating shelf KPI...` — ini menjual kesan real-time tanpa benar-benar menjalankan model di browser/server.
4. **Result state**: gambar berganti ke versi **annotated** (bounding box asli hasil model Anda, di-generate offline sebelum launch) + panel KPI di sampingnya (mis. shelf share %, jumlah SKU terdeteksi, compliance score, empty-slot count) ditampilkan sebagai stat tiles.
5. User bisa klik "Try another image" untuk ulangi dengan gambar lain.

**Kenapa precompute, bukan real-time inference:**
- Vercel Hobby serverless timeout 10 detik — model YOLO real (apalagi cold start) berisiko timeout atau butuh GPU yang tidak tersedia di free tier.
- Precompute menjamin demo selalu konsisten & cepat, tidak pernah "error 500" saat recruiter sedang lihat.
- Ini legitimate design pattern (batch prediction), bukan kebohongan — **selama kita transparan**.

**Poin etika/kredibilitas (penting):**
- Tambahkan caption kecil di bawah panel hasil: *"Detection results shown are from actual YOLO model runs, precomputed for consistent demo performance."* — ini justru menambah kredibilitas (recruiter/tech lead paham kenapa didesain begini) dan menghindari kesan menipu kalau ada yang cek Network tab browser.
- Jangan klaim "real-time AI processing" di copy manapun.

**Implementasi teknis (tanpa backend):**
- 4 pasang gambar (`raw` + `annotated`) disimpan di `/public/demo/vision-kpi/`.
- 1 file `demo-results.json` berisi mapping `imageId → { annotatedImageUrl, kpiMetrics: {...} }`.
- Seluruh interaksi (pilih gambar, fake delay pakai `setTimeout`, tampilkan hasil dari JSON) adalah **client-side React state**, nol serverless function, nol API call — sangat ringan dan 100% dalam limit Vercel free.

---

## 6. About Me (`/about`)

- Foto asli profesional.
- Bio singkat, ditulis orang pertama, hindari buzzword ("passionate", "leverage cutting-edge").
- Pendidikan: Teknik Informatika 2015–2019.
- Timeline pengalaman: Wings Group (peran, durasi, ringkasan tanggung jawab), 2 tahun belajar AI mandiri.
- Catatan relokasi: terbuka bekerja di Malaysia / status kelayakan EP.
- Tombol download CV (PDF).

---

## 7. Tech Stack & Struktur Proyek

**Update:** setelah riset lebih lanjut soal batas Vercel free tier dan supaya situs se-ringan mungkin, stack dikoreksi dari Next.js → **Astro + React islands** (dikonfirmasi dengan user 2026-08-11).

| Aspek | Pilihan | Alasan |
|---|---|---|
| Framework | **Astro** (static build) + React island khusus demo interaktif | 95% halaman statis → Astro kirim ~0 JS untuk konten statis (islands architecture). Hanya `VisionKpiDemo` yang di-hydrate sebagai React component. Jauh lebih ringan dari Next.js App Router yang meng-hydrate seluruh halaman |
| Output | **Static build** (`astro build`) | Nol serverless function, nol function-hours — situs 100% file statis di CDN Vercel. Paling aman terhadap limit apapun |
| Styling | Tailwind CSS, **tema/palet custom** (bukan default indigo/violet) | Hindari kesan template AI-generated |
| Animasi | Framer Motion, dipakai **terbatas** (hero + island demo saja), sisanya CSS transition | Jaga bundle JS tetap kecil |
| Interaktivitas demo | React state (`useState`, `setTimeout`) di dalam island | Tidak butuh backend, sesuai limitasi Vercel free |
| Font | Self-hosted variable font — sans untuk body, **monospace untuk label teknis/tag** | Konsisten arah "Hybrid Technical-Professional"; hindari request eksternal ke Google Fonts CDN |
| Video demo | `<video>` native, file dikompres via ffmpeg, `preload="none"` + poster image | File asli 58MB terlalu berat untuk auto-load; dikompres ke ~5-8MB dan hanya di-download saat user klik play |
| Dummy images | SVG buatan sendiri (bukan raster) | Ringan, gampang di-swap dengan foto asli nanti |
| Hosting | Vercel Hobby (free) | Cukup karena semua statis |
| Contact form | Web3Forms (free tier) | Tanpa backend sendiri |
| Analytics | Vercel Analytics (free tier) | Built-in, tidak perlu setup lain |
| Domain | Custom domain disarankan (.dev/.com), opsional | Lebih profesional dari `*.vercel.app`, tapi bisa jalan dulu tanpa ini |

**Struktur folder rencana:**
```
/src
  /pages
    index.astro                  Homepage
    about.astro
    /work
      agentic-erp.astro
      vision-kpi.astro
  /components
    /ui/                          Komponen dasar (Button, Card, Tag, StatTile) — .astro
    /islands
      VisionKpiDemo.tsx            Komponen interaktif React (hydrated client-side)
  /layouts
    BaseLayout.astro
  /data
    demo-results.json              Mapping 4 gambar → hasil precomputed KPI
  /styles
    global.css
/public
  /demo/vision-kpi/raw/*.svg
  /demo/vision-kpi/annotated/*.svg
  /video/agentic-erp-demo.mp4      (dikompres dari assets asli)
  /cv/resume.pdf                   (placeholder, diisi nanti)
```

---

## 7b. Environment, Package Manager & Migration/Deployment

**Konteks penting:** development dilakukan di server Linux terpisah (bukan laptop pribadi Anda), yang akan dipindahkan ke Vercel nanti. Ini menentukan beberapa keputusan tambahan:

| Aspek | Keputusan | Alasan |
|---|---|---|
| Package manager | **Bun** (bukan npm) | Lebih cepat & ringan; dikonfirmasi resmi didukung Astro + `@astrojs/react`. Diinstall manual di `~/.bun` (installer resmi butuh `unzip` yang tidak tersedia & butuh sudo — disiasati dengan download+extract via `python3 -m zipfile`, tanpa sudo sama sekali) |
| Image optimization | **Tidak pakai `astro:assets <Image>`**, pakai `<img>` biasa + gambar sudah dikompres manual sebelum masuk `/public` | `astro:assets` bergantung ke Sharp, yang punya masalah kompatibilitas dengan Bun (`MissingSharp` error). Menghindari total risiko ini karena kebutuhan optimasi gambar kita sederhana |
| Version control | `git init` lokal di server ini, branch `main` | Riwayat kerja tetap terjaga meski belum push kemana-mana |
| GitHub | **Ditunda** — push & auth (gh CLI device login) dilakukan belakangan saat siap deploy pertama kali | Keputusan user 2026-08-11: kerja lokal dulu di server |
| Repo visibility (nanti) | **Public** | Repo portfolio publik jadi nilai tambah untuk kandidat AI/dev — recruiter bisa lihat kode aslinya. Pastikan tidak ada data ERP/perusahaan asli ter-commit (sudah aman karena pakai dummy asset) |
| Vercel deploy | **Import repo dari GitHub** (bukan `vercel deploy` manual dari CLI) | Supaya update berikutnya (nambah foto/video asli) cukup `git push`, auto-deploy — tidak tergantung server sementara ini |
| Vercel + Bun | Zero-config — begitu `bun.lock` ada di repo, Vercel otomatis pakai `bun install` | Dikonfirmasi lewat Vercel changelog (dukungan `bun.lock` text lockfile). Karena situs full static build, Vercel Bun *Runtime* (untuk serverless functions) tidak relevan/tidak dipakai |
| Raw asset besar | File asli (`assets/screen-recording2-*.mp4`, 58MB) **tidak di-commit** ke git — masuk `.gitignore`. Hanya versi terkompresi di `/public/video` yang di-commit | Jaga ukuran repo tetap kecil; source mentah cukup ada di server/local, tidak perlu riwayat git |

## 8. Checklist Aset dari Anda (blocker sebelum konten final)

- [ ] Foto profil profesional (saat ini pakai placeholder monogram "AC" di `/about`)
- [ ] 4 foto planogram freezer (raw) + hasil bounding box dari model YOLO Anda (annotated) + angka KPI aktual per gambar — saat ini pakai SVG dummy + angka contoh di `src/data/vision-kpi-results.json`. **Anda cukup timpa file di `/public/demo/vision-kpi/raw/*.svg` & `/annotated/*.svg` dengan foto+hasil asli (boleh format lain seperti .jpg/.png, tinggal update path di JSON), dan edit angka di JSON-nya.**
- [x] Screenshot/video demo text2SQL agent — sudah dipasang (`agentic-erp-demo.mp4`, dikompres dari asset Anda) + poster/thumbnail
- [ ] Screenshot hasil image-diff bbox & pallet detection asli (saat ini pakai ilustrasi diagram buatan, bukan screenshot asli) — untuk kartu "Other Work"
- [ ] CV/resume PDF terbaru → taruh di `/public/cv/resume.pdf` (tombol "Download CV" sudah mengarah ke path ini)
- [ ] Link LinkedIn & GitHub asli → edit di `src/data/site.ts`
- [ ] Angka/metrik hasil kerja (kalau ada) untuk tiap project — beberapa angka di homepage/about masih estimasi (mis. "92% best-case shelf compliance" diambil dari data dummy)

## 9. Open Questions

1. Apakah image-diff, pallet detection, dan Excel automation cukup jadi kartu ringkas di homepage, atau ada yang mau dijadikan case study penuh juga?
2. Sudah ada domain custom yang mau dipakai, atau pakai `*.vercel.app` dulu?
3. Untuk demo YOLO — apakah 4 foto planogram & hasil bounding box-nya sudah tersedia, atau perlu dijalankan ulang dulu dari model Anda?

## 10. Status Build (2026-08-11)

**Selesai:**
- Astro + React island + Tailwind v4, Bun sebagai package manager, output static murni
- Tema custom (warm neutral + teal accent, font Geist self-hosted), light & dark mode
- 4 halaman: Homepage, About, Agentic ERP AI (case study + video), Vision KPI (case study + demo interaktif)
- `VisionKpiDemo` React island: pilih gambar → fake loading (~2.7s, status text bergantian) → hasil precomputed + KPI stat tiles, dengan caption transparansi bahwa hasil precomputed
- Semua aset visual masih **dummy/placeholder** (SVG buatan, avatar monogram) kecuali video demo ERP AI yang sudah pakai rekaman asli Anda (dikompres 58MB → 1.4MB)
- `git init` lokal sudah jalan (branch `main`), belum push ke GitHub (menunggu konfirmasi Anda)
- Build produksi (`bun run build`) sukses, `dist/` total 2.1MB untuk 4 halaman

**Belum:**
- Isi checklist §8 dengan aset asli
- Push ke GitHub + connect Vercel (dibahas kapan Anda siap)
- Domain custom (opsional)

---

Langkah berikutnya: isi checklist §8 dengan aset asli, lalu push ke GitHub & connect Vercel.
