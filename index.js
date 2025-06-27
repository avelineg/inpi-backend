require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

const INPI_CLIENT_ID = process.env.INPI_CLIENT_ID;
const INPI_CLIENT_SECRET = process.env.INPI_CLIENT_SECRET;

let inpiToken = null;
let inpiTokenExpires = 0;

// Fonction pour obtenir un token OAuth2 INPI
async function getInpiToken() {
  const now = Date.now();
  if (inpiToken && inpiTokenExpires > now + 60 * 1000) {
    return inpiToken;
  }
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', INPI_CLIENT_ID);
  params.append('client_secret', INPI_CLIENT_SECRET);

  const response = await axios.post('https://api.inpi.fr/api/oauth/token', params);
  inpiToken = response.data.access_token;
  inpiTokenExpires = now + response.data.expires_in * 1000;
  return inpiToken;
}

// Exemple de route pour récupérer les infos INPI sur un SIREN
app.get('/api/inpi/:siren', async (req, res) => {
  try {
    const token = await getInpiToken();
    const siren = req.params.siren;
    // Exemple endpoint : API SIRENE/INPI
    const url = `https://api.inpi.fr/entreprises/sirene/V3/siren/${siren}`;
    const resp = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    res.json(resp.data);
  } catch (e) {
    res.status(500).json({ error: 'INPI API error', details: e.message });
  }
});

// Utilise le port fourni par Render, ou 3001 par défaut en local
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`INPI proxy server started on http://localhost:${port}`);
});
