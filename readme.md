Hvis man vill varsle flere grupper må man legge inn dette i
.env
ROLE_IDS=123456789012345678,987654321098765432

config.js
module.exports = {
token: process.env.TOKEN,
channelId: process.env.CHANNEL_ID,
roleIds: process.env.ROLE_IDS ? process.env.ROLE_IDS.split(",") : [], // Konverterer til en array
TIME_API_URL: "https://timeapi.io/api/Time/current/zone?timeZone=Europe/Oslo",
ALT_TIME_API: "http://worldtimeapi.org/api/timezone/Europe/Oslo",
HOLIDAY_API_URL: "https://date.nager.at/Api/v2/PublicHolidays",
HOLIDAY_FILE: "holidays.json"
};

i lunchNotifier.js må man endre disse verdiene
fra
channel.send(`<@&${roleId}> ${message}`)

til:

const roleMentions = roleIds.map(id => `<@&${id}>`).join(" "); // Lager en string med alle roller
channel.send(`${roleMentions} ${message}`)
