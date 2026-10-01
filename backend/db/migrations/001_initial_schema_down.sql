-- Migration: 001_initial_schema (DOWN / ROLLBACK)
-- Description: Drop all core tables for blogger platform

DROP TRIGGER IF EXISTS trg_articles_updated ON articles;
DROP TRIGGER IF EXISTS trg_tags_updated ON tags;
DROP TRIGGER IF EXISTS trg_categories_updated ON categories;
DROP TRIGGER IF EXISTS trg_users_updated ON users;

DROP FUNCTION IF EXISTS update_updated_at_column();

DROP TABLE IF EXISTS article_tags;
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

DROP EXTENSION IF EXISTS "uuid-ossp";

</content>