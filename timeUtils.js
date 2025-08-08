// timeUtils.js
// Samler all tidshåndtering for Lunsj-BotWork

const { TIME_API_URL, ALT_TIME_API } = require('./config');

async function fetchWithRetry(url, retries = 3, delay = 500) {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('API error');
            return await res.json();
        } catch (err) {
            if (attempt < retries - 1) await new Promise(res => setTimeout(res, delay));
        }
    }
    return null;
}

async function getCurrentOsloTime() {
    let data = await fetchWithRetry(TIME_API_URL);
    if (!data) {
        data = await fetchWithRetry(ALT_TIME_API);
    }
    return data ? { date: data.datetime.split("T")[0], time: data.datetime.split("T")[1].substring(0, 8) } : null;
}

function parseTimeString(timeStr) {
    // F.eks. "11:30" -> { hour: 11, minute: 30 }
    const [hour, minute] = timeStr.split(":").map(Number);
    return { hour, minute };
}

function isTimeEqual(time1, time2) {
    // Sammenligner to tidspunkter på formatet { hour, minute }
    return time1.hour === time2.hour && time1.minute === time2.minute;
}

module.exports = {
    getCurrentOsloTime,
    parseTimeString,
    isTimeEqual
};
