import { google } from 'googleapis';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1rleRNrHQ7dG_oSwG1jsSMLtMD3B9Hpu5O5090yPfubg';
const OUTPUT_DIR = path.join(__dirname, '../../prospects');

async function getAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return auth;
}

export async function fetchProspects() {
  try {
    console.log('🔍 Récupération des prospects depuis Google Sheets...');
    
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Lire la feuille "Prospects"
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Prospects!A:Z', // Adapte selon tes colonnes
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('⚠️ Aucune donnée trouvée');
      return [];
    }
    
    // Extraire headers et données
    const headers = rows[0];
    const data = rows.slice(1).map((row, index) => {
      const prospect = {};
      headers.forEach((header, i) => {
        prospect[header.toLowerCase().replace(/\s+/g, '_')] = row[i] || '';
      });
      prospect._rowIndex = index + 2; // Pour référence
      prospect._id = prospect.id || prospect.siret || `prospect_${Date.now()}_${index}`;
      return prospect;
    });
    
    // Filtrer : uniquement ceux sans site_web et statut != 'contacted'
    const toProcess = data.filter(p => {
      const hasNoWebsite = !p.site_web || p.site_web === '' || p.site_web === 'NULL';
      const notContacted = p.statut !== 'contacted' && p.statut !== 'site_created';
      return hasNoWebsite && notContacted;
    });
    
    // Sauvegarder
    await fs.ensureDir(OUTPUT_DIR);
    const outputFile = path.join(OUTPUT_DIR, `prospects_${Date.now()}.json`);
    await fs.writeJson(outputFile, toProcess, { spaces: 2 });
    
    console.log(`✅ ${toProcess.length} prospects récupérés (${data.length} total)`);
    console.log(`📁 Sauvegardé dans: ${outputFile}`);
    
    return toProcess;
    
  } catch (error) {
    console.error('❌ Erreur fetchProspects:', error.message);
    // Fallback: lire dernier fichier si existe
    const files = await fs.readdir(OUTPUT_DIR).catch(() => []);
    const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse();
    if (jsonFiles.length > 0) {
      console.log('📂 Fallback: lecture du dernier fichier:', jsonFiles[0]);
      return fs.readJson(path.join(OUTPUT_DIR, jsonFiles[0]));
    }
    return [];
  }
}

// Si exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchProspects().then(prospects => {
    console.log('\n📋 Prospects à traiter:');
    prospects.slice(0, 5).forEach(p => {
      console.log(`  - ${p.nom || p.raison_sociale || 'Inconnu'} (${p.activite || p.metier || 'N/A'})`);
    });
    process.exit(0);
  });
}
