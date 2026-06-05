export function formatMessage(text) {
  const parts = String(text || '').split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      return { type: 'code', value: part.replace(/```/g, '').trim(), key: index };
    }

    const lines = part.split('\n').filter(Boolean);
    const isList = lines.length > 1 && lines.every((line) => /^[-*]\s+/.test(line.trim()));
    if (isList) {
      return {
        type: 'list',
        value: lines.map((line) => line.replace(/^[-*]\s+/, '')),
        key: index,
      };
    }

    return { type: 'text', value: part, key: index };
  });
}
