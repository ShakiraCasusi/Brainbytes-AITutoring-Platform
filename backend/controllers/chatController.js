const Message = require('../Message');
const aiService = require('../aiService');

// Create a lightweight session record for legacy tests and older clients.
exports.createSession = async (req, res) => {
  try {
    const session = {
      userId: req.body.userId || 'anonymous',
      subject: req.body.subject || 'General',
      createdAt: new Date(),
      lastActive: new Date()
    };

    const result = await Message.db.collection('sessions').insertOne(session);

    res.status(200).json({
      sessionId: result.insertedId.toString(),
      session: {
        ...session,
        _id: result.insertedId
      }
    });
  } catch (error) {
    console.error('Error in createSession:', error);
    res.status(500).json({ error: 'An error occurred while creating a chat session' });
  }
};

// Legacy message-only endpoint for integration tests and older clients.
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
      timestamp: new Date()
    });

    await message.save();

    res.status(200).json({
      messageId: message._id,
      message
    });
  } catch (error) {
    console.error('Error in saveMessage:', error);
    res.status(500).json({ error: 'An error occurred while saving your message' });
  }
};

// Send a message and get AI response
exports.sendMessage = async (req, res) => {
  try {
    // Legacy clients sent "text"; current chat UI sends "message".
    // const { message, sessionId } = req.body;
    const { sessionId } = req.body;
    const message = req.body.message || req.body.text;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Generate a session ID if not provided
    const chatSessionId = sessionId || Date.now().toString();

    // Save user message to database
    const userMessage = new Message({
      text: message,
      sender: 'user',
      sessionId: chatSessionId,
      timestamp: new Date()
    });
    await userMessage.save();

    // Get AI response from our existing service
    let aiResult;
    try {
      // Create a 10-second timeout for AI response
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const aiResultPromise = aiService.generateResponse(message);
      aiResult = await Promise.race([aiResultPromise, timeoutPromise]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      aiResult = {
        category: 'error',
        response: "I'm sorry, but I couldn't process your request in time. Please try again with a simpler question."
      };
    }

    // Save AI response to database
    const aiMessage = new Message({
      text: aiResult.response,
      sender: 'ai',
      sessionId: chatSessionId,
      timestamp: new Date()
    });
    await aiMessage.save();

    // Return both messages
    res.status(200).json({
      userMessage,
      aiMessage,
      messageId: userMessage._id,
      sessionId: chatSessionId,
      category: aiResult.category
    });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ error: 'An error occurred while processing your message' });
  }
};

// Get chat history for a session
exports.getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 100);
    const skip = (page - 1) * limit;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const total = await Message.countDocuments({ sessionId });
    const messages = await Message.find({ sessionId })
      .sort({ timestamp: 1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getChatHistory:', error);
    res.status(500).json({ error: 'An error occurred while retrieving chat history' });
  }
};
