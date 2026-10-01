# Architecture — Personal Blog (arissrynaa/blogger)

> Dokumen arsitektur project. Sumber kebenaran struktural untuk seluruh tim.
> Ditulis oleh **Leader/Architect** — Phase 1.

## Status
- **Phase aktif:** 1 (Foundation & Architecture)
- **Repository (single source of truth):** `https://github.com/arissrynaa/blogger`

## Catatan penting repository
- Repo `arissrynaa/blogger` adalah repo project ini, dibuat hari ini dan **kosong**
  (tidak berisi API Blogger / OAuth / publishing system apapun).
- Project ini **bukan** Blogger/Google Blogger. **Dilarang** menggunakan Blogger API,
  Blogger OAuth, atau Blogger publishing workflow.
- Folder lama `blog-article-wf001` (workflow riset→draft→SEO blog lama) **bukan** bagian
  project ini; hanya artefak riset di workspace, tidak dipakai.

## Komponen & alur
```
Browser (mobile-first, clean dark editorial)
        │  HTTPS
        ▼
React (Vite) + TypeScript  ── /frontend
        │  REST JSON (lihat /docs/api.md)
        ▼
Node.js + Express + TypeScript  ── /backend
        │  parameterized queries
        ▼
PostgreSQL (Docker)  ── /backend/db (DB DevOps)
```

## Tech stack
| Layer | Teknologi |
| --- | --- |
| Frontend | React 18, Vite, TypeScript, React Router, TanStack Query, TailwindCSS (dark modern theme) |
| Backend | Node.js, Express, TypeScript, Zod (validasi), jsonwebtoken (JWT), bcrypt/argon2 (hash password) |
| Database | PostgreSQL 16 (via Docker) + node-pg + node-pg-migrate |
| Infra | Docker / docker-compose, .env.example, healthcheck |
| Test | Vitest (unit), Supertest (integration), Testing Library (frontend) |
| Tooling | ESLint, Prettier, TypeScript strict |

## Prinsip
- **Layering:** Frontend ⇄ REST API ⇄ Backend ⇄ DB. Business logic di service layer,
  bukan di route/controller.
- **Kontrak-first:** semua bentuk request/response/error mengikuti `/docs/api.md`.
- **Mobile-first**, responsif desktop & mobile.
- **Minimal dependencies** — hindari package tak perlu; hindari client-side JS yang tak perlu.
- **Security-first:** validasi di gerbang, error handler terpusat, JWT + role check,
  rate limiting, secure headers, secret di .env (tidak di-commit).
- **SEO:** clean slug URL, title/meta/canonical/OG, sitemap.xml, robots.txt, structured data.

## Status konten
- `draft` dan `published` (minimum). Detail di /docs/api.md dan schema DB.

## Owner folder
| Folder | Pemilik |
| --- | --- |
| `/docs` | Leader |
| `/frontend` | Frontend Dev |
| `/backend` | Backend Dev |
| `/backend/db` (schema/migrasi/docker/env) | DB DevOps |
| test & review | QA Reviewer |

## Keputusan arsitektur (ADR ringkas)
1. **Repo** `arissrynaa/blogger` dipakai apa adanya (kosong) — tidak membuat repo baru
   karena project repo sudah tersedia & eksplisit diminta memakainya.
2. **Auth admin:** JWT akses + refresh (opsional v1: akses token saja), role `admin`.
   Endpoint admin dilindungi middleware `requireAuth` + `requireRole('admin')`.
3. **Data:** String slug ID untuk publik; UUID internal untuk admin mutasi.
4. **Search:** backend query `ILIKE` pada title/excerpt/content (validasi & escape).
5. **Images:** featured image disimpan sebagai URL string; optimasi via fasilitas CDN/serving
   (tidak men-upload binary di v1 — backend menerima URL).
