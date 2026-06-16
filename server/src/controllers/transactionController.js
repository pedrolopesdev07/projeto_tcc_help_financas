import prisma from '../models/prismaClient.js';
import { parsePositiveNumber } from '../utils/format.js';
import { calculateMonthlySummary } from '../services/transactionService.js';

const RECURRENCE_DB_MAP = {
  unica: 'nenhuma',
  semanal: 'semanal',
  mensal: 'mensal',
  nenhuma: 'nenhuma'
};

const CATEGORY_KEY_MAP = {
  alimentacao: { nome: 'Alimentação', tipo: 'despesa', grupo_estrategia: 'essencial' },
  moradia: { nome: 'Moradia', tipo: 'despesa', grupo_estrategia: 'essencial' },
  transporte: { nome: 'Transporte', tipo: 'despesa', grupo_estrategia: 'essencial' },
  lazer: { nome: 'Lazer', tipo: 'despesa', grupo_estrategia: 'desejo' },
  compras: { nome: 'Compras', tipo: 'despesa', grupo_estrategia: 'desejo' },
  energia: { nome: 'Energia/Água', tipo: 'despesa', grupo_estrategia: 'essencial' },
  celular: { nome: 'Celular/Internet', tipo: 'despesa', grupo_estrategia: 'essencial' },
  outros: { nome: 'Outros', tipo: 'despesa', grupo_estrategia: 'prioridade' },
  salario: { nome: 'Salário', tipo: 'receita' },
  freelance: { nome: 'Freelance', tipo: 'receita' },
  investimento: { nome: 'Investimento', tipo: 'receita' },
};

async function resolveCategoryId(usuarioId, categoria_id, categoria_key, tipo) {
  if (categoria_id) {
    return categoria_id;
  }

  if (!categoria_key) {
    return null;
  }

  const mapped = CATEGORY_KEY_MAP[categoria_key];
  let where = null;
  if (mapped) {
    where = {
      usuario_id: usuarioId,
      nome: mapped.nome,
      tipo: mapped.tipo,
    };
  } else {
    where = {
      usuario_id: usuarioId,
      nome: categoria_key,
      tipo,
    };
  }

  let category = await prisma.categorias.findFirst({ where });
  if (!category) {
    category = await prisma.categorias.create({
      data: {
        usuario_id: usuarioId,
        nome: mapped?.nome ?? categoria_key,
        tipo: mapped?.tipo ?? tipo,
        grupo_estrategia: mapped?.grupo_estrategia ?? null,
        icone: null,
        cor: null,
        eh_padrao: false,
      }
    });
  }

  return category.id;
}

function parseMonthYear(queryMonth, queryYear) {
  const now = new Date();
  const month = queryMonth ? Number(queryMonth) : now.getMonth() + 1;
  const year = queryYear ? Number(queryYear) : now.getFullYear();
  return { month, year };
}

export async function listTransactions(req, res) {
  const { month, year } = parseMonthYear(req.query.month, req.query.year);
  const filters = {
    usuario_id: req.userId,
    data: {
      gte: new Date(Date.UTC(year, month - 1, 1)),
      lt: new Date(Date.UTC(year, month, 1))
    }
  };

  if (req.query.tipo) filters.tipo = req.query.tipo;
  if (req.query.categoria_id) filters.categoria_id = req.query.categoria_id;

  const transacoes = await prisma.transacoes.findMany({
    where: filters,
    orderBy: { data: 'desc' },
    include: { categoria: true }
  });

  return res.json(transacoes);
}

function normalizeRecurrence(value) {
  if (!value) return 'nenhuma';
  if (Object.prototype.hasOwnProperty.call(RECURRENCE_DB_MAP, value)) {
    return RECURRENCE_DB_MAP[value];
  }
  return null;
}

function mapRecurrenceToClient(value) {
  return value === 'nenhuma' ? 'unica' : value;
}

export async function createTransaction(req, res) {
  const { tipo, valor, descricao, data, categoria_id, categoria_key, recorrencia } = req.body;
  const numericValor = parsePositiveNumber(valor);
  const normalizedRecurrence = normalizeRecurrence(recorrencia);

  if (!['receita', 'despesa'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo deve ser receita ou despesa.' });
  }

  if (normalizedRecurrence === null) {
    return res.status(400).json({ error: 'Recorrência inválida.' });
  }

  const resolvedCategoriaId = await resolveCategoryId(req.userId, categoria_id, categoria_key, tipo);

  const created = await prisma.transacoes.create({
    data: {
      usuario_id: req.userId,
      tipo,
      valor: numericValor,
      descricao,
      data: new Date(data),
      categoria_id: resolvedCategoriaId,
      recorrencia: normalizedRecurrence
    },
    include: { categoria: true }
  });

  const summary = await calculateMonthlySummary(req.userId, new Date(data).getMonth() + 1, new Date(data).getFullYear());
  return res.status(201).json({ transacao: { ...created, recorrencia: mapRecurrenceToClient(created.recorrencia) }, resumo: summary });
}

export async function updateTransaction(req, res) {
  const { id } = req.params;
  const { tipo, valor, descricao, data, categoria_id, categoria_key, recorrencia } = req.body;

  const transaction = await prisma.transacoes.findFirst({ where: { id, usuario_id: req.userId } });
  if (!transaction) {
    return res.status(404).json({ error: 'Transação não encontrada.' });
  }

  const updates = {};
  if (tipo) {
    if (!['receita', 'despesa'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo deve ser receita ou despesa.' });
    }
    updates.tipo = tipo;
  }
  if (valor !== undefined) updates.valor = parsePositiveNumber(valor);
  if (descricao !== undefined) updates.descricao = descricao;
  if (data) updates.data = new Date(data);
  if (categoria_id !== undefined || categoria_key !== undefined) {
    updates.categoria_id = await resolveCategoryId(req.userId, categoria_id, categoria_key, tipo || transaction.tipo);
  }
  if (recorrencia !== undefined) {
    const normalizedRecurrence = normalizeRecurrence(recorrencia);
    if (normalizedRecurrence === null) {
      return res.status(400).json({ error: 'Recorrência inválida.' });
    }
    updates.recorrencia = normalizedRecurrence;
  }

  const updated = await prisma.transacoes.update({ where: { id }, data: updates, include: { categoria: true } });
  return res.json({ ...updated, recorrencia: mapRecurrenceToClient(updated.recorrencia) });
}

export async function deleteTransaction(req, res) {
  const { id } = req.params;
  const transaction = await prisma.transacoes.findFirst({ where: { id, usuario_id: req.userId } });
  if (!transaction) {
    return res.status(404).json({ error: 'Transação não encontrada.' });
  }

  await prisma.transacoes.delete({ where: { id } });
  return res.status(204).send();
}

export async function getSummary(req, res) {
  const { month, year } = parseMonthYear(req.query.month, req.query.year);
  const summary = await calculateMonthlySummary(req.userId, month, year);
  return res.json(summary);
}
