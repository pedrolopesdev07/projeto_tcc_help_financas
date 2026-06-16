export function formatCurrencyBRL(value) {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numeric);
}

export function formatDateBR(date) {
  const parsed = new Date(date);
  return parsed.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo'
  });
}

export function parsePositiveNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('O valor precisa ser numérico e maior que zero.');
  }
  return parsed;
}
