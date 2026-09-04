import { parseISO } from 'date-fns';

const CHINA_TIME_ZONE = 'Asia/Shanghai';
const CHINA_OFFSET = '+08:00';

export function getChinaToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CHINA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function parseChinaDateTime(date: string, time: string): Date {
  return parseISO(`${date}T${time}:00${CHINA_OFFSET}`);
}
