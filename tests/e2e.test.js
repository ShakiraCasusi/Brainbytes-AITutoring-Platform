const puppeteer = require('puppeteer');

describe('End-to-End Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('User can send a message and receive a response', async () => {
    await page.goto('http://localhost:3000');

    // Type a message
    await page.type('input[type="text"]', 'Hello, can you help with science?');

    // Click send button
    await page.click('button[type="submit"]');

    // Wait for response
    await page.waitForSelector('.aiMessage');

    // Verify response exists
    const responseText = await page.$eval(
      '.aiMessage .messageContent',
      (el) => el.textContent
    );
    expect(responseText).toBeTruthy();
    expect(responseText.length).toBeGreaterThan(0);
  });

  test('Chat history persists on page refresh', async () => {
    // Send a unique message
    const uniqueMessage = 'Unique test message ' + Date.now();
    await page.type('input[type="text"]', uniqueMessage);
    await page.click('button[type="submit"]');

    // Wait for message to appear
    await page.waitForFunction(
      (text) =>
        document
          .querySelector('.userMessage .messageContent')
          ?.textContent.includes(text),
      {},
      uniqueMessage
    );

    // Refresh the page
    await page.reload();

    // Wait for chat history to load
    await page.waitForSelector('.message');

    // Check if our unique message is still there
    const pageContent = await page.content();
    expect(pageContent).toContain(uniqueMessage);
  });
});
