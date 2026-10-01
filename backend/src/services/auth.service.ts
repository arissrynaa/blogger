import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import type { JwtPayload } from '../types/index.js';

// C1: login uses username/password per schema (not email)
export async function login(username: string, password: string): Promise<{ token: string; user: { id: string; username: string; role: string } }> {
  const result = await pool.query('SELECT id, username, password, role FROM users WHERE username = $1', [username]);
  if (result.rows.length === 0) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid username or password');
  }

  const user = result.rows[0];
  // C1: column is 'password' not 'password_hash'
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid username or password');
  }

  // C7: payload shape aligns with contract
  const payload: JwtPayload = { userId: user.id, username: user.username, role: user.role };
  const token = jwt.sign(payload, env.jwtSecret, { expiresIn: '24h' });

  return {
    token,
    user: { id: user.id, username: user.username, role: user.role },
  };
}

// C7: getMe returns {id, username, role}
export async function getMe(userId: string) {
  const result = await pool.query('SELECT id, username, role, created_at FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'User not found');
  }
  return result.rows[0];
}