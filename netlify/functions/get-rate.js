// Fichier : netlify/functions/get-rate.js

const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function(event, context) {
  const url = 'https://www.meilleurtaux.com/credit-immobilier/barometre-des-taux.html';
  console.log('--- Début de la récupération du taux ---');

  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    
    let excellentRate = null;
    
    // On cible le tableau qui contient les baromètres
    const ratesTable = $('#static-rates-table');
    if (ratesTable.length === 0) {
      console.error('Erreur Critique: Le tableau des taux (#static-rates-table) est introuvable.');
      throw new Error("Le tableau des taux principal n'a pas été trouvé.");
    }
    
    // Dans ce tableau, on cherche la ligne qui contient "25 ans"
    const targetRow = ratesTable.find('tr').filter(function() {
      return $(this).find('td').first().text().trim() === '25 ans';
    });

    if (targetRow.length === 0) {
      console.error('Erreur Critique: Impossible de trouver la ligne "25 ans" dans le tableau.');
      throw new Error("La ligne '25 ans' est introuvable.");
    }

    // Le taux "Excellent" est dans la DEUXIÈME colonne (index 1) de cette ligne
    const rateCell = targetRow.find('td').eq(1);
    
    if (rateCell.length === 0) {
      console.error('Erreur Critique: Impossible de trouver la cellule du taux "Excellent".');
      throw new Error("La cellule du taux est introuvable.");
    }

    const rateText = rateCell.text().trim().replace('%', '').replace(',', '.').trim();
    const rateValue = parseFloat(rateText);

    if (isNaN(rateValue)) {
      console.error(`Erreur Critique: La valeur extraite "${rateText}" n'est pas un nombre.`);
      throw new Error("La valeur du taux n'est pas un nombre valide.");
    }
    
    excellentRate = rateValue;
    console.log('✅ Taux récupéré avec succès:', excellentRate);

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