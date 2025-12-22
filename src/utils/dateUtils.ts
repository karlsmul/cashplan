export const getWeeksInMonth = (year: number, month: number) => {
  const weeks: { start: Date; end: Date; weekNumber: number }[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0, 23, 59, 59, 999);

  let weekNumber = 1;
  let currentDate = new Date(firstDay);

  while (currentDate <= lastDay) {
    const weekStart = new Date(currentDate);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    if (weekEnd > lastDay) {
      weekEnd.setTime(lastDay.getTime());
    }

    weeks.push({
      start: weekStart,
      end: weekEnd,
      weekNumber: weekNumber++
    });

    currentDate.setDate(currentDate.getDate() + 7);
  }

  return weeks;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const getMonthName = (month: number): string => {
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  return months[month];
};

export const isInWeek = (date: Date, weekStart: Date, weekEnd: Date): boolean => {
  const dateTime = date.getTime();
  const startTime = weekStart.getTime();
  const endTime = weekEnd.getTime();
  return dateTime >= startTime && dateTime <= endTime;
};

export const calculateTrend = (expenses: number[], daysElapsed: number, totalDaysInMonth: number): number => {
  if (expenses.length === 0 || daysElapsed === 0) return 0;

  const averagePerDay = expenses.reduce((sum, exp) => sum + exp, 0) / daysElapsed;
  return averagePerDay * totalDaysInMonth;
};
