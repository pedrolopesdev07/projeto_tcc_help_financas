import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const { JWT_ACCESS_SECRET } = process.env;

if (!JWT_ACCESS_SECRET) {
  throw new Error('JWT_ACCESS_SECRET não está definido no .env');
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acesso ausente ou inválido.' });
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET);
    req.userId = payload.userId;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token de acesso expirado ou inválido.' });
  }
}
