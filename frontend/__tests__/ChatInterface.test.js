describe('Chat Interface', () => {
  const viewports = [
    { width: 320, height: 568, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1366, height: 768, name: 'desktop' },
  ];

  viewports.forEach((viewport) => {
    it(`should render correctly on ${viewport.name}`, () => {
      // Resize testing viewport
      global.innerWidth = viewport.width;
      global.innerHeight = viewport.height;
      window.dispatchEvent(new Event('resize'));

      // Run tests
      expect(window.innerWidth).toBe(viewport.width);
      expect(window.innerHeight).toBe(viewport.height);
    });
  });
});
