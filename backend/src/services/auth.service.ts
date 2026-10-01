import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import type { JwtPayload } from '../types/index.js';

export async function login(email: string, password: string): Promise<{ token: string; user: { id: string; email: string; name: string; role: string } }> {
  const result = await pool.query('SELECT id, email, name, password_hash, role FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
  const token = jwt.sign(payload, env.jwtSecret, { expiresIn: '24h' });

  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}

export async function getMe(userId: string) {
  const result = await pool.query('SELECT id, email, name, role, created_at FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'User not found');
  }
  return result.rows[0];
}