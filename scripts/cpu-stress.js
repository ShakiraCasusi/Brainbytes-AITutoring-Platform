console.log("CPU stress test running...");

// infinite CPU load
function burnCPU() {
  while (true) {
    Math.sqrt(Math.random());
  }
}

// run multiple workers to increase load
for (let i = 0; i < 4; i++) {
  burnCPU();
}