-- Migration: 002_seed_data (DOWN / ROLLBACK)
-- Description: Remove seeded data

DELETE FROM article_tags;
DELETE FROM tags WHERE id IN (
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a32',
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a34',
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a35'
);
DELETE FROM categories WHERE id IN (
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23'
);
DELETE FROM users WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

</content>