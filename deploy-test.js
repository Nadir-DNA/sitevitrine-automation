import dotenv from 'dotenv';
dotenv.config();

import { deployToGitHubPages } from './src/deploy-sites.js';

const sites = [
  {
    id: 'test-001',
    dir: '../generated/test-001',
    prospect: { raison_sociale: 'Coiffure Martin', ville: 'Paris', telephone: '+33612345678' }
  },
  {
    id: 'test-002', 
    dir: '../generated/test-002',
    prospect: { raison_sociale: 'Institut Sophie', ville: 'Lyon', telephone: '+33698765432' }
  },
  {
    id: 'test-003',
    dir: '../generated/test-003', 
    prospect: { raison_sociale: 'Plomberie Moreau', ville: 'Bordeaux', telephone: '+33655544433' }
  }
];

console.log('🚀 Déploiement des 3 sites...');
const deployed = [];

for (const site of sites) {
  try {
    const result = await deployToGitHubPages(site);
    console.log('✅ Site déployé:', result.deployedUrl);
    deployed.push(result);
  } catch (err) {
    console.error('❌ Erreur:', err.message);
  }
}

console.log(`\n📊 Résumé: ${deployed.length}/3 sites déployés`);
for (const site of deployed) {
  console.log(`  🌐 ${site.prospect.raison_sociale}: ${site.deployedUrl}`);
}

// Sauvegarder pour SMS
import fs from 'fs-extra';
await fs.ensureDir('../logs');
await fs.writeJson('../logs/deployed-sites.json', deployed, { spaces: 2 });
console.log('\n💾 Sites sauvegardés pour envoi SMS');
