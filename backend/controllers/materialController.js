const NodeCache = require('node-cache');
const LearningMaterial = require('../models/LearningMaterial');
const Activity = require('../models/Activity');
const realtime = require('../services/realtime');

const materialCache = new NodeCache({ stdTTL: 120 });

exports.createMaterial = async (req, res) => {
  try {
    const { subject, topic, content } = req.body;
    const material = await LearningMaterial.create({ subject, topic, content });

    materialCache.flushAll();
    await Activity.create({
      type: 'material',
      subject,
      summary: `Added ${topic} material`
    });
    realtime.broadcast('material:created', { material });

    res.status(201).json({ material });
  } catch (error) {
    res.status(400).json({ error: 'Unable to create learning material' });
  }
};

exports.listMaterials = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const query = {};

    if (req.query.subject) query.subject = req.query.subject.toLowerCase();
    if (req.query.topic) query.topic = new RegExp(req.query.topic, 'i');

    const cacheKey = JSON.stringify({ query, page, limit });
    const cached = materialCache.get(cacheKey);
    if (cached) return res.json(cached);

    const [materials, total] = await Promise.all([
      LearningMaterial.find(query).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
      LearningMaterial.countDocuments(query)
    ]);

    const payload = {
      materials,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };

    materialCache.set(cacheKey, payload);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: 'Unable to load learning materials' });
  }
};
