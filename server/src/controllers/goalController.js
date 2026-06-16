import prisma from '../models/prismaClient.js';
import { parsePositiveNumber } from '../utils/format.js';

const MAX_GOAL_VALUE = 99999999.99;

function computeStatus(valor_atual, valor_total, status) {
  if (Number(valor_atual) >= Number(valor_total)) {
    return 'concluida';
  }
  return status || 'ativa';
}

export async function listGoals(req, res) {
  const filtros = { usuario_id: req.userId };
  if (req.query.status) filtros.status = req.query.status;
  const metas = await prisma.metas.findMany({ where: filtros, orderBy: { criado_em: 'desc' } });
  return res.json(metas);
}

export async function createGoal(req, res) {
  const { nome, tipo_meta, valor_total, valor_atual, data_limite } = req.body;
  if (!nome || !tipo_meta || !valor_total || !data_limite) {
    return res.status(400).json({ error: 'Nome, tipo de meta, valor total e data limite são obrigatórios.' });
  }

  const total = parsePositiveNumber(valor_total);
  const atual = valor_atual !== undefined ? Number(valor_atual) : 0;
  const deadline = new Date(data_limite);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (total > MAX_GOAL_VALUE) {
    return res.status(400).json({ error: 'Valor total da meta não pode ultrapassar R$ 99.999.999,99.' });
  }

  if (deadline < today) {
    return res.status(400).json({ error: 'A data limite precisa ser futura.' });
  }

  const meta = await prisma.metas.create({
    data: {
      usuario_id: req.userId,
      nome,
      tipo_meta,
      valor_total: total,
      valor_atual: atual,
      data_limite: deadline,
      status: computeStatus(atual, total, 'ativa')
    }
  });

  return res.status(201).json(meta);
}

export async function updateGoal(req, res) {
  const { id } = req.params;
  const { nome, tipo_meta, valor_total, valor_atual, data_limite, status } = req.body;

  const meta = await prisma.metas.findFirst({ where: { id, usuario_id: req.userId } });
  if (!meta) {
    return res.status(404).json({ error: 'Meta não encontrada.' });
  }

  const updates = {};
  if (nome) updates.nome = nome;
  if (tipo_meta) updates.tipo_meta = tipo_meta;
  if (valor_total !== undefined) {
    const total = parsePositiveNumber(valor_total);
    if (total > MAX_GOAL_VALUE) {
      return res.status(400).json({ error: 'Valor total da meta não pode ultrapassar R$ 99.999.999,99.' });
    }
    updates.valor_total = total;
  }
  if (valor_atual !== undefined) {
    const atual = Number(valor_atual);
    if (atual < 0) {
      return res.status(400).json({ error: 'Valor atual não pode ser negativo.' });
    }
    updates.valor_atual = atual;
  }
  if (data_limite) {
    const deadline = new Date(data_limite);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadline < today) {
      return res.status(400).json({ error: 'A data limite precisa ser futura.' });
    }
    updates.data_limite = deadline;
  }
  if (status) updates.status = status;

  const updatedMeta = await prisma.metas.update({ where: { id }, data: updates });
  const finalStatus = computeStatus(updatedMeta.valor_atual, updatedMeta.valor_total, updatedMeta.status);

  if (finalStatus !== updatedMeta.status) {
    return res.json(
      await prisma.metas.update({ where: { id }, data: { status: finalStatus } })
    );
  }

  return res.json(updatedMeta);
}

export async function deleteGoal(req, res) {
  const { id } = req.params;
  const meta = await prisma.metas.findFirst({ where: { id, usuario_id: req.userId } });
  if (!meta) {
    return res.status(404).json({ error: 'Meta não encontrada.' });
  }

  await prisma.metas.delete({ where: { id } });
  return res.status(204).send();
}
