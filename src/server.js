const express = require('express');
const cors = require('cors');
const path = require('path');
const trialsRouter = require('./routes/trials');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api', trialsRouter);

// Fallback — SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`VERDICT server running → http://localhost:${PORT}`);
});
