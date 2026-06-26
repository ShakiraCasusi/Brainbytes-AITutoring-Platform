const fs = require('fs');
const path = require('path');

// Manually load variables from parent .env file for Next.js build-time inlining
try {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=');
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        const cleanValue = value.replace(/^['"]|['"]$/g, '');
        if (key && cleanValue) {
          process.env[key] = cleanValue;
        }
      }
    });
  }
} catch (e) {
  console.warn('Failed to load parent .env file:', e);
}

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  reactStrictMode: true,
  swcMinify: true,
});
