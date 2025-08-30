const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 55729;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Test server is running' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
});