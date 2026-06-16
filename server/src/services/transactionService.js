import prisma from '../models/prismaClient.js';

function getMonthRange(month, year) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

export async function calculateMonthlySummary(usuarioId, month, year) {
  const { start, end } = getMonthRange(month, year);

  const receita = await prisma.transacoes.aggregate({
    where: {
      usuario_id: usuarioId,
      tipo: 'receita',
      data: { gte: start, lt: end }
    },
    _sum: { valor: true }
  });

  const despesa = await prisma.transacoes.aggregate({
    where: {
      usuario_id: usuarioId,
      tipo: 'despesa',
      data: { gte: start, lt: end }
    },
    _sum: { valor: true }
  });

  const totalReceita = Number(receita._sum.valor ?? 0);
  const totalDespesa = Number(despesa._sum.valor ?? 0);
  const saldo = totalReceita - totalDespesa;

  return {
    mes: month,
    ano: year,
    totalReceita,
    totalDespesa,
    saldo
  };
}

export async function calculateEmergencyReserve(usuarioId) {
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const despesas = await prisma.transacoes.findMany({
    where: {
      usuario_id: usuarioId,
      tipo: 'despesa',
      data: { gte: sixMonthsAgo, lte: now }
    },
    select: { valor: true }
  });

  const total = despesas.reduce((acc, item) => acc + Number(item.valor), 0);
  const mediaMensal = total / 6;
  return Number((mediaMensal * 6).toFixed(2));
}

export async function getMonthlyExpenses(usuarioId, month, year) {
  const { start, end } = getMonthRange(month, year);
  const despesas = await prisma.transacoes.aggregate({
    where: {
      usuario_id: usuarioId,
      tipo: 'despesa',
      data: { gte: start, lt: end }
    },
    _sum: { valor: true }
  });
  return Number(despesas._sum.valor ?? 0);
}
