import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import prisma from '../models/prismaClient.js';
import { isLoginBlocked, recordLoginAttempt } from '../middlewares/rateLimiter.js';

dotenv.config();

const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN
} = process.env;

if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets não estão definidos no .env');
}

function generateAccessToken(userId) {
  return jwt.sign({ userId }, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN || '24h'
  });
}

function generateRefreshToken(userId) {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN || '24h'
  });
}

export async function register(req, res) {
  const { nome, email, senha, renda_mensal } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
  }

  const existing = await prisma.usuarios.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Email já registrado.' });
  }

  const senha_hash = await bcrypt.hash(senha, 12);
  const user = await prisma.usuarios.create({
    data: {
      nome,
      email,
      senha_hash,
      renda_mensal: renda_mensal ? Number(renda_mensal) : undefined
    }
  });

  return res.status(201).json({
    id: user.id,
    nome: user.nome,
    email: user.email,
    renda_mensal: user.renda_mensal,
    estrategia_financeira: user.estrategia_financeira,
    onboarding_concluido: user.onboarding_concluido
  });
}

export async function login(req, res) {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  const user = await prisma.usuarios.findUnique({ where: { email } });
  const passwordMatches = user ? await bcrypt.compare(senha, user.senha_hash) : false;

  if (isLoginBlocked(req) && !passwordMatches) {
    return res.status(429).json({ error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' });
  }

  if (!user || !passwordMatches) {
    recordLoginAttempt(req, false);
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  recordLoginAttempt(req, true);

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  await prisma.refresh_tokens.create({
    data: {
      usuario_id: user.id,
      token: refreshToken,
      expires_em: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });

  return res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      onboarding_concluido: user.onboarding_concluido
    }
  });
}

export async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token é obrigatório.' });
  }

  const storedToken = await prisma.refresh_tokens.findUnique({ where: { token: refreshToken } });
  if (!storedToken) {
    return res.status(401).json({ error: 'Refresh token inválido.' });
  }

  if (new Date(storedToken.expires_em) < new Date()) {
    await prisma.refresh_tokens.delete({ where: { id: storedToken.id } });
    return res.status(401).json({ error: 'Refresh token expirado.' });
  }

  try {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const userId = payload.userId;
    const accessToken = generateAccessToken(userId);
    const newRefreshToken = generateRefreshToken(userId);

    await prisma.refresh_tokens.update({
      where: { id: storedToken.id },
      data: {
        token: newRefreshToken,
        expires_em: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    return res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    return res.status(401).json({ error: 'Refresh token expirado ou inválido.' });
  }
}

export async function logout(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token é obrigatório para logout.' });
  }

  await prisma.refresh_tokens.deleteMany({ where: { token: refreshToken } });
  return res.status(204).send();
}
