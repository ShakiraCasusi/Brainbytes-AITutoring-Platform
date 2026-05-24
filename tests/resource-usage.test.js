const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

describe('Container Resource Usage Tests', () => {

  test('Containers stay within memory limits', async () => {
    const { stdout } = await execPromise(
      'docker stats --no-stream --format "{{.Name}} {{.MemPerc}}"'
    );

    const containers = stdout
      .split('\n')
      .filter(line => line.includes('brainbytes'))
      .map(line => {
        const [name, memUsage] = line.trim().split(' ');
        return {
          name,
          memoryPercentage: parseFloat(memUsage.replace('%', ''))
        };
      });

    containers.forEach(container => {
      console.log(`${container.name} memory usage: ${container.memoryPercentage}%`);
      expect(container.memoryPercentage).toBeLessThan(80);
    });
  });


  test('Frontend response time is within threshold', async () => {
    const start = Date.now();

    await execPromise('curl -s http://localhost:8080');

    const responseTime = Date.now() - start;

    console.log(`Frontend response time: ${responseTime}ms`);

    expect(responseTime).toBeLessThan(2000);
  });


  test('Backend API response time is within threshold', async () => {
    const start = Date.now();

    await execPromise('curl -s http://localhost:4000/api/health');

    const responseTime = Date.now() - start;

    console.log(`API response time: ${responseTime}ms`);

    expect(responseTime).toBeLessThan(2000);
  });

});