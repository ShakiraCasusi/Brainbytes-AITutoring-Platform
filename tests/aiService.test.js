const aiService = require('../backend/aiService');

describe('AI Service Unit Tests', () => {
  describe('detectSubject', () => {
    it('should detect math subject when math operators are present', () => {
      const subject = aiService.detectSubject('What is 5 + 5?');
      expect(subject).toBe('math');
    });

    it('should detect science subject for science-related words', () => {
      const subject = aiService.detectSubject('Explain how evaporation works.');
      expect(subject).toBe('science');
    });

    it('should detect history subject for history-related words', () => {
      const subject = aiService.detectSubject('Who is the president of the Philippines?');
      expect(subject).toBe('history');
    });

    it('should respect preferredSubject over default detection', () => {
      const subject = aiService.detectSubject('What is 5 + 5?', 'science');
      expect(subject).toBe('science');
    });
  });

  describe('detectQuestionType', () => {
    it('should detect definition question type', () => {
      const type = aiService.detectQuestionType('What is evaporation?');
      expect(type).toBe('definition');
    });

    it('should detect explanation question type', () => {
      const type = aiService.detectQuestionType('Why does the rain fall?');
      expect(type).toBe('explanation');
    });

    it('should detect steps question type', () => {
      const type = aiService.detectQuestionType('How do we solve equations?');
      expect(type).toBe('steps');
    });
  });

  describe('detectSentiment', () => {
    it('should detect confused sentiment', () => {
      const sentiment = aiService.detectSentiment('I am confused about math.');
      expect(sentiment.label).toBe('confused');
      expect(sentiment.confidence).toBeGreaterThan(0.5);
    });

    it('should detect neutral sentiment by default', () => {
      const sentiment = aiService.detectSentiment('How are you today?');
      expect(sentiment.label).toBe('neutral');
    });
  });

  describe('generateResponse', () => {
    it('should generate a structured response with local fallback', async () => {
      const result = await aiService.generateResponse('What is evaporation?', {
        subject: 'science',
      });

      expect(result).toBeDefined();
      expect(result.category).toBe('science');
      expect(result.questionType).toBe('definition');
      expect(result.sentiment).toBeDefined();
      expect(result.response).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });
  });
});
