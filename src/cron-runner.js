import { fetchProspects } from './fetch-prospects.js';
import { generateSites } from './generate-sites.js';
import { deploySites } from './deploy-sites.js';
import { sendTestBatch } from './send-sms.js'; // SMS mode
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, '../../logs');

async function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  
  await fs.ensureDir(LOG_DIR);
  const logFile = path.join(LOG_DIR, `cron-${new Date().toISOString().split('T')[0]}.log`);
  await fs.appendFile(logFile, logMessage + '\n');
}

// MODE PREPARATION: Génère les sites, déploie, MAIS n'envoie pas encore les SMS
export async function runPreparation() {
  try {
    await log('🚀 MODE PRÉPARATION: Génération des sites...');
    
    // 1. Récupérer prospects
    await log('📥 Étape 1: Récupération prospects...');
    const prospects = await fetchProspects();
    if (prospects.length === 0) {
      await log('⚠️ Aucun prospect à traiter');
      return { success: false, reason: 'no_prospects' };
    }
    await log(`✅ ${prospects.length} prospects récupérés`);
    
    // 2. Générer sites (max 5 pour test demain)
    const limit = 5; // LIMITE POUR TEST DEMAIN
    await log(`🎨 Étape 2: Génération des sites (max ${limit})...`);
    const sites = await generateSites(prospects.slice(0, limit));
    if (sites.length === 0) {
      await log('❌ Aucun site généré');
      return { success: false, reason: 'generation_failed' };
    }
    await log(`✅ ${sites.length} sites générés`);
    
    // 3. Déployer sur GitHub Pages
    await log('🚀 Étape 3: Déploiement GitHub Pages...');
    const deployed = await deploySites(sites);
    await log(`✅ ${deployed.length} sites déployés`);
    
    // 4. SAUVEGARDE pour envoi SMS demain
    const pendingFile = path.join(LOG_DIR, 'pending-sms-tomorrow.json');
    await fs.writeJson(pendingFile, deployed, { spaces: 2 });
    await log(`💾 ${deployed.length} sites en attente pour envoi SMS demain`);
    
    // Liste des URLs
    for (const site of deployed) {
      await log(`   🌐 ${site.prospect.raison_sociale || site.prospect.nom}: ${site.deployedUrl}`);
    }
    
    await log('✅ PRÉPARATION TERMINÉE - SMS à envoyer demain !');
    
    return { success: true, sites: deployed, pendingSMS: deployed.length };
    
  } catch (error) {
    await log(`❌ Erreur: ${error.message}`);
    console.error(error);
    return { success: false, error: error.message };
  }
}

// MODE TEST DEMAIN: Envoie les 5 SMS
export async function runTestBatch() {
  try {
    await log('🧪 MODE TEST: Envoi batch de 5 SMS...');
    
    // Charger les sites en attente
    const pendingFile = path.join(LOG_DIR, 'pending-sms-tomorrow.json');
    if (!await fs.pathExists(pendingFile)) {
      await log('❌ Aucun site en attente. Lancez d\'abord runPreparation()');
      return { success: false, reason: 'no_pending' };
    }
    
    const sites = await fs.readJson(pendingFile);
    await log(`📱 ${sites.length} sites en attente d'envoi SMS`);
    
    // Envoyer batch de 5 maximum
    const results = await sendTestBatch(sites, 5);
    
    // Archiver les envoyés
    const sentFile = path.join(LOG_DIR, `sent-sms-${Date.now()}.json`);
    await fs.writeJson(sentFile, results, { spaces: 2 });
    
    // Supprimer pending
    await fs.remove(pendingFile);
    
    await log(`✅ Test batch terminé: ${results.length} SMS envoyés`);
    
    return { success: true, sent: results.length, results };
    
  } catch (error) {
    await log(`❌ Erreur test batch: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Mode auto (pour plus tard quand tout sera validé)
export async function runAutomation() {
  return runPreparation(); // Pour l'instant, même que prep
}

// Si exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.argv[2] || 'prep';
  
  if (mode === 'test' || mode === '--test') {
    runTestBatch().then(r => process.exit(r.success ? 0 : 1));
  } else {
    runPreparation().then(r => process.exit(r.success ? 0 : 1));
  }
}
