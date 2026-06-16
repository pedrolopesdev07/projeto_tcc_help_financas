import { buildMonthlyReport, buildSixMonthComparison, buildExportPayload } from '../services/reportService.js';

export async function monthlyReport(req, res) {
  const month = req.query.month ? Number(req.query.month) : undefined;
  const year = req.query.year ? Number(req.query.year) : undefined;
  const report = await buildMonthlyReport(req.userId, month, year);
  return res.json(report);
}

export async function compareReport(req, res) {
  const comparison = await buildSixMonthComparison(req.userId);
  return res.json(comparison);
}

export async function exportReport(req, res) {
  const payload = await buildExportPayload(req.userId);
  return res.json({ message: 'Estrutura pronta para exportação de PDF.', payload });
}
