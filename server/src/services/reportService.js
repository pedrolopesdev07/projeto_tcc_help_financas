import { calculateMonthlySummary, getMonthlyExpenses, calculateEmergencyReserve } from './transactionService.js';

function getCurrentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export async function buildMonthlyReport(usuarioId, month, year) {
  const target = month && year ? { month, year } : getCurrentMonthYear();
  const summary = await calculateMonthlySummary(usuarioId, target.month, target.year);
  const reservaEmergencia = await calculateEmergencyReserve(usuarioId);

  return {
    mes: target.month,
    ano: target.year,
    resumo: summary,
    reserva_emergencia: reservaEmergencia
  };
}

export async function buildSixMonthComparison(usuarioId) {
  const results = [];
  const now = new Date();

  for (let index = 0; index < 6; index += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const summary = await calculateMonthlySummary(usuarioId, month, year);

    results.push({
      mes: month,
      ano: year,
      totalReceita: summary.totalReceita,
      totalDespesa: summary.totalDespesa,
      saldo: summary.saldo
    });
  }

  return results.reverse();
}

export async function buildExportPayload(usuarioId) {
  const { month, year } = getCurrentMonthYear();
  const monthlySummary = await calculateMonthlySummary(usuarioId, month, year);
  const emergencyReserve = await calculateEmergencyReserve(usuarioId);

  return {
    titulo: 'Relatório Mensal Help Finanças',
    periodo: `${month}/${year}`,
    resumo: monthlySummary,
    reserva_emergencia: emergencyReserve,
    observacoes: 'Este payload está pronto para ser exportado como PDF em futuras implementações.'
  };
}
