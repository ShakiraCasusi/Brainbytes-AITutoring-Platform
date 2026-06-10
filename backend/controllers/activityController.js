const Activity = require('../models/Activity');

exports.listActivity = async (req, res) => {
  try {
    const query = {};
    if (req.query.userId) query.userId = req.query.userId;
    if (req.query.sessionId) query.sessionId = req.query.sessionId;
    if (req.query.subject) query.subject = req.query.subject.toLowerCase();

    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .limit(12);
    res.json({ activities });
  } catch (error) {
    res.status(500).json({ error: 'Unable to load activity' });
  }
};
