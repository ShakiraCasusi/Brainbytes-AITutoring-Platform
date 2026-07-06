const axios = require("axios");

setInterval(async () => {
  try {
    await axios.get("http://localhost:4000/invalid-route");
  } catch (err) {
    console.log("Intentional error triggered");
  }
}, 3000);