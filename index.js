require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const INPI_USERNAME = process.env.INPI_USERNAME;
const INPI_PASSWORD = process.env.INPI_PASSWORD;

// Route POST /token pour obtenir le token INPI
app.post('/token', async (req, res) => {
  try {
    const response = await axios.post(
      'https://registre-national-entreprises.inpi.fr/api/sso/login',
      {
        username: INPI_USERNAME,
        password: INPI_PASSWORD
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    // Renvoie la réponse complète de l'API INPI (token ou erreur)
    res.json(response.data);

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
  console.log(`Simple INPI login app running on http://localhost:${port}`);
});
