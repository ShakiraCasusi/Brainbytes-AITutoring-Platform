const Message = require('../Message');
const Activity = require('../models/Activity');
const aiService = require('../aiService');
const realtime = require('../services/realtime');

exports.createSession = async (req, res) => {
  try {
    const session = {
      userId: req.body.userId || 'anonymous',
      subject: req.body.subject || 'General',
      createdAt: new Date(),
      lastActive: new Date(),
    };

    const result = await Message.db.collection('sessions').insertOne(session);

    res.status(200).json({
      sessionId: result.insertedId.toString(),
      session: {
        ...session,
        _id: result.insertedId,
      },
    });
  } catch (error) {
    console.error('Error in createSession:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while creating a chat session' });
  }
};

exports.saveMessage = async (req, res) => {
  try {
    const { text, sender, sessionId } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const message = new Message({
      text,
      sender: sender || 'user',
      sessionId,
      timestamp: new Date(),
    });

    await message.save();
    await Activity.create({
      sessionId,
      type: 'message',
      subject: req.body.subject,
      summary: `${message.sender} message saved`,
    });
    realtime.broadcast('message:saved', { sessionId, message });

    res.status(200).json({
      messageId: message._id,
      message,
    });
  } catch (error) {
    console.error('Error in saveMessage:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while saving your message' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const message = req.body.message || req.body.text;
    const subject = req.body.subject || 'general';

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const chatSessionId = sessionId || Date.now().toString();

    const userMessage = new Message({
      text: message,
      sender: 'user',
      sessionId: chatSessionId,
      subject,
      timestamp: new Date(),
    });
    await userMessage.save();

    let aiResult;
    let timeoutId;
    try {
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error('Request timeout')),
          10000
        );
      });

      const history = await Message.find({ sessionId: chatSessionId })
        .sort({ timestamp: -1 })
        .limit(6);
      const aiResultPromise = aiService.generateResponse(message, {
        subject,
        history: history.reverse(),
      });
      aiResult = await Promise.race([aiResultPromise, timeoutPromise]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      aiResult = {
        category: 'error',
        response:
          "I'm sorry, but I couldn't process your request in time. Please try again with a simpler question.",
      };
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }

    const aiMessage = new Message({
      text: aiResult.response,
      sender: 'ai',
      sessionId: chatSessionId,
      subject: aiResult.category || subject,
      timestamp: new Date(),
    });
    await aiMessage.save();
    await Activity.create({
      sessionId: chatSessionId,
      type: 'message',
      subject: aiResult.category || subject,
      summary: `Asked a ${aiResult.questionType || 'general'} question`,
    });
    realtime.broadcast('chat:message', {
      sessionId: chatSessionId,
      userMessage,
      aiMessage,
      sentiment: aiResult.sentiment,
      suggestions: aiResult.suggestions,
    });

    res.status(200).json({
      userMessage,
      aiMessage,
      message: aiResult.response,
      messageId: userMessage._id,
      sessionId: chatSessionId,
      category: aiResult.category,
      questionType: aiResult.questionType,
      sentiment: aiResult.sentiment,
      suggestions: aiResult.suggestions,
    });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while processing your message' });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 100, 1),
      100
    );
    const skip = (page - 1) * limit;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const query = { sessionId };
    if (req.query.subject) query.subject = req.query.subject.toLowerCase();

    const total = await Message.countDocuments(query);
    const messages = await Message.find(query)
      .sort({ timestamp: 1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error in getChatHistory:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while retrieving chat history' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const result = await Message.updateMany(
      {
        sessionId: req.params.sessionId,
        sender: 'ai',
        readAt: { $exists: false },
      },
      { readAt: new Date() }
    );

    realtime.broadcast('chat:read', {
      sessionId: req.params.sessionId,
      modifiedCount: result.nModified || result.modifiedCount || 0,
    });

    res.json({ updated: result.nModified || result.modifiedCount || 0 });
  } catch (error) {
    res.status(500).json({ error: 'Unable to mark messages as read' });
  }
};
