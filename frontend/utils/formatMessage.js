export function formatMessage(text = '') {
  if (!text) return [];

  const parts = [];

  const codeRegex = /```([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while ((match = codeRegex.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index);

    if (before.trim()) {
      parts.push({
        type: 'text',
        value: before.trim(),
        key: Math.random(),
      });
    }

    parts.push({
      type: 'code',
      value: match[1],
      key: Math.random(),
    });

    lastIndex = match.index + match[0].length;
  }

  const remaining = text.slice(lastIndex);

  if (remaining.trim()) {
    const paragraphs = remaining.split(/\n{2,}/).filter(Boolean);

    paragraphs.forEach((p) => {
      parts.push({
        type: 'text',
        value: p.trim(),
        key: Math.random(),
      });
    });
  }

  return parts;
}
