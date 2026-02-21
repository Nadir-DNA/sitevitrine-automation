import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs-extra';
import path from 'path';
import simpleGit from 'simple-git';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_REPO_OWNER || 'Nadir-DNA';

export async function deployToGitHubPages(site) {
  try {
    console.log(`🚀 Déploiement GitHub Pages: ${site.id}`);
    
    const repoName = `sitevitrine-${site.id}`;
    const tempDir = path.join('/tmp', repoName);
    
    // Nettoyer si existe
    await fs.remove(tempDir);
    
    // Cloner ou créer repo
    const git = simpleGit();
    const repoUrl = `https://${GITHUB_TOKEN}@github.com/${GITHUB_OWNER}/${repoName}.git`;
    
    try {
      // Essayer de cloner (si repo existe)
      await git.clone(repoUrl, tempDir);
    } catch {
      // Sinon créer repo via API puis init
      console.log(`📦 Création du repo ${repoName}...`);
      const response = await fetch(`https://api.github.com/user/repos`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          name: repoName,
          private: false,
          auto_init: true
        })
      });
      
      if (!response.ok && response.status !== 422) { // 422 = repo existe déjà
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      await git.clone(repoUrl, tempDir);
    }
    
    // Copier les fichiers du site
    const siteGit = simpleGit(tempDir);
    await fs.copy(site.dir, tempDir, { overwrite: true });
    
    // Configurer GitHub Pages (branche main, dossier root)
    // Ceci est fait via l'interface ou API, ici on push juste
    
    // Commit et push
    await siteGit.add('.');
    await siteGit.commit('Mise à jour site vitrine');
    await siteGit.push('origin', 'main');
    
    // Activer GitHub Pages si pas déjà fait
    await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${repoName}/pages`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        source: {
          branch: 'main',
          path: '/'
        }
      })
    }).catch(() => {}); // Ignore si déjà activé
    
    console.log(`✅ Déployé: https://${GITHUB_OWNER}.github.io/${repoName}/`);
    
    // Nettoyer
    await fs.remove(tempDir);
    
    return {
      ...site,
      deployedUrl: `https://${GITHUB_OWNER}.github.io/${repoName}/`,
      deployedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Erreur déploiement:', error.message);
    throw error;
  }
}

export async function deploySites(sites) {
  const results = [];
  
  for (const site of sites) {
    try {
      const deployed = await deployToGitHubPages(site);
      results.push(deployed);
      // Délai entre déploiements
      await new Promise(r => setTimeout(r, 3000));
    } catch (error) {
      console.error(`❌ Erreur déploiement ${site.id}:`, error.message);
    }
  }
  
  return results;
}
