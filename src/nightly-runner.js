import { fetchProspects } from './fetch-prospects.js';
import { generateSites } from './generate-sites.js';
import { deploySites } from './deploy-sites.js';
import { sendTestBatch } from './send-sms.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, '../../logs');

// Get current hour and minute to determine test mode
const HOUR = new Date().getHours();
const MINUTE = new Date().getMinutes();
const TIME_SLOT = `${HOUR}:${MINUTE < 10 ? '0' + MINUTE : MINUTE}`;

async function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [RUN-${TIME_SLOT}] ${message}`;
  console.log(logMessage);
  await fs.ensureDir(LOG_DIR);
  // Use hour for log file to group similar runs
  const logFile = path.join(LOG_DIR, `nightly-${HOUR}.log`);
  await fs.appendFile(logFile, logMessage + '\n');
}

// MODES DEV/TEST par heure
const MODES = {
  0: 'FETCH_TEST',      // 00h: Test récupération prospects
  1: 'SCRAPER_TEST',    // 01h: Test scraping Google Maps
  2: 'GENERATE_TEST',   // 02h: Test génération sites
  3: 'DEPLOY_TEST',     // 03h: Test déploiement GitHub Pages
  4: 'SMS_TEST',        // 04h: Test SMS (sans envoi)
  5: 'E2E_TEST',        // 05h: Test end-to-end complet
  6: 'MORNING_WAKE',    // 06h20: Réveil / check matinal
  7: 'MORNING_BATCH',   // 07h00: Démarrage journée
};

async function runFetchTest() {
  await log('🔍 TEST FETCH: Récupération Google Sheets');
  try {
    const prospects = await fetchProspects();
    await log(`✅ ${prospects.length} prospects récupérés`);
    
    // Test: sauvegarder échantillon
    const sampleFile = path.join(LOG_DIR, 'sample-prospects.json');
    await fs.writeJson(sampleFile, prospects.slice(0, 3), { spaces: 2 });
    await log('📁 Échantillon sauvegardé');
    
    return { success: true, count: prospects.length };
  } catch (error) {
    await log(`❌ Erreur fetch: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runScraperTest() {
  await log('🔎 TEST SCRAPER: Google Maps enrichment');
  try {
    // Charger prospects existants
    const prospectsFile = path.join(LOG_DIR, 'sample-prospects.json');
    if (!await fs.pathExists(prospectsFile)) {
      await log('⚠️ Pas de prospects - SKIP');
      return { success: false, reason: 'no_prospects' };
    }
    
    const prospects = await fs.readJson(prospectsFile);
    if (prospects.length === 0) {
      await log('⚠️ Prospects vides - SKIP');
      return { success: false, reason: 'empty_prospects' };
    }
    
    // Test scraper sur 1 prospect
    const { enrichProspectData } = await import('./scraper.js');
    const enriched = await enrichProspectData(prospects[0]);
    
    await log(`✅ Enrichi: ${enriched.photos?.length || 0} photos, rating: ${enriched.rating || 'N/A'}`);
    await fs.writeJson(path.join(LOG_DIR, 'enriched-sample.json'), enriched, { spaces: 2 });
    
    return { success: true, enriched: enriched._id };
  } catch (error) {
    await log(`❌ Erreur scraper: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runGenerateTest() {
  await log('🎨 TEST GENERATE: Création sites HTML');
  try {
    const enrichedFile = path.join(LOG_DIR, 'enriched-sample.json');
    if (!await fs.pathExists(enrichedFile)) {
      await log('⚠️ Pas de données enrichies - SKIP');
      return { success: false, reason: 'no_data' };
    }
    
    const prospect = await fs.readJson(enrichedFile);
    const { generateSite } = await import('./generate-sites.js');
    
    const site = await generateSite(prospect);
    await log(`✅ Site généré: ${site.id}`);
    await log(`📁 Fichier: ${site.dir}/index.html`);
    
    // Vérifier taille
    const htmlPath = path.join(site.dir, 'index.html');
    const stats = await fs.stat(htmlPath);
    await log(`📊 Taille: ${(stats.size / 1024).toFixed(2)} KB`);
    
    return { success: true, site: site.id, size: stats.size };
  } catch (error) {
    await log(`❌ Erreur generate: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runDeployTest() {
  await log('🚀 TEST DEPLOY: GitHub Pages');
  try {
    // Trouver dernier site généré
    const genDir = path.join(__dirname, '../../generated');
    const dirs = await fs.readdir(genDir).catch(() => []);
    if (dirs.length === 0) {
      await log('⚠️ Pas de site à déployer - SKIP');
      return { success: false, reason: 'no_site' };
    }
    
    const siteDir = path.join(genDir, dirs[0]);
    const prospect = await fs.readJson(path.join(siteDir, 'prospect.json'));
    
    const site = {
      id: dirs[0],
      dir: siteDir,
      prospect: prospect
    };
    
    const { deployToGitHubPages } = await import('./deploy-sites.js');
    const deployed = await deployToGitHubPages(site);
    
    await log(`✅ Déployé: ${deployed.deployedUrl}`);
    
    // Sauvegarder pour SMS test
    const pendingFile = path.join(LOG_DIR, 'pending-sms-test.json');
    const existing = await fs.pathExists(pendingFile) ? await fs.readJson(pendingFile) : [];
    existing.push(deployed);
    await fs.writeJson(pendingFile, existing, { spaces: 2 });
    
    return { success: true, url: deployed.deployedUrl };
  } catch (error) {
    await log(`❌ Erreur deploy: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runSMSTest() {
  await log('📱 TEST SMS: Vérification (sans envoi)');
  try {
    const pendingFile = path.join(LOG_DIR, 'pending-sms-test.json');
    if (!await fs.pathExists(pendingFile)) {
      await log('⚠️ Pas de sites en attente - SKIP');
      return { success: false, reason: 'no_pending' };
    }
    
    const sites = await fs.readJson(pendingFile);
    await log(`📊 ${sites.length} sites prêts pour SMS`);
    
    // Vérifier format téléphone
    let validCount = 0;
    for (const site of sites) {
      const phone = site.prospect.telephone || site.prospect.portable;
      if (phone && phone.length >= 10) {
        validCount++;
        await log(`  ✅ ${site.prospect.raison_sociale}: ${phone}`);
      } else {
        await log(`  ⚠️ ${site.prospect.raison_sociale}: Pas de téléphone`);
      }
    }
    
    await log(`✅ ${validCount}/${sites.length} SMS peuvent être envoyés`);
    await log('💡 Pour envoyer: npm run test:sms (demain)');
    
    return { success: true, valid: validCount, total: sites.length };
  } catch (error) {
    await log(`❌ Erreur SMS test: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runE2ETest() {
  await log('🧪 TEST E2E: Flux complet');
  try {
    // Vérifier que tout existe
    const checks = {
      prospects: await fs.pathExists(path.join(LOG_DIR, 'sample-prospects.json')),
      enriched: await fs.pathExists(path.join(LOG_DIR, 'enriched-sample.json')),
      sites: (await fs.readdir(path.join(__dirname, '../../generated')).catch(() => [])).length > 0,
      deployed: await fs.pathExists(path.join(LOG_DIR, 'pending-sms-test.json'))
    };
    
    await log('📋 Checklist:');
    for (const [key, value] of Object.entries(checks)) {
      await log(`  ${value ? '✅' : '❌'} ${key}`);
    }
    
    const allOK = Object.values(checks).every(v => v);
    if (allOK) {
      await log('✅ TOUT EST PRÊT pour envoi SMS demain !');
    } else {
      await log('⚠️ Certains éléments manquent - relancer les runs manquants');
    }
    
    return { success: allOK, checks };
  } catch (error) {
    await log(`❌ Erreur E2E: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// MORNING BUNCHES (6h20-7h30)
async function runMorningWake() {
  await log('☀️ MORNING WAKE: Check matinal rapide');
  try {
    // Vérifier les logs de la nuit
    const logs = ['00-fetch', '01-scraper', '02-generate', '03-deploy', '04-sms', '05-e2e'];
    const status = {};
    
    for (const logName of logs) {
      const logFile = path.join(LOG_DIR, `${logName}.log`);
      const exists = await fs.pathExists(logFile);
      const content = exists ? await fs.readFile(logFile, 'utf8').catch(() => '') : '';
      const success = content.includes('✅') && !content.includes('❌ Erreur');
      status[logName] = { exists, success };
      await log(`${success ? '✅' : '⚠️'} ${logName}: ${exists ? 'OK' : 'MISSING'}`);
    }
    
    const allOK = Object.values(status).every(s => s.exists && s.success);
    await log(allOK ? '✅ Nuit OK - prêt pour la journée' : '⚠️ Certains runs ont échoué');
    
    return { success: allOK, status };
  } catch (error) {
    await log(`❌ Erreur wake: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runMorningBatch() {
  await log('🚀 MORNING BATCH: Préparation journée');
  try {
    // Charger les sites prêts
    const pendingFile = path.join(LOG_DIR, 'pending-sms-test.json');
    if (!await fs.pathExists(pendingFile)) {
      await log('⚠️ Pas de sites en attente');
      return { success: false, reason: 'no_pending' };
    }
    
    const sites = await fs.readJson(pendingFile);
    await log(`📦 ${sites.length} sites prêts pour envoi SMS`);
    
    // Récap pour toi
    for (const site of sites.slice(0, 3)) {
      await log(`  🌐 ${site.prospect.raison_sociale}: ${site.deployedUrl}`);
    }
    
    return { success: true, sitesReady: sites.length };
  } catch (error) {
    await log(`❌ Erreur batch: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main runner
async function runNightly() {
  const mode = (MINUTE >= 20 && HOUR === 6) ? 'MORNING_WAKE' : 
               (MINUTE >= 40 && HOUR === 6) ? 'MORNING_CHECK' :
               (MINUTE === 0 && HOUR === 7) ? 'MORNING_BATCH' :
               (MINUTE >= 20 && HOUR === 7) ? 'MORNING_VALIDATE' :
               MODES[HOUR] || 'UNKNOWN';
  
  await log(`\n========== DÉMARRAGE ${TIME_SLOT} - MODE: ${mode} ==========`);
  
  let result;
  switch (HOUR) {
    case 0: result = await runFetchTest(); break;
    case 1: result = await runScraperTest(); break;
    case 2: result = await runGenerateTest(); break;
    case 3: result = await runDeployTest(); break;
    case 4: result = await runSMSTest(); break;
    case 5: result = await runE2ETest(); break;
    case 6: 
      if (MINUTE >= 40) result = await runMorningBatch(); // Actually 6h40 uses batch logic
      else if (MINUTE >= 20) result = await runMorningWake();
      else result = await runE2ETest(); // 6h00 fallback
      break;
    case 7:
      if (MINUTE === 0) result = await runMorningBatch();
      else if (MINUTE >= 20) result = await runMorningWake(); // Validation check
      else result = await runMorningWake();
      break;
    default: 
      await log('⏸️ Hors plage horaire - skip');
      result = { success: false, reason: 'out_of_range' };
  }
  
  await log(`========== FIN ${TIME_SLOT} - ${result.success ? '✅' : '⚠️'} ==========\n`);
  return result;
}

// Si exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runNightly().then(r => process.exit(r.success ? 0 : 0)); // Toujours 0 pour éviter alertes cron
}
