import { test, expect } from "@playwright/test";

test("User sends a message and AI responds", async ({ page }) => {
  await page.goto("http://localhost:3000/chat");

  await page.fill('input[placeholder="Type your message here..."]', "hello");
  await page.click("text=Send");

  await expect(page.getByText(/hello/i)).toBeVisible();
});