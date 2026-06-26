const fetch = require('node-fetch');

/* ---------------- INIT ---------------- */

function initializeAI() {
  console.log('BrainBytes AI Tutor initialized');

  if (!process.env.HUGGINGFACE_TOKEN) {
    console.warn('HUGGINGFACE_TOKEN missing');
  }
}

/* ---------------- GREETING ---------------- */

function isGreeting(message) {
  const text = message.toLowerCase().trim();

  return [
    'hi',
    'hello',
    'hey',
    'good morning',
    'good afternoon',
    'good evening',
  ].some((word) => text === word);
}

function greetingResponse() {
  return `
Hello! 👋 I'm BrainBytes AI Tutor.

I can help you learn:
• Science
• Mathematics
• History
• English
• Programming

Ask me anything and I'll explain step by step.
`;
}

/* ---------------- SUBJECT DETECTION ---------------- */

function detectSubject(question, preferredSubject) {
  if (preferredSubject) return preferredSubject;
  const text = question.toLowerCase();

  if (
    /[0-9]\s*[+\-*]/.test(text) ||
    /[0-9]\s*\//.test(text) ||
    /math|calculate/.test(text)
  )
    return 'math';

  if (
    /science|biology|chemistry|physics|plant|water|chemical|photosynthesis|evaporation/.test(
      text
    )
  )
    return 'science';

  if (/history|war|president|country|capital/.test(text)) return 'history';

  if (/essay|grammar|english|sentence/.test(text)) return 'english';

  return 'general';
}

/* ---------------- MATH SOLVER ---------------- */

function solveMath(question) {
  const expression = question.replace(/[^0-9+\-*/().]/g, '');

  if (!expression || !/[0-9]/.test(expression)) return null;

  try {
    const answer = Function(`"use strict"; return (${expression})`)();

    if (typeof answer === 'number' && Number.isFinite(answer)) {
      return `Let's solve it step by step:

Expression:
${expression}

Answer:
${answer}`;
    }
  } catch (err) {
    return null;
  }

  return null;
}

/* ---------------- QUICK ANSWERS ---------------- */

function quickAnswers(question) {
  const q = question.toLowerCase();

  if (q === '1+1' || q === 'what is 1+1') {
    return 'The answer to 1+1 is 2.';
  }

  if (q.includes('what is evaporation')) {
    return 'Evaporation is when liquid water turns into vapor due to heat.';
  }

  if (q.includes('capital of the philippines')) {
    return 'The capital of the Philippines is Manila.';
  }

  return null;
}

/* ---------------- HUGGING FACE AI ---------------- */

async function askAI(question, context = {}) {
  const token = process.env.HUGGINGFACE_TOKEN;
  if (!token) return null;

  const history =
    context.history
      ?.slice(-5)
      .map((i) => i.content)
      .join('\n') || '';

  const prompt = `
You are BrainBytes AI Tutor.

RULES:
- Start directly with the answer in a natural sentence.
- Then continue with explanation in a new paragraph.
- Then add a fun fact or example in another paragraph.
- DO NOT use labels like "Answer:", "Explanation:", "Extra:".
- Use clear paragraphs separated by line breaks.
- Use simple formatting:
  * use **bold** for important words
  * use *italics* for emphasis
- Keep it friendly and natural like a human tutor.
- Be geographically and factually accurate. If you are not absolutely sure about a specific factual detail (such as small local municipal boundaries), state that you don't know instead of guessing.

Student question:
${question}

History:
${history}
`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(
      'https://router.huggingface.co/v1/chat/completions',
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: 'meta-llama/Llama-3.1-8B-Instruct',

          messages: [
            {
              role: 'system',
              content: `
You are BrainBytes AI Tutor.
You are a friendly teacher.
Explain clearly for students.
Use examples.
Show steps.
`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],

          max_tokens: 300,
          temperature: 0.3,
        }),
      }
    );

    clearTimeout(timeout);

    const data = await response.json();

    console.log('HF RESPONSE:', JSON.stringify(data));

    if (data?.error) {
      console.error('HF ERROR:', data.error);
      return null;
    }

    return data?.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error('AI ERROR:', error.message);
    return null;
  }

  function formatAIResponse(text) {
    if (!text) return text;

    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

/* ---------------- FALLBACK ---------------- */

function fallback(subject) {
  const answers = {
    science:
      'Science explains how the natural world works through observation and experiments.',
    history: 'History studies past events and how they shaped the world.',
    math: 'Math uses numbers and logic to solve problems.',
    english: 'English focuses on communication, writing, and language skills.',
    general: 'I can help you learn science, math, history, and more.',
  };

  return answers[subject];
}

/* ---------------- QUESTION TYPE & SENTIMENT DETECTION ---------------- */

function detectQuestionType(question) {
  const text = question.toLowerCase();
  if (/what is|what's|define|definition|meaning/.test(text)) {
    return 'definition';
  }
  if (/why\s/.test(text)) {
    return 'explanation';
  }
  if (/how to|steps|process|procedure|how do we/.test(text)) {
    return 'steps';
  }
  return 'general';
}

function detectSentiment(question) {
  const text = question.toLowerCase();
  if (/confused|lost|dont understand|don't understand|struggling/.test(text)) {
    return { label: 'confused', confidence: 0.8 };
  }
  if (/happy|great|good|thank|awesome|excited/.test(text)) {
    return { label: 'happy', confidence: 0.9 };
  }
  if (/sad|hard|difficult|frustrated/.test(text)) {
    return { label: 'sad', confidence: 0.7 };
  }
  return { label: 'neutral', confidence: 0.5 };
}

/* ---------------- MAIN FUNCTION ---------------- */

async function generateResponse(question, context = {}) {
  const questionType = detectQuestionType(question);
  const sentiment = detectSentiment(question);
  const suggestions = [
    'Explain more',
    'Give an example',
    'Break it down step by step',
  ];

  if (!question?.trim()) {
    return {
      category: 'general',
      response: 'Please enter a question so I can help you learn.',
      questionType,
      sentiment,
      suggestions,
    };
  }

  if (isGreeting(question)) {
    return {
      category: 'general',
      response: greetingResponse(),
      questionType,
      sentiment,
      suggestions,
    };
  }

  const subject = detectSubject(question);

  const quick = quickAnswers(question);
  if (quick) {
    return { 
      category: subject, 
      response: quick,
      questionType,
      sentiment,
      suggestions,
    };
  }

  const math = solveMath(question);
  if (math) {
    return { 
      category: 'math', 
      response: math,
      questionType,
      sentiment,
      suggestions,
    };
  }

  let response = await askAI(question, context);

  if (!response) {
    response = fallback(subject);
  }

  return {
    category: subject,
    response,
    questionType,
    sentiment,
    suggestions,
  };
}

/* ---------------- EXPORTS ---------------- */

module.exports = {
  initializeAI,
  generateResponse,
  detectSubject,
  detectQuestionType,
  detectSentiment,
};
