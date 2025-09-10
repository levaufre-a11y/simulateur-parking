// Fichier : netlify/functions/get-rate.js

const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function(event, context) {
  // L'URL a été corrigée ici
  const url = 'https://www.meilleurtaux.com/credit-immobilier/barometre-des-taux.html';
  console.log(`--- Début de la récupération du taux depuis : ${url} ---`);

  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    let excellentRate = null;
    
    // On cible le conteneur du baromètre national
    const barometer = $('.barometre.national');
    if (barometer.length === 0) {
      console.error('Erreur Critique: Le bloc du baromètre national est introuvable.');
      throw new Error("Conteneur du baromètre introuvable.");
    }
    
    // On cherche la ligne "25 ans"
    const targetRow = barometer.find('tr').filter(function() {
      return $(this).find('td').first().text().trim() === '25 ans';
    });

    if (targetRow.length === 0) {
      console.error('Erreur Critique: Impossible de trouver la ligne "25 ans".');
      throw new Error("Ligne '25 ans' introuvable.");
    }

    // On prend la DEUXIÈME colonne pour le taux "Excellent"
    const rateCell = targetRow.find('td').eq(1);
    if (rateCell.length === 0) {
      console.error('Erreur Critique: Impossible de trouver la cellule du taux "Excellent".');
      throw new Error("Cellule du taux introuvable.");
    }

    const rateText = rateCell.text().trim().replace('%', '').replace(',', '.').trim();
    const rateValue = parseFloat(rateText);

    if (isNaN(rateValue)) {
      console.error(`Erreur Critique: La valeur extraite "${rateText}" n'est pas un nombre.`);
      throw new Error("La valeur du taux n'est pas un nombre valide.");
    }
    
    excellentRate = rateValue;
    console.log(`✅ Taux "Excellent" sur 25 ans récupéré avec succès: ${excellentRate}%`);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ rate: excellentRate }),
    };

  } catch (error) {
    console.error('❌ ERREUR DANS LA FONCTION:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Impossible de récupérer le taux.", details: error.message }),
    };
  }
};