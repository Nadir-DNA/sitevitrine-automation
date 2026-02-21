import { generateSites } from './generate-sites.js';
import { deploySites } from './deploy-sites.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, '../../logs');

async function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  await fs.ensureDir(LOG_DIR);
  await fs.appendFile(path.join(LOG_DIR, 'test-run.log'), `[${timestamp}] ${message}\n`);
}

async function runTest() {
  try {
    await log('🚀 MODE TEST: Génération avec prospects de test...');
    
    // Charger prospects de test
    const prospectsPath = path.join(__dirname, '../test-prospects.json');
    if (!await fs.pathExists(prospectsPath)) {
      await log('❌ Fichier test-prospects.json non trouvé');
      return { success: false };
    }
    
    const prospects = await fs.readJson(prospectsPath);
    await log(`📥 ${prospects.length} prospects de test chargés`);
    
    // Générer sites
    await log('🎨 Génération des sites...');
    const sites = await generateSites(prospects);
    await log(`✅ ${sites.length} sites générés`);
    
    // Déployer
    await log('🚀 Déploiement GitHub Pages...');
    const deployed = await deploySites(sites);
    await log(`✅ ${deployed.length} sites déployés`);
    
    // Sauvegarder pour SMS test
    const pendingFile = path.join(LOG_DIR, 'pending-sms-test.json');
    await fs.writeJson(pendingFile, deployed, { spaces: 2 });
    
    await log('💾 Sites sauvegardés pour test SMS');
    await log('✅ TEST TERMINÉ AVEC SUCCÈS');
    
    // Afficher URLs
    for (const site of deployed) {
      await log(`   🌐 ${site.prospect.raison_sociale}: ${site.deployedUrl}`);
    }
    
    return { success: true, sites: deployed };
    
  } catch (error) {
    await log(`❌ Erreur: ${error.message}`);
    console.error(error);
    return { success: false, error: error.message };
  }
}

runTest().then(r => process.exit(r.success ? 0 : 1));
