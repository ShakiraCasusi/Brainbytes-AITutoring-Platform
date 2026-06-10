const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

describe('Container Resource Usage Tests', () => {
  test('Containers stay within memory limits', async () => {
    const { stdout } = await execPromise(
      'docker stats --no-stream --format "{{.Name}} : {{.MemPerc}}"'
    );

    const memoryUsages = stdout
      .split('\n')
      .filter((line) => line.includes('brainbytes'))
      .map((line) => {
        const [name, memUsage] = line.split(' : ');
        return {
          name,
          memoryPercentage: parseFloat(memUsage.replace('%', '')),
        };
      });

    // Check each container
    memoryUsages.forEach((container) => {
      expect(container.memoryPercentage).toBeLessThan(80); // Adjust threshold as needed
      console.log(
        `${container.name} memory usage: ${container.memoryPercentage}%`
      );
    });
  });

  test('Containers respond within acceptable time', async () => {
    const startTime = Date.now();
    await execPromise('curl -s http://localhost:3000 > /dev/null');

    const frontendResponseTime = Date.now() - startTime;
    console.log(`Frontend response time: ${frontendResponseTime}ms`);
    expect(frontendResponseTime).toBeLessThan(500); // Adjust threshold as needed

    const apiStartTime = Date.now();
    await execPromise('curl -s http://localhost:4000/api/health > /dev/null');

    const apiResponseTime = Date.now() - apiStartTime;
    console.log(`API response time: ${apiResponseTime}ms`);
    expect(apiResponseTime).toBeLessThan(300); // Adjust threshold as needed
  });
});
