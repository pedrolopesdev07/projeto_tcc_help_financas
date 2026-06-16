import bcrypt from 'bcryptjs';
import prisma from '../models/prismaClient.js';

export async function getMe(req, res) {
  const user = await prisma.usuarios.findUnique({
    where: { id: req.userId },
    include: { perfis_financeiros: true }
  });

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const { senha_hash, ...safeUser } = user;
  return res.json(safeUser);
}

export async function updateMe(req, res) {
  const { nome, email, senha, renda_mensal, estrategia_financeira, config_estrategia } = req.body;
  const updates = {};

  if (nome) updates.nome = nome;
  if (email) updates.email = email;
  if (renda_mensal !== undefined) updates.renda_mensal = Number(renda_mensal);
  if (estrategia_financeira) updates.estrategia_financeira = estrategia_financeira;
  if (senha) {
    if (senha.length < 6) {
      return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres.' });
    }
    updates.senha_hash = await bcrypt.hash(senha, 10);
  }

  if (email) {
    const existing = await prisma.usuarios.findUnique({ where: { email } });
    if (existing && existing.id !== req.userId) {
      return res.status(409).json({ error: 'Email já em uso por outro usuário.' });
    }
  }

  if (config_estrategia !== undefined) {
    await prisma.perfis_financeiros.upsert({
      where: { usuario_id: req.userId },
      create: {
        usuario_id: req.userId,
        objetivo_principal: 'reserve',
        perfil_consumidor: 'balanced',
        dependentes: 0,
        config_estrategia
      },
      update: {
        config_estrategia
      }
    });
  }

  const user = await prisma.usuarios.update({
    where: { id: req.userId },
    data: updates,
    include: { perfis_financeiros: true }
  });

  const { senha_hash, ...safeUser } = user;
  return res.json(safeUser);
}

export async function deleteMe(req, res) {
  await prisma.usuarios.delete({ where: { id: req.userId } });
  return res.status(204).send();
}

export async function onboarding(req, res) {
  const { objetivo_principal, perfil_consumidor, dependentes, config_estrategia } = req.body;

  if (!objetivo_principal || !perfil_consumidor || dependentes === undefined) {
    return res.status(400).json({ error: 'Objetivo principal, perfil consumidor e dependentes são obrigatórios.' });
  }

  const profile = await prisma.perfis_financeiros.upsert({
    where: { usuario_id: req.userId },
    update: {
      objetivo_principal,
      perfil_consumidor,
      dependentes: Number(dependentes),
      config_estrategia: config_estrategia || null
    },
    create: {
      usuario_id: req.userId,
      objetivo_principal,
      perfil_consumidor,
      dependentes: Number(dependentes),
      config_estrategia: config_estrategia || null
    }
  });

  await prisma.usuarios.update({
    where: { id: req.userId },
    data: { onboarding_concluido: true }
  });

  return res.json(profile);
}
