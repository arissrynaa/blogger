# API Contract — Personal Blog (arissrynaa/blogger)

> Ditulis oleh **Leader** SEBELUM coding. Frontend & Backend WAJIB mengikutinya.
> Semua perubahan kontrak harus melalui Leader & di-update di sini.

Base URL: `http://localhost:4000` (dev) — lihat `.env.example`.
Semua response **JSON**. Time format: `ISO 8601` (UTC, `2026-10-01T12:00:00.000Z`).

## Autentikasi / Authorization
- **Publik** (tanpa token): `GET /api/articles*`, `GET /api/categories*`, `GET /api/tags*`, `GET /api/search`, `GET /api/sitemap.xml`, `GET /robots.txt`.
- **Admin** (butuh `Authorization: Bearer <token>`): semua `POST/PATCH/DELETE` pada `/api/articles`, `/api/categories`, `/api/tags`, dan `POST /api/auth/login`, `GET /api/auth/me`.
- Login menghasilkan JWT dengan payload `{ userId, role: 'admin' }`. Hash password `bcrypt`/`argon2`.

## Format error standar (semua endpoint)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Artikel tidak valid",
    "details": { "title": "Wajib diisi" }
  }
}
```
Kode umum: `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL`.
Status: `200` `201` `204` `400` `401` `403` `404` `409` `422` `429` `500`.

---

## Tipe data bersama

### Article (publik)
```
id           string (uuid)       // internal
title        string
slug         string              // unique, url-safe
excerpt      string
content      string              // HTML/Markdown body
featuredImageUrl string | null
category     Category | null     // embedded
tags         Tag[]               // embedded
authorName   string
status       "draft" | "published"
publishedAt  string(ISO) | null
updatedAt    string(ISO)
createdAt    string(ISO)
```

### Category
```
id, name, slug, description | null, articlesCount? (hanya listing), createdAt, updatedAt
```

### Tag
```
id, name, slug, createdAt, updatedAt
```

### Success response pembungkus untuk listing
```json
{ "data": [...], "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 } }
```

---

## Public endpoints

### `GET /api/articles`
Query (semua opsional): `page` (default 1), `limit` (default 10, max 50), `category` (slug),
`tag` (slug), `status` (default `published` untuk publik).
Response: `{ data: Article[], meta }`. Hanya artikel `published` yang tampil di publik.

### `GET /api/articles/:slug`
Response: `{ data: Article }`. Single artikel `published`. → `404 NOT_FOUND` jika tidak ada / draft.

### `GET /api/categories`
Response: `{ data: Category[], meta }`. Termasuk `articlesCount`.

### `GET /api/categories/:slug`
Response: `{ data: { ...Category, articles: Article[] } }`.

### `GET /api/tags`
Response: `{ data: Tag[], meta }`.

### `GET /api/tags/:slug`
Response: `{ data: { ...Tag, articles: Article[] } }`.

### `GET /api/search?q=...&page=1&limit=10`
Cari di title/excerpt/content (published). Response `{ data: Article[], meta }`.
`q` wajib, min 2 karakter → `422 VALIDATION_ERROR` jika kosong.

### `GET /api/sitemap.xml`
Sitemap XML berisi URL publik artikel + kategori + tag + halaman statis (berdasar base URL env).

### `GET /robots.txt`
robots.txt berdasar base URL env.

---

## Admin endpoints (semua butuh token admin)

### `POST /api/auth/login`
Body: `{ "username": string, "password": string }`
Response `200`: `{ "data": { "token": string, "user": { "id": string, "username": string, "role": "admin" } } }`
Salah kredensial → `401 UNAUTHORIZED`.

### `GET /api/auth/me`
Response `200`: `{ "data": { "id": string, "username": string, "role": "admin" } }`.

### `POST /api/articles`
Body (validasi Zod):
```
title            string (wajib, 1..255)
slug             string (opsional, otomatis dari title jika kosong; url-safe, unique)
excerpt          string (opsional, max 500)
content          string (wajib)
featuredImageUrl string | null (opsional)
categoryId       string(uuid) | null (opsional, harus ada di DB → 404)
tagIds           string[] (opsional, semuanya harus ada di DB → 422)
status           "draft"|"published" (default "draft")
```
Response `201` `{ "data": Article }`. Slug duplikat → `409 CONFLICT`. CategoryId tidak ada → `404 NOT_FOUND`.

### `PATCH /api/articles/:id`
Body: sama dengan POST, semua opsional (partial update). Jika `slug` diubah → cek unique.
Response `200` `{ "data": Article }`. `id` tidak ada → `404 NOT_FOUND`.

### `DELETE /api/articles/:id`
Response `204 No Content`. Tidak ada → `404 NOT_FOUND`.

### `POST /api/categories`
Body: `{ name (wajib,1..100), slug (opsional), description (opsional) }`. Response `201`.
Slug duplikat → `409`.

### `PATCH /api/categories/:id`
Partial update. Response `200`.

### `DELETE /api/categories/:id`
Response `204`. Jika masih ada artikel → `409 CONFLICT`.

### `POST /api/tags` | `PATCH /api/tags/:id` | `DELETE /api/tags/:id`
Sama pola dengan categories. Response `201` / `200` / `204`.

---

## Pitfall / catatan implementasi
- Slug harus di-URL-encode saat dipakai di path.
- Query selalu parameterized (node-pg `$1`) — **dilarang** string concat SQL.
- Admin mutasi harus lewat `requireAuth` middleware → `401` tanpa token, `403` jika bukan admin.
- Rate limiting (mis. `express-rate-limit`) pada endpoint auth & publik yang sensitif.
- Jangan pernah log/mengembalikan password atau token mentah.
- `.env` tidak boleh di-commit; gunakan `.env.example`.
- Sitemap/robots memakai env `BASE_URL` (default `http://localhost:4000`).
