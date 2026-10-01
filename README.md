# Personal Blog — arissrynaa/blogger

Project full-stack personal blog milik bos gocep. Website sendiri (BUKAN Blogger / Google Blogger —
tanpa Blogger API/OAuth/publishing system).

## Stack
- **Frontend:** React (Vite) + TypeScript — dark modern editorial UI, mobile-first.
- **Backend:** Node.js/Express + TypeScript — REST API.
- **DB:** PostgreSQL (Docker).
- **Docs:** `/docs/architecture.md` (arsitektur), `/docs/api.md` (kontrak API).

## Struktur
```
blogger/
├── frontend/          <- React (Vite) + TS
├── backend/           <- Express + TS (db/ migrasi & docker ada di bawahnya)
├── docs/
│   ├── architecture.md
│   └── api.md         <- KONTRAK API (wajib sebelum coding)
└── README.md
```

## Kontak arsitektur
Leader / Architect memegang `/docs`. Kontrak API di `/docs/api.md` adalah sumber kebenaran
untuk Frontend & Backend — pergerakan/perubahan kontrak lewat Leader.
