import prisma from '../models/prismaClient.js';
import { parsePositiveNumber } from '../utils/format.js';

export async function listBudgets(req, res) {
  const filtros = { usuario_id: req.userId };
  if (req.query.mes) filtros.mes = Number(req.query.mes);
  if (req.query.ano) filtros.ano = Number(req.query.ano);
  const orcamentos = await prisma.orcamentos.findMany({ where: filtros, orderBy: [{ ano: 'desc' }, { mes: 'desc' }] });
  return res.json(orcamentos);
}

export async function createBudget(req, res) {
  const { mes, ano, estrategia, limite_essencial, limite_desejo, limite_prioridade, config_personalizada } = req.body;
  if (!mes || !ano || !estrategia || !limite_essencial || !limite_desejo || !limite_prioridade) {
    return res.status(400).json({ error: 'Mes, ano, estratégia e limites são obrigatórios.' });
  }

  const orcamento = await prisma.orcamentos.create({
    data: {
      usuario_id: req.userId,
      mes: Number(mes),
      ano: Number(ano),
      estrategia,
      limite_essencial: parsePositiveNumber(limite_essencial),
      limite_desejo: parsePositiveNumber(limite_desejo),
      limite_prioridade: parsePositiveNumber(limite_prioridade),
      config_personalizada: config_personalizada || null
    }
  });

  return res.status(201).json(orcamento);
}

export async function updateBudget(req, res) {
  const { id } = req.params;
  const { mes, ano, estrategia, limite_essencial, limite_desejo, limite_prioridade, config_personalizada } = req.body;

  const orcamento = await prisma.orcamentos.findFirst({ where: { id, usuario_id: req.userId } });
  if (!orcamento) {
    return res.status(404).json({ error: 'Orçamento não encontrado.' });
  }

  const updates = {};
  if (mes !== undefined) updates.mes = Number(mes);
  if (ano !== undefined) updates.ano = Number(ano);
  if (estrategia) updates.estrategia = estrategia;
  if (limite_essencial !== undefined) updates.limite_essencial = parsePositiveNumber(limite_essencial);
  if (limite_desejo !== undefined) updates.limite_desejo = parsePositiveNumber(limite_desejo);
  if (limite_prioridade !== undefined) updates.limite_prioridade = parsePositiveNumber(limite_prioridade);
  if (config_personalizada !== undefined) updates.config_personalizada = config_personalizada;

  const updated = await prisma.orcamentos.update({ where: { id }, data: updates });
  return res.json(updated);
}

export async function deleteBudget(req, res) {
  const { id } = req.params;
  const orcamento = await prisma.orcamentos.findFirst({ where: { id, usuario_id: req.userId } });
  if (!orcamento) {
    return res.status(404).json({ error: 'Orçamento não encontrado.' });
  }

  await prisma.orcamentos.delete({ where: { id } });
  return res.status(204).send();
}
