require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

const INPI_CLIENT_ID = process.env.INPI_CLIENT_ID;
const INPI_CLIENT_SECRET = process.env.INPI_CLIENT_SECRET;

app.get('/token', async (req, res) => {
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', INPI_CLIENT_ID);
    params.append('client_secret', INPI_CLIENT_SECRET);

    const response = await axios.post('https://api.inpi.fr/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    res.json({
      access_token: response.data.access_token,
      expires_in: response.data.expires_in
    });
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({
        error: error.response.data,
        status: error.response.status
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Simple INPI token app running on http://localhost:${port}`);
});
