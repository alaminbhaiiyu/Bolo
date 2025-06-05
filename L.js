// location.js
const ipinfo = require("ipinfo");

ipinfo((err, cLoc) => {
    if (err) {
        console.error("❌ Error fetching location:", err);
    } else {
        console.log("🌍 Your Device Location:");
        console.log(`IP Address  : ${cLoc.ip}`);
        console.log(`City        : ${cLoc.city}`);
        console.log(`Region      : ${cLoc.region}`);
        console.log(`Country     : ${cLoc.country}`);
        console.log(`Location    : ${cLoc.loc}`); // latitude,longitude
        console.log(`ISP / Org   : ${cLoc.org}`);
        console.log(`Timezone    : ${cLoc.timezone}`);
    }
});