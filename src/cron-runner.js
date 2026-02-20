import { fetchProspects } from './fetch-prospects.js';
import { generateSites } from './generate-sites.js';
import { deploySites } from './deploy-sites.js';
import { sendNotificationEmails } from './send-emails.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, '../../logs');

async function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  
  // Sauvegarder dans fichier
  await fs.ensureDir(LOG_DIR);
  const logFile = path.join(LOG_DIR, `cron-${new Date().toISOString().split('T')[0]}.log`);
  await fs.appendFile(logFile, logMessage + '\n');
}

export async function runAutomation() {
  try {
    await log('🚀 Démarrage automation SiteVitrine...');
    
    // 1. Récupérer prospects
    await log('📥 Étape 1: Récupération prospects...');
    const prospects = await fetchProspects();
    if (prospects.length === 0) {
      await log('⚠️ Aucun prospect à traiter');
      return { success: false, reason: 'no_prospects' };
    }
    await log(`✅ ${prospects.length} prospects récupérés`);
    
    // 2. Générer sites
    await log('🎨 Étape 2: Génération des sites...');
    const sites = await generateSites(prospects);
    if (sites.length === 0) {
      await log('❌ Aucun site généré');
      return { success: false, reason: 'generation_failed' };
    }
    await log(`✅ ${sites.length} sites générés`);
    
    // 3. Déployer sur GitHub Pages
    await log('🚀 Étape 3: Déploiement GitHub Pages...');
    const deployed = await deploySites(sites);
    await log(`✅ ${deployed.length} sites déployés`);
    
    // 4. Envoyer emails
    await log('📧 Étape 4: Envoi des notifications...');
    const sent = await sendNotificationEmails(deployed);
    await log(`✅ ${sent.length} emails envoyés`);
    
    // Sauvegarder rapport
    const report = {
      date: new Date().toISOString(),
      prospects: prospects.length,
      generated: sites.length,
      deployed: deployed.length,
      emailsSent: sent.length,
      sites: deployed.map(s => ({
        id: s.id,
        url: s.deployedUrl,
        prospect: s.prospect.email
      }))
    };
    
    const reportFile = path.join(LOG_DIR, `report-${Date.now()}.json`);
    await fs.writeJson(reportFile, report, { spaces: 2 });
    
    await log('✅ Automation terminée avec succès !');
    
    return { success: true, report };
    
  } catch (error) {
    await log(`❌ Erreur automation: ${error.message}`);
    console.error(error);
    return { success: false, error: error.message };
  }
}

// Si exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runAutomation().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}
