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
  await fs.appendFile(path.join(LOG_DIR, 'test-with-prospects.log'), `[${timestamp}] ${message}\n`);
}

async function runTestWithProspects() {
  try {
    await log('🚀 TEST: Génération avec prospects de test...');
    
    // Charger prospects de test
    const prospectsPath = path.join(__dirname, '../test-prospects.json');
    if (!await fs.pathExists(prospectsPath)) {
      await log('❌ Fichier test-prospects.json non trouvé');
      return { success: false };
    }
    
    const prospects = await fs.readJson(prospectsPath);
    await log(`📥 ${prospects.length} prospects de test chargés`);
    
    // Générer sites (sans scraping Google Maps pour le test)
    await log('🎨 Génération des sites...');
    
    // Mock enrichProspectData pour test
    const enrichedProspects = prospects.map(p => ({
      ...p,
      photos: [],
      rating: 4.5,
      review_count: 12
    }));
    
    // Importer generateSites avec mock
    const { generateSites } = await import('./generate-sites.js');
    const sites = [];
    
    for (const prospect of enrichedProspects.slice(0, 3)) {
      try {
        // Générer manuellement pour test
        const siteDir = path.join(__dirname, '../../generated', prospect.id);
        await fs.ensureDir(siteDir);
        
        // Template HTML simple
        const html = generateTestHTML(prospect);
        await fs.writeFile(path.join(siteDir, 'index.html'), html);
        await fs.writeJson(path.join(siteDir, 'prospect.json'), prospect, { spaces: 2 });
        
        sites.push({
          id: prospect.id,
          dir: siteDir,
          prospect: prospect
        });
        
        await log(`✅ Site généré: ${prospect.raison_sociale}`);
      } catch (err) {
        await log(`❌ Erreur génération ${prospect.id}: ${err.message}`);
      }
    }
    
    await log(`✅ ${sites.length} sites générés`);
    
    // Déployer
    await log('🚀 Déploiement GitHub Pages...');
    const { deploySites } = await import('./deploy-sites.js');
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

function generateTestHTML(prospect) {
  const metier = prospect.activite || prospect.metier || 'Artisan';
  const ville = prospect.ville || 'Votre ville';
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${prospect.raison_sociale} - ${metier} à ${ville}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .header {
            text-align: center;
            padding: 60px 20px;
            background: rgba(255,255,255,0.95);
            border-radius: 20px;
            margin-bottom: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .header h1 {
            font-size: 3em;
            color: #667eea;
            margin-bottom: 10px;
        }
        .header .metier {
            font-size: 1.5em;
            color: #764ba2;
            font-weight: 600;
        }
        .content {
            background: rgba(255,255,255,0.95);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .info-section {
            margin-bottom: 30px;
        }
        .info-section h2 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.5em;
        }
        .contact-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
        }
        .contact-info p {
            margin: 10px 0;
            font-size: 1.1em;
        }
        .badge {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            margin-top: 10px;
        }
        footer {
            text-align: center;
            padding: 40px;
            color: rgba(255,255,255,0.8);
            margin-top: 40px;
        }
        @media (max-width: 768px) {
            .header h1 { font-size: 2em; }
            .container { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>${prospect.raison_sociale}</h1>
            <p class="metier">${metier} à ${ville}</p>
            <span class="badge">Site créé avec Amens</span>
        </header>
        
        <div class="content">
            <section class="info-section">
                <h2>À propos</h2>
                <p>${prospect.description || `${prospect.raison_sociale} est un ${metier} professionnel à ${ville}, à votre service pour tous vos besoins.`}</p>
            </section>
            
            <section class="info-section">
                <h2>Nos services</h2>
                <ul>
                    ${(prospect.services || ['Service personnalisé', 'Devis gratuit', 'Intervention rapide']).map(s => `<li>${s}</li>`).join('\\n                    ')}
                </ul>
            </section>
            
            <div class="contact-info">
                <h2>Contactez-nous</h2>
                <p>📍 ${prospect.adresse || prospect.address || ville}</p>
                <p>📞 ${prospect.telephone || prospect.phone || prospect.portable || 'Contactez-nous'}</p>
                ${prospect.email ? `<p>✉️ ${prospect.email}</p>` : ''}
            </div>
        </div>
        
        <footer>
            <p>© 2026 ${prospect.raison_sociale} - Site créé avec ❤️ par Amens</p>
            <p style="margin-top: 10px; font-size: 0.9em;"><a href="https://amens.fr" style="color: #667eea;">Créez votre site gratuitement</a></p>
        </footer>
    </div>
</body>
</html>
  `;
}

runTestWithProspects().then(r => process.exit(r.success ? 0 : 1));
