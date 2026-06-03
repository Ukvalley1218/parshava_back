import express from 'express';
import {
  getSeries,
  getSeriesById,
  createSeries,
  updateSeries,
  deleteSeries
} from '../controllers/series.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes (read-only)
router.get('/', protect, getSeries);
router.get('/:id', protect, getSeriesById);

// Admin routes (CRUD)
router.post('/', protect, authorize('admin'), createSeries);
router.put('/:id', protect, authorize('admin'), updateSeries);
router.delete('/:id', protect, authorize('admin'), deleteSeries);

export default router;