const axios = require("axios");

setInterval(async () => {
  try {
    await axios.get("http://localhost:4000/");
    console.log("Normal request OK");
  } catch (err) {
    console.log("Request failed");
  }
}, 2000);