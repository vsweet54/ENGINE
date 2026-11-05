# NEO AI — Vercel + Neon Model Catalog API

Backend starter untuk mengumpulkan **metadata publik** model AI dari OpenRouter, Hugging Face, dan GitHub. Dirancang untuk Vercel Functions + Neon PostgreSQL.

> Penting: katalog metadata bukan izin inference. Project ini tidak membypass autentikasi provider. Tanpa `INFERENCE_BASE_URL`, katalog tetap bisa digunakan, tetapi `/api/chat` mengembalikan HTTP 503.

## 1. Deploy database Neon

1. Buat project PostgreSQL di https://neon.tech
2. Salin connection string pooled dari Neon.
3. Buka SQL Editor Neon, jalankan seluruh isi `db/schema.sql`.

## 2. Deploy ke Vercel

1. Upload folder ini ke repository GitHub.
2. Import repository di https://vercel.com/new.
3. Framework preset: **Other**. Build command dan output directory boleh dikosongkan.
4. Tambahkan Environment Variables berikut pada Vercel:

| Variable | Wajib | Fungsi |
|---|---:|---|
| `DATABASE_URL` | Ya | Neon pooled connection string |
| `CRON_SECRET` | Ya | Proteksi cron sync |
| `ADMIN_SECRET` | Ya | Proteksi sync manual |
| `INFERENCE_BASE_URL` | Tidak | URL server OpenAI-compatible |
| `INFERENCE_API_KEY` | Tidak | Kredensial provider/server inference |
| `INFERENCE_DEFAULT_MODEL` | Tidak | Model default upstream |

Gunakan secret acak yang panjang dan berbeda untuk `CRON_SECRET` dan `ADMIN_SECRET`. Jangan pernah menaruh secret di frontend atau APK.

5. Deploy. Vercel akan membuat endpoint berdasarkan file di folder `api/`.

## 3. Endpoint

- `GET /api/health` — status API dan database.
- `GET /api/models?limit=50&offset=0` — daftar katalog.
- `GET /api/models?source=huggingface&q=llama` — filter sumber dan pencarian.
- `GET /api/model?id=openrouter:provider/model` — detail model.
- `POST /api/sync` — sinkronisasi manual, header `Authorization: Bearer ADMIN_SECRET`.
- `GET /api/cron/sync` — endpoint cron, header `Authorization: Bearer CRON_SECRET`.
- `POST /api/chat` — gateway chat ke upstream OpenAI-compatible yang kamu kelola.

Contoh request chat:

```json
{
  "model": "nama-model-di-upstream",
  "messages": [
    { "role": "user", "content": "Halo!" }
  ],
  "stream": false
}
```

## 4. Sinkronisasi katalog

`vercel.json` menjadwalkan sinkronisasi harian pukul 03:00 UTC. Cron Vercel mengirim `Authorization: Bearer <CRON_SECRET>`.

Kolektor saat ini:
- OpenRouter: daftar model publik.
- Hugging Face: daftar model text-generation populer.
- GitHub: repositori terkait LLM (ditandai `model_type=repository`, bukan endpoint inference).

Sumber publik dapat mengubah format, membatasi rate, atau gagal sementara. Setiap sumber diisolasi agar kegagalan satu sumber tidak menghentikan sumber lain.

## 5. Tentang “tanpa API key”

- Pengguna aplikasi tidak perlu memasukkan API key untuk melihat katalog.
- Metadata publik bisa dikumpulkan tanpa API key pada endpoint yang mengizinkannya.
- Menjalankan model di server provider adalah hal berbeda. Endpoint inference biasanya memerlukan akun, kuota, atau kredensial.
- Untuk chat tanpa provider key, jalankan model lokal (misalnya runtime OpenAI-compatible di perangkat/server milik sendiri) dan hubungkan client ke runtime itu. Runtime lokal di HP tidak otomatis dapat diakses oleh Vercel.
- Jangan membagikan satu kredensial provider secara tidak sah atau mengklaim semua model bisa digunakan gratis.

## 6. Catatan deployment

- Gunakan Neon pooled connection string untuk lingkungan serverless.
- Jangan menjalankan server `listen()` permanen pada Vercel Functions.
- Jangan menaruh file model besar di deployment Vercel. Gunakan runtime inference terpisah.
- Periksa Terms of Service, robots.txt, lisensi, dan rate limit sebelum menambahkan kolektor situs lain.
- Endpoint ini belum menyediakan autentikasi akun pengguna, billing, kuota chat, atau proteksi abuse. Tambahkan sebelum membuka chat publik.
