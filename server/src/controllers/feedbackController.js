import Joi from 'joi';
import { Feedback } from '../models/Feedback.js';

const createSchema = Joi.object({
  eventCode: Joi.string().trim().min(1).required(),
  score: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().allow('').max(1000),
  submittedBy: Joi.string().hex().length(24)
});

// GET /api/feedback
export async function getAllFeedbacks(req, res, next) {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 }).lean();
    res.json({ feedbacks });
  } catch (err) { next(err); }
}

// GET /api/feedback/:id
export async function getFeedback(req, res, next) {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.json({ feedback });
  } catch (err) { next(err); }
}

// POST /api/feedback
export async function createFeedback(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const feedback = await Feedback.create(value);
    res.status(201).json({ feedback });
  } catch (err) { next(err); }
}


export async function getFeedbackSummary(req, res, next) {
  try {
    const eventCode = typeof req.query.eventCode === 'string' ? req.query.eventCode.trim() : '';
    if (!eventCode) return res.status(400).json({ message: 'eventCode is required' });

    const [summary] = await Feedback.aggregate([
      { $match: { eventCode } },
      { $group: { _id: '$eventCode', averageScore: { $avg: '$score' }, feedbackCount: { $sum: 1 } } }
    ]);

    res.json({
      eventCode,
      averageScore: summary ? Math.round(summary.averageScore * 100) / 100 : 0,
      feedbackCount: summary ? summary.feedbackCount : 0
    });
  } catch (err) { next(err); }
}
