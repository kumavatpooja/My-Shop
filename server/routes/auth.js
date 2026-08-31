const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Settings = require('../models/Settings');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { passcode } = req.body;
    if (!passcode) return res.status(400).json({ error: 'Enter a passcode.' });
    if (!process.env.JWT_SECRET) return res.status(500).json({ error: 'Server authentication is not configured.' });
    const settings = await Settings.getOrCreate();
    const ok = await bcrypt.compare(passcode, settings.passcodeHash);
    if (!ok) return res.status(401).json({ error: 'Wrong passcode.' });
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '12h' });
    res.json({ token });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Could not log in.' });
  }
});

module.exports = router;
