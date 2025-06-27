require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Config depuis .env
const INPI_USERNAME = process.env.INPI_USERNAME;
const INPI_PASSWORD = process.env.INPI_PASSWORD;
const INPI_LOGIN_URL = process.env.INPI_LOGIN_URL || 'https://registre-national-entreprises.inpi.fr/api/sso/login';
const PORT = process.env.PORT || 3001;

// Token cache en mémoire
let inpiToken = null;
let tokenExpiresAt = null; // timestamp en ms

// Fonction pour obtenir un nouveau token INPI
async function fetchInpiToken() {
  try {
    const response = await axios.post(
      INPI_LOGIN_URL,
      { username: INPI_USERNAME, password: INPI_PASSWORD },
      { headers: { 'Content-Type': 'application/json' } }
    );

    // Selon la doc INPI, le retour contient un champ 'token' et 'expires_in' (en secondes)
    const { token, expires_in } = response.data;
    inpiToken = token;
    // On prend une petite marge (ex : 30 secondes avant l’expiration réelle)
    tokenExpiresAt = Date.now() + (expires_in - 30) * 1000;
    return inpiToken;
  } catch (error) {
    inpiToken = null;
    tokenExpiresAt = null;
    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message
    );
  }
}

// Fonction pour obtenir un token valide (rafraîchit si besoin)
async function getInpiToken() {
  if (
    inpiToken &&
    tokenExpiresAt &&
    Date.now() < tokenExpiresAt
  ) {
    return inpiToken;
  }
  return await fetchInpiToken();
}

// Route pour obtenir le token (à des fins de test)
app.post('/token', async (req, res) => {
  try {
    const token = await getInpiToken();
    res.json({ token, expires_at: tokenExpiresAt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exemple : proxy vers un endpoint INPI (complète selon la doc INPI)
app.get('/inpi/entreprise/:siren', async (req, res) => {
  try {
    const token = await getInpiToken();
    const { siren } = req.params;
    // Exemple d’URL INPI, ajuste selon le vrai endpoint
    const url = `https://registre-national-entreprises.inpi.fr/api/entreprises/${siren}`;

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`INPI backend running on http://localhost:${PORT}`);
});
