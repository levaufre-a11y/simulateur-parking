// Fichier : netlify/functions/get-rate.js

const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function(event, context) {
  // On utilise la nouvelle URL de CAFPI, plus simple et fiable
  const url = 'https://www.cafpi.fr/credit-immobilier/barometre-taux';
  console.log(`--- Lancement de la récupération du taux depuis CAFPI : ${url} ---`);

  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    let bestRate = null;
    
    // 1. On cherche le tableau des taux
    const ratesTable = $('.table-rates'); // Le tableau a une classe simple : "table-rates"
    if (ratesTable.length === 0) {
      console.error('Erreur Critique: Le tableau des taux (.table-rates) est introuvable.');
      throw new Error("Tableau des taux introuvable.");
    }
    console.log('Tableau des taux trouvé avec succès.');

    // 2. Dans ce tableau, on cherche la ligne qui contient "25 ans"
    const targetRow = ratesTable.find('tr').filter(function() {
      // On s'assure que le texte commence bien par "25 ans" pour être précis
      return $(this).find('td').first().text().trim().startsWith('25 ans');
    });

    if (targetRow.length === 0) {
      console.error('Erreur Critique: Impossible de trouver la ligne "25 ans" dans le tableau.');
      throw new Error("Ligne '25 ans' introuvable.");
    }
    console.log('Ligne "25 ans" trouvée.');

    // 3. On extrait le taux "le plus bas" (équivalent à "Excellent"), qui est dans la 2ème colonne (index 1)
    const rateCell = targetRow.find('td').eq(1);
    const rateText = rateCell.text().trim().replace('%', '').replace(',', '.').trim();
    const rateValue = parseFloat(rateText);

    if (isNaN(rateValue)) {
      console.error(`Erreur Critique: La valeur extraite "${rateText}" n'est pas un nombre.`);
      throw new Error("La valeur du taux n'est pas un nombre valide.");
    }
    
    bestRate = rateValue;
    console.log(`✅ Taux sur 25 ans (le plus bas) récupéré avec succès: ${bestRate}%`);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ rate: bestRate }),
    };

  } catch (error) {
    console.error('❌ ERREUR DANS LA FONCTION:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Impossible de récupérer le taux.", details: error.message }),
    };
  }
};