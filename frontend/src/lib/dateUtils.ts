export function isLastDayOfMonth(date: Date): boolean {
  const test = new Date(date);
  const tomorrow = new Date(test);
  tomorrow.setDate(test.getDate() + 1);
  return test.getMonth() !== tomorrow.getMonth();
}

/**
 * Get current month string in format 'YYYY-MM'
 */
export function getCurrentMonthString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

