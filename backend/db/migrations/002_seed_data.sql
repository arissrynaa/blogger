-- Migration: 002_seed_data
-- Description: Insert default admin user and sample categories/tags
-- Direction: UP

-- Default admin user
-- Username: admin
-- Password: admin123
-- Hash generated via: node -e "console.log(require('bcrypt').hashSync('admin123', 10))"
-- VERIFIED: bcrypt.compareSync('admin123', hash) === true
-- IMPORTANT: Change this password after first login in production!
INSERT INTO users (id, username, password, role) VALUES
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'admin',
  '$2b$10$7ShzAI8gWa02H5Waa3AW9O1gWHZvZuHkFt4okqPDphn2Z9qMDE8Xe',
  'admin'
);

-- Sample categories
INSERT INTO categories (id, name, slug, description) VALUES
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'Technology', 'technology', 'Posts about technology and software engineering'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Personal', 'personal', 'Personal stories and reflections'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'Tutorial', 'tutorial', 'How-to guides and tutorials');

-- Sample tags
INSERT INTO tags (id, name, slug) VALUES
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'JavaScript', 'javascript'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a32', 'TypeScript', 'typescript'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'PostgreSQL', 'postgresql'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a34', 'Docker', 'docker'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a35', 'DevOps', 'devops');