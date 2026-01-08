// Hilfsfunktion: Montag der Woche für ein gegebenes Datum finden
const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  // Sonntag (0) wird zu 7, damit wir korrekt zum Montag zurückrechnen
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Hilfsfunktion: Sonntag der Woche für ein gegebenes Datum finden
const getSunday = (date: Date): Date => {
  const monday = getMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
};

export const getWeeksInMonth = (year: number, month: number) => {
  const weeks: { start: Date; end: Date; weekNumber: number }[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0, 23, 59, 59, 999);

  // Starte mit dem Montag der Woche, in der der 1. des Monats liegt
  let currentMonday = getMonday(firstDay);
  let weekNumber = 1;

  while (currentMonday <= lastDay) {
    const weekStart = new Date(currentMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = getSunday(currentMonday);

    weeks.push({
      start: weekStart,
      end: weekEnd,
      weekNumber: weekNumber++
    });

    // Zur nächsten Woche (nächster Montag)
    currentMonday.setDate(currentMonday.getDate() + 7);
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
