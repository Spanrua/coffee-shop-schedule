"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChinaToday = getChinaToday;
exports.parseChinaDateTime = parseChinaDateTime;
const date_fns_1 = require("date-fns");
const CHINA_TIME_ZONE = 'Asia/Shanghai';
const CHINA_OFFSET = '+08:00';
function getChinaToday() {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: CHINA_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());
}
function parseChinaDateTime(date, time) {
    return (0, date_fns_1.parseISO)(`${date}T${time}:00${CHINA_OFFSET}`);
}
