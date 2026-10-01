# Database Schema — Blogger Platform

## Overview
PostgreSQL 16 database for the personal blog platform. All IDs use UUID v4. Timestamps are TIMESTAMPTZ.

## Tables

### users
Admin accounts for the blog.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid_generate_v4() | Unique identifier |
| username | VARCHAR(100) | NOT NULL, UNIQUE | Admin username |
| password | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'admin', CHECK IN ('admin') | User role |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update time |

**Indexes:** `idx_users_username` on (username)

### categories
Article categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid_generate_v4() | Unique identifier |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Category display name |
| slug | VARCHAR(120) | NOT NULL, UNIQUE | URL-friendly identifier |
| description | TEXT | NULLABLE | Optional description |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update time |

**Indexes:** `idx_categories_slug` on (slug)

### tags
Article tags for fine-grained categorization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid_generate_v4() | Unique identifier |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Tag display name |
| slug | VARCHAR(120) | NOT NULL, UNIQUE | URL-friendly identifier |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update time |

**Indexes:** `idx_tags_slug` on (slug)

### articles
Blog posts/articles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid_generate_v4() | Unique identifier |
| title | VARCHAR(255) | NOT NULL | Article title |
| slug | VARCHAR(300) | NOT NULL, UNIQUE | URL-friendly identifier |
| content | TEXT | NOT NULL | Markdown content body |
| excerpt | TEXT | NULLABLE | Short summary |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'draft', CHECK IN ('draft','published') | Publication status |
| author_id | UUID | NOT NULL, FK -> users(id) ON DELETE CASCADE | Author reference |
| category_id | UUID | NULLABLE, FK -> categories(id) ON DELETE SET NULL | Category reference |
| published_at | TIMESTAMPTZ | NULLABLE | When published |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update time |

**Indexes:** `idx_articles_slug` on (slug), `idx_articles_status` on (status), `idx_articles_author_id` on (author_id), `idx_articles_category_id` on (category_id)

### article_tags
Many-to-many junction between articles and tags.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| article_id | UUID | PK, FK -> articles(id) ON DELETE CASCADE | Article reference |
| tag_id | UUID | PK, FK -> tags(id) ON DELETE CASCADE | Tag reference |

**Composite PK:** (article_id, tag_id)
**Indexes:** `idx_article_tags_tag_id` on (tag_id)

## Triggers
All tables with `updated_at` columns have a `BEFORE UPDATE` trigger (`update_updated_at_column()`) that automatically sets `updated_at = now()` on every row modification.

## Migrations
- `001_initial_schema.sql` / `001_initial_schema_down.sql` — Creates all tables, indexes, triggers
- `002_seed_data.sql` / `002_seed_data_down.sql` — Seeds default admin user + sample categories/tags

## Seed Data
- **Admin user:** username=`admin`, password hash is a bcrypt placeholder (backend must re-hash in production)
- **Categories:** Technology, Personal, Tutorial
- **Tags:** JavaScript, TypeScript, PostgreSQL, Docker, DevOps

</content>