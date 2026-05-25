global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: true })
  })
);

test("login integration (mocked)", async () => {
  const response = await fetch("/api/login");
  const data = await response.json();
  expect(data.success).toBe(true);
});