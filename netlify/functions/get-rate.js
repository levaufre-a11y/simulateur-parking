// Fichier : netlify/functions/get-rate.js

const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function(event, context) {
  const url = 'https://www.meilleurtaux.com/credit-immobilier/barometre-des-taux.html';
  console.log(`--- Lancement de la récupération du taux depuis : ${url} ---`);

  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    let excellentRate = null;
    
    // 1. On cherche le titre H2 spécifique pour trouver le bon tableau
    const title = $('h2').filter(function() {
      return $(this).text().trim() === 'Baromètre national des taux immobiliers';
    }).first();

    if (title.length === 0) {
      console.error('Erreur Critique: Le titre "Baromètre national des taux immobiliers" est introuvable.');
      throw new Error("Titre H2 du baromètre introuvable.");
    }
    console.log('Titre H2 trouvé avec succès.');

    // 2. On sélectionne le premier tableau qui suit ce titre
    const ratesTable = title.next('table').first();
    if (ratesTable.length === 0) {
      console.error('Erreur Critique: Impossible de trouver le tableau des taux qui suit le titre H2.');
      throw new Error("Tableau des taux introuvable après le titre.");
    }
    console.log('Tableau des taux localisé avec succès.');
    
    // 3. Dans ce tableau, on cherche la ligne "25 ans"
    const targetRow = ratesTable.find('tr').filter(function() {
      return $(this).find('td').first().text().trim() === '25 ans';
    });

    if (targetRow.length === 0) {
      console.error('Erreur Critique: Impossible de trouver la ligne "25 ans" dans le tableau identifié.');
      throw new Error("Ligne '25 ans' introuvable.");
    }
    console.log('Ligne "25 ans" trouvée.');

    // 4. On extrait le taux "Excellent" (2ème colonne, index 1)
    const rateCell = targetRow.find('td').eq(1);
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
    console.error('❌ ERREUR FINALE DANS LA FONCTION:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Impossible de récupérer le taux.", details: error.message }),
    };
  }
};