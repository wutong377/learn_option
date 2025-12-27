
import { addDays, isWeekend, differenceInCalendarDays, parseISO, format } from 'date-fns';

// Simple holiday list for 2025-2026 (Jan 1)
// In a real app, this would be a comprehensive configuration
const HOLIDAYS = [
    '2025-01-01',
    '2025-12-25', // Christmas (Optional, but common in finance)
    '2026-01-01',
    // Chinese New Year would go here
];

export const getToday = () => new Date(); // Use current system time

export const calculateDays = (expiryDateStr: string) => {
    const today = getToday();
    const expiry = parseISO(expiryDateStr);

    // Calendar Days
    const calendarDays = differenceInCalendarDays(expiry, today);

    // Trading Days
    let tradingDays = 0;
    let curr = addDays(today, 1);

    while (differenceInCalendarDays(expiry, curr) >= 0) {
        const dateStr = format(curr, 'yyyy-MM-dd');
        const isHoliday = HOLIDAYS.includes(dateStr);
        if (!isWeekend(curr) && !isHoliday) {
            tradingDays++;
        }
        curr = addDays(curr, 1);
    }

    return {
        calendarDays: Math.max(0, calendarDays),
        tradingDays: Math.max(0, tradingDays)
    };
};
