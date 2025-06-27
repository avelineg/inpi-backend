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

    const { token, expires_in } = response.data;
    inpiToken = token;
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

// Route pour la fiche d'une entreprise par SIREN (nouvelle URL INPI)
app.get('/inpi/entreprise/:siren', async (req, res) => {
  try {
    const token = await getInpiToken();
    const { siren } = req.params;
    const url = `https://registre-national-entreprises.inpi.fr/api/companies/${siren}`;

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

// Route pour recherche floue par raison sociale (companyName)
app.get('/inpi/entreprises', async (req, res) => {
  try {
    const token = await getInpiToken();
    const { raisonSociale } = req.query;
    if (!raisonSociale) {
      return res.status(400).json({ error: "Le paramètre 'raisonSociale' est requis" });
    }
    const url = `https://registre-national-entreprises.inpi.fr/api/companies?companyName=${encodeURIComponent(raisonSociale)}`;

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // La réponse est un tableau d'entreprises potentielles, retourne tel quel
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
