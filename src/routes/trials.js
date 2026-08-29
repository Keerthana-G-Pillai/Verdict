const express = require('express');
const router = express.Router();
const { runTrial } = require('../orchestrator');
const { getAllTrials, getTrial } = require('../models/trial');

/**
 * POST /api/trials
 * Submit a code change — runs the full 4-agent pipeline.
 *
 * Body: { diff: string, description: string, file_context?: string }
 */
router.post('/trials', async (req, res) => {
  const { diff, description, file_context } = req.body;

  if (!diff || typeof diff !== 'string' || diff.trim() === '') {
    return res.status(400).json({ error: 'diff is required and must be a non-empty string.' });
  }
  if (!description || typeof description !== 'string' || description.trim() === '') {
    return res.status(400).json({ error: 'description is required and must be a non-empty string.' });
  }

  try {
    const trial = await runTrial({ diff, description, file_context });
    return res.status(201).json(trial);
  } catch (err) {
    console.error('Trial pipeline error:', err);
    return res.status(500).json({ error: 'Trial pipeline failed.', details: err.message });
  }
});

/**
 * GET /api/trials
 * Returns all trials, newest first.
 */
router.get('/trials', (req, res) => {
  return res.json(getAllTrials());
});

/**
 * GET /api/trials/:id
 * Returns a single trial by id.
 */
router.get('/trials/:id', (req, res) => {
  const trial = getTrial(req.params.id);
  if (!trial) return res.status(404).json({ error: 'Trial not found.' });
  return res.json(trial);
});

module.exports = router;
