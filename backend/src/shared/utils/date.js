export const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getPeriods = (period, customStart, customEnd) => {
  const today = new Date();
  let start, end, prevStart, prevEnd;

  if (period === 'custom') {
    if (!customStart || !customEnd) {
      throw new Error('Custom period requires startDate and endDate');
    }
    start = customStart;
    end = customEnd;
    
    const sDate = new Date(start);
    const eDate = new Date(end);
    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
      throw new Error('Invalid dates provided');
    }
    if (sDate > eDate) {
      throw new Error('Start date cannot be after end date');
    }

    const diffTime = Math.abs(eDate - sDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const pStart = new Date(sDate);
    pStart.setDate(pStart.getDate() - diffDays);
    const pEnd = new Date(sDate);
    pEnd.setDate(pEnd.getDate() - 1);
    
    prevStart = formatDate(pStart);
    prevEnd = formatDate(pEnd);
  } else if (period === 'previous-month') {
    const currentMonthFirst = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const pStart = new Date(currentMonthFirst);
    pStart.setMonth(pStart.getMonth() - 1);
    const pEnd = new Date(currentMonthFirst);
    pEnd.setDate(pEnd.getDate() - 1);
    
    start = formatDate(pStart);
    end = formatDate(pEnd);
    
    const ppStart = new Date(pStart);
    ppStart.setMonth(ppStart.getMonth() - 1);
    const ppEnd = new Date(pStart);
    ppEnd.setDate(ppEnd.getDate() - 1);
    
    prevStart = formatDate(ppStart);
    prevEnd = formatDate(ppEnd);
  } else if (period === 'last-3-months') {
    const pStart = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    start = formatDate(pStart);
    end = formatDate(today);
    
    const ppStart = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    const ppEnd = new Date(pStart);
    ppEnd.setDate(ppEnd.getDate() - 1);
    
    prevStart = formatDate(ppStart);
    prevEnd = formatDate(ppEnd);
  } else if (period === 'last-6-months') {
    const pStart = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    start = formatDate(pStart);
    end = formatDate(today);
    
    const ppStart = new Date(today.getFullYear(), today.getMonth() - 12, 1);
    const ppEnd = new Date(pStart);
    ppEnd.setDate(ppEnd.getDate() - 1);
    
    prevStart = formatDate(ppStart);
    prevEnd = formatDate(ppEnd);
  } else if (period === 'last-12-months') {
    const pStart = new Date(today.getFullYear() - 1, today.getMonth(), 1);
    start = formatDate(pStart);
    end = formatDate(today);
    
    const ppStart = new Date(today.getFullYear() - 2, today.getMonth(), 1);
    const ppEnd = new Date(pStart);
    ppEnd.setDate(ppEnd.getDate() - 1);
    
    prevStart = formatDate(ppStart);
    prevEnd = formatDate(ppEnd);
  } else {
    const pStart = new Date(today.getFullYear(), today.getMonth(), 1);
    start = formatDate(pStart);
    end = formatDate(today);
    
    const ppStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const ppEnd = new Date(pStart);
    ppEnd.setDate(ppEnd.getDate() - 1);
    
    prevStart = formatDate(ppStart);
    prevEnd = formatDate(ppEnd);
  }

  return {
    current: { start, end },
    previous: { start: prevStart, end: prevEnd }
  };
};

