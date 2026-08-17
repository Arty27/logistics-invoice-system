export function getIndianDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function getIndianDayRange(date = new Date()) {
  const dateKey = getIndianDateKey(date);

  const start = new Date(`${dateKey}T00:00:00+05:30`);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    dateKey,
    start,
    end,
  };
}
