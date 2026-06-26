console.log("Stable CPU load running...");

const workers = [];

function cpuBurn() {
  while (true) {
    Math.sqrt(Math.random());
  }
}

// keep CPU constantly busy using intervals
setInterval(() => {
  for (let i = 0; i < 4; i++) {
    workers.push(setImmediate(cpuBurn));
  }
}, 100);