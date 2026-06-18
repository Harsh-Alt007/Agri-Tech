const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

const analysisRoutes = require('./routes/analysisRoutes');
app.use('/api', analysisRoutes);

app.listen(5000, () => {
  console.log('✅ Server running on http://localhost:5000');
});