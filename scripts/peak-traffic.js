const axios = require("axios");

setInterval(() => {
  for (let i = 0; i < 30; i++) {
    axios.get("http://localhost:4000/")
      .then(() => console.log("Peak request OK"))
      .catch(() => console.log("Peak request failed"));
  }
}, 1000);