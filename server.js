const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-5';

app.use(express.json({ limit: '15mb' })); // generous limit for photo attachments
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/solve', async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({
      error: 'Server is missing ANTHROPIC_API_KEY. Set it in your Render environment variables.',
    });
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Request must include a non-empty "messages" array.' });
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        messages,
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      const message = (data && data.error && data.error.message) || 'Anthropic API request failed.';
      return res.status(anthropicRes.status).json({ error: message });
    }

    res.json(data);
  } catch (err) {
    console.error('Error calling Anthropic API:', err);
    res.status(502).json({ error: 'Could not reach the Anthropic API. Please try again shortly.' });
  }
});

// Fallback: serve the frontend for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Math Chat server running on port ${PORT}`);
});