export const getThreePeriods = (period, customStart, customEnd) => {
  const today = new Date();
  let start, end, prevStart, prevEnd, prePrevStart, prePrevEnd;

  if (period === 'custom') {
    if (!customStart || !customEnd) {
      throw new Error('Custom period requires startDate and endDate');
    }
    start = customStart;
    end = customEnd;
    
    const sDate = new Date(start);
    const eDate = new Date(end);
    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
      throw new Error('Invalid dates provided');
    }
    if (sDate > eDate) {
      throw new Error('Start date cannot be after end date');
    }

    const diffTime = Math.abs(eDate - sDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const pStart = new Date(sDate);
    pStart.setDate(pStart.getDate() - diffDays);
    const pEnd = new Date(sDate);
    pEnd.setDate(pEnd.getDate() - 1);
    
    prevStart = formatDate(pStart);
    prevEnd = formatDate(pEnd);

    const ppStart = new Date(pStart);
    ppStart.setDate(ppStart.getDate() - diffDays);
    const ppEnd = new Date(pStart);
    ppEnd.setDate(ppEnd.getDate() - 1);

    prePrevStart = formatDate(ppStart);
    prePrevEnd = formatDate(ppEnd);
  } else if (period === 'previous-month') {
    const currentMonthFirst = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const pStart = new Date(currentMonthFirst);
    pStart.setMonth(pStart.getMonth() - 1);
    const pEnd = new Date(currentMonthFirst);
    pEnd.setDate(pEnd.getDate() - 1);
    
    start = formatDate(pStart);
    end = formatDate(pEnd);
    
    const ppStart = new Date(pStart);
    ppStart.setMonth(ppStart.getMonth() - 1);
    const ppEnd = new Date(pStart);
    ppEnd.setDate(ppEnd.getDate() - 1);
    
    prevStart = formatDate(ppStart);
    prevEnd = formatDate(ppEnd);

    const pppStart = new Date(ppStart);
    pppStart.setMonth(pppStart.getMonth() - 1);
    const pppEnd = new Date(ppStart);
    pppEnd.setDate(pppEnd.getDate() - 1);

    prePrevStart = formatDate(pppStart);
    prePrevEnd = formatDate(pppEnd);
  } else if (period === 'last-3-months') {
    const pStart = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    start = formatDate(pStart);
    end = formatDate(today);
    
    const ppStart = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    const ppEnd = new Date(pStart);
    ppEnd.setDate(ppEnd.getDate() - 1);
    
    prevStart = formatDate(ppStart);
    prevEnd = formatDate(ppEnd);

    const pppStart = new Date(today.getFullYear(), today.getMonth() - 9, 1);
    const pppEnd = new Date(ppStart);
    pppEnd.setDate(pppEnd.getDate() - 1);

    prePrevStart = formatDate(pppStart);
    prePrevEnd = formatDate(pppEnd);
  } else if (period === 'last-6-months') {
    const pStart = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    start = formatDate(pStart);
    end = formatDate(today);
    
    const ppStart = new Date(today.getFullYear(), today.getMonth() - 12, 1);
    const ppEnd = new Date(pStart);
    ppEnd.setDate(ppEnd.getDate() - 1);
    
    prevStart = formatDate(ppStart);
    prevEnd = formatDate(ppEnd);

    const pppStart = new Date(today.getFullYear(), today.getMonth() - 18, 1);
    const pppEnd = new Date(pppStart);
    pppEnd.setDate(pppEnd.getDate() - 1);

    prePrevStart = formatDate(pppStart);
    prePrevEnd = formatDate(pppEnd);
  } else if (period === 'last-12-months') {
    const pStart = new Date(today.getFullYear() - 1, today.getMonth(), 1);
    start = formatDate(pStart);
    end = formatDate(today);
    
    const ppStart = new Date(today.getFullYear() - 2, today.getMonth(), 1);
    const ppEnd = new Date(pStart);
    ppEnd.setDate(ppEnd.getDate() - 1);
    
    prevStart = formatDate(ppStart);
    prevEnd = formatDate(ppEnd);

    const pppStart = new Date(today.getFullYear() - 3, today.getMonth(), 1);
    const pppEnd = new Date(pppStart);
    pppEnd.setDate(pppEnd.getDate() - 1);

    prePrevStart = formatDate(pppStart);
    prePrevEnd = formatDate(pppEnd);
  } else {
    const pStart = new Date(today.getFullYear(), today.getMonth(), 1);
    start = formatDate(pStart);
    end = formatDate(today);
    
    const ppStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const ppEnd = new Date(pStart);
    ppEnd.setDate(ppEnd.getDate() - 1);
    
    prevStart = formatDate(ppStart);
    prevEnd = formatDate(ppEnd);

    const pppStart = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    const pppEnd = new Date(pppStart);
    pppEnd.setDate(pppEnd.getDate() - 1);

    prePrevStart = formatDate(pppStart);
    prePrevEnd = formatDate(pppEnd);
  }

  return {
    current: { start, end },
    previous: { start: prevStart, end: prevEnd },
    prePrevious: { start: prePrevStart, end: prePrevEnd }
  };
};
