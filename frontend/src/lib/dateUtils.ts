export function isLastDayOfMonth(date: Date): boolean {
  const test = new Date(date);
  const tomorrow = new Date(test);
  tomorrow.setDate(test.getDate() + 1);
  return test.getMonth() !== tomorrow.getMonth();
}

