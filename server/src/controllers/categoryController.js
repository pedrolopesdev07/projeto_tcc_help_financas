import prisma from '../models/prismaClient.js';
import { parsePositiveNumber } from '../utils/format.js';

export async function listCategories(req, res) {
  const where = {
    OR: [
      { usuario_id: req.userId },
      { eh_padrao: true }
    ]
  };

  if (req.query.tipo) {
    where.tipo = req.query.tipo;
  }

  const categorias = await prisma.categorias.findMany({ where, orderBy: { nome: 'asc' } });
  return res.json(categorias);
}

export async function createCategory(req, res) {
  const { nome, tipo, grupo_estrategia, icone, cor } = req.body;
  if (!nome || !tipo) {
    return res.status(400).json({ error: 'Nome e tipo são obrigatórios.' });
  }
  if (!['receita', 'despesa'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo deve ser receita ou despesa.' });
  }

  const category = await prisma.categorias.create({
    data: {
      usuario_id: req.userId,
      nome,
      tipo,
      grupo_estrategia: grupo_estrategia || null,
      icone: icone || null,
      cor: cor || null,
      eh_padrao: false
    }
  });

  return res.status(201).json(category);
}

export async function updateCategory(req, res) {
  const { id } = req.params;
  const { nome, tipo, grupo_estrategia, icone, cor } = req.body;

  const category = await prisma.categorias.findUnique({ where: { id } });
  if (!category || category.usuario_id !== req.userId) {
    return res.status(404).json({ error: 'Categoria personalizada não encontrada.' });
  }

  const updates = {
    nome: nome || category.nome,
    tipo: tipo || category.tipo,
    grupo_estrategia: grupo_estrategia ?? category.grupo_estrategia,
    icone: icone ?? category.icone,
    cor: cor ?? category.cor
  };

  const updated = await prisma.categorias.update({ where: { id }, data: updates });
  return res.json(updated);
}

export async function deleteCategory(req, res) {
  const { id } = req.params;
  const category = await prisma.categorias.findUnique({ where: { id } });
  if (!category || category.usuario_id !== req.userId) {
    return res.status(404).json({ error: 'Categoria personalizada não encontrada.' });
  }

  await prisma.transacoes.updateMany({
    where: { categoria_id: id },
    data: { categoria_id: null }
  });

  await prisma.categorias.delete({ where: { id } });
  return res.status(204).send();
}
