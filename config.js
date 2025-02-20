module.exports = {
    token: process.env.TOKEN,
    channelId: process.env.CHANNEL_ID,
    roleId: process.env.ROLE_ID,
    timezone: process.env.TIMEZONE || "Europe/Oslo",
    lunchTime: process.env.LUNCH_TIME || "11:30",
    TIME_API_URL: `https://timeapi.io/api/Time/current/zone?timeZone=${process.env.TIMEZONE || "Europe/Oslo"}`,
    ALT_TIME_API: `http://worldtimeapi.org/api/timezone/${process.env.TIMEZONE || "Europe/Oslo"}`,
    HOLIDAY_API_URL: "https://date.nager.at/Api/v2/PublicHolidays",
    HOLIDAY_FILE: "holidays.json"
  };
  