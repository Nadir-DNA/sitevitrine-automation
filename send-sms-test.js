import dotenv from 'dotenv';
dotenv.config();

import { sendTestBatch } from './src/send-sms.js';
import fs from 'fs-extra';

const sites = await fs.readJson('../logs/deployed-sites.json');
console.log(`📱 Envoi SMS à ${sites.length} prospects...\n`);

const results = await sendTestBatch(sites, 3);

console.log('\n✅ SMS envoyés avec succès !');
