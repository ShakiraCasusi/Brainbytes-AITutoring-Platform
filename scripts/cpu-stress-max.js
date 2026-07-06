console.log("MAX CPU stress running...");

// multiple CPU burners
function burn() {
  while (true) {
    Math.sqrt(Math.random());
  }
}

// spawn multiple loops
for (let i = 0; i < require("os").cpus().length; i++) {
  setImmediate(burn);
}