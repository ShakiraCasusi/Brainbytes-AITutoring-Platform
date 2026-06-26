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
  }, 25000);

  test('Containers respond within acceptable time', async () => {
    const axios = require('axios');
    const startTime = Date.now();
    try {
      await axios.get('http://localhost:3000');
    } catch (err) {
      throw new Error(`Frontend request failed: ${err.message}`);
    }

    const frontendResponseTime = Date.now() - startTime;
    console.log(`Frontend response time: ${frontendResponseTime}ms`);
    expect(frontendResponseTime).toBeLessThan(3000); // Adjust threshold as needed

    const apiStartTime = Date.now();
    try {
      await axios.get('http://localhost:4000/api/health');
    } catch (err) {
      throw new Error(`API health check failed: ${err.message}`);
    }

    const apiResponseTime = Date.now() - apiStartTime;
    console.log(`API response time: ${apiResponseTime}ms`);
    expect(apiResponseTime).toBeLessThan(2000); // Adjust threshold as needed
  }, 25000);
});
