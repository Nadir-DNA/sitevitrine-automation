import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';
import { fileURLToPath } from 'url';
import { enrichProspectData } from './scraper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '../../templates');
const OUTPUT_DIR = path.join(__dirname, '../../generated');

// Templates par métier
const METIER_TEMPLATES = {
  'electricien': 'artisan',
  'plombier': 'artisan',
  'fleuriste': 'commerce',
  'boulanger': 'commerce',
  'coiffeur': 'services',
  'default': 'artisan'
};

const METIER_CONFIG = {
  'electricien': {
    title: 'Électricien',
    services: ['Installation électrique', 'Dépannage urgent', 'Mise aux normes', 'Tableau électrique'],
    color: '#f59e0b',
    icon: '⚡'
  },
  'plombier': {
    title: 'Plombier',
    services: ['Dépannage urgent', 'Installation sanitaire', 'Chauffage', 'Débouchage'],
    color: '#3b82f6',
    icon: '🔧'
  },
  'fleuriste': {
    title: 'Fleuriste',
    services: ['Bouquets personnalisés', 'Mariage', 'Deuil', 'Plantes'],
    color: '#ec4899',
    icon: '🌸'
  },
  'default': {
    title: 'Artisan',
    services: ['Service personnalisé', 'Devis gratuit', 'Intervention rapide', 'Garantie décennale'],
    color: '#10b981',
    icon: '🛠️'
  }
};

export async function generateSite(prospect) {
  try {
    console.log(`🎨 Génération site: ${prospect.raison_sociale || prospect.nom}`);
    
    // Enrichir avec données scrapées
    const enriched = await enrichProspectData(prospect);
    
    // Déterminer métier et config
    const metier = (enriched.activite || enriched.metier || 'default').toLowerCase();
    const config = METIER_CONFIG[metier] || METIER_CONFIG.default;
    
    // Données pour template
    const templateData = {
      name: enriched.raison_sociale || enriched.nom || 'Votre Entreprise',
      metier: config.title,
      address: enriched.address || enriched.adresse || enriched.ville || 'Sur rendez-vous',
      phone: enriched.phone || enriched.telephone || enriched.portable || 'Contactez-nous',
      email: enriched.email || 'contact@example.com',
      description: enriched.description || `${config.title} professionnel à votre service`,
      services: config.services,
      color: config.color,
      icon: config.icon,
      photos: enriched.photos || [],
      rating: enriched.rating,
      review_count: enriched.review_count,
      years_experience: enriched.annee_creation ? new Date().getFullYear() - parseInt(enriched.annee_creation) : 10,
      siret: enriched.siret || '',
      
      // SEO
      seo_title: `${config.title} ${enriched.ville || ''} - ${enriched.raison_sociale || enriched.nom}`,
      seo_description: `${config.title} professionnel à ${enriched.ville || 'votre service'}. ${config.services.join(', ')}. Devis gratuit.`,
      
      // Génération timestamp
      generated_at: new Date().toISOString()
    };
    
    // Générer HTML
    const html = generateHTML(templateData);
    
    // Sauvegarder
    const siteDir = path.join(OUTPUT_DIR, enriched._id);
    await fs.ensureDir(siteDir);
    await fs.writeFile(path.join(siteDir, 'index.html'), html);
    
    // Sauvegarder métadonnées
    await fs.writeJson(path.join(siteDir, 'prospect.json'), enriched, { spaces: 2 });
    
    console.log(`✅ Site généré: ${siteDir}`);
    
    return {
      id: enriched._id,
      dir: siteDir,
      url: `https://nadir-dna.github.io/sitevitrine-${enriched._id}`,
      prospect: enriched
    };
    
  } catch (error) {
    console.error('❌ Erreur generateSite:', error.message);
    throw error;
  }
}

function generateHTML(data) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.seo_title}</title>
    <meta name="description" content="${data.seo_description}">
    <meta name="robots" content="noindex, nofollow">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; }
        .hero { background: linear-gradient(135deg, ${data.color}22 0%, ${data.color}11 100%); padding: 80px 20px; text-align: center; }
        .hero-icon { font-size: 64px; margin-bottom: 20px; }
        .hero h1 { font-size: 2.5rem; font-weight: 700; color: #1f2937; margin-bottom: 16px; }
        .hero p { font-size: 1.25rem; color: #6b7280; max-width: 600px; margin: 0 auto 32px; }
        .btn { display: inline-block; padding: 16px 32px; background: ${data.color}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; transition: transform 0.2s; }
        .btn:hover { transform: translateY(-2px); }
        .section { padding: 64px 20px; max-width: 1200px; margin: 0 auto; }
        .section h2 { font-size: 2rem; text-align: center; margin-bottom: 48px; color: #1f2937; }
        .services { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; }
        .service-card { background: white; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-left: 4px solid ${data.color}; }
        .service-card h3 { font-size: 1.25rem; margin-bottom: 12px; color: #1f2937; }
        .service-card p { color: #6b7280; }
        .about { background: #f9fafb; }
        .about-content { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
        .about-text h3 { font-size: 1.5rem; margin-bottom: 16px; }
        .stats { display: flex; gap: 32px; margin-top: 24px; }
        .stat { text-align: center; }
        .stat-number { font-size: 2rem; font-weight: 700; color: ${data.color}; }
        .stat-label { font-size: 0.875rem; color: #6b7280; }
        .photos { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; margin-top: 32px; }
        .photo { border-radius: 12px; overflow: hidden; aspect-ratio: 16/9; }
        .photo img { width: 100%; height: 100%; object-fit: cover; }
        .contact { background: #1f2937; color: white; text-align: center; }
        .contact h2 { color: white; }
        .contact-info { display: flex; flex-wrap: wrap; justify-content: center; gap: 32px; margin-top: 32px; }
        .contact-item { padding: 24px; background: rgba(255,255,255,0.1); border-radius: 12px; }
        .contact-item strong { display: block; margin-bottom: 8px; color: ${data.color}; }
        .cta { background: ${data.color}; padding: 64px 20px; text-align: center; color: white; }
        .cta h2 { color: white; margin-bottom: 24px; }
        .btn-white { background: white; color: ${data.color}; }
        footer { padding: 32px; text-align: center; background: #111827; color: #9ca3af; font-size: 0.875rem; }
        .badge { display: inline-block; padding: 4px 12px; background: ${data.color}22; color: ${data.color}; border-radius: 20px; font-size: 0.875rem; font-weight: 500; margin-bottom: 16px; }
        .rating { display: inline-flex; align-items: center; gap: 8px; background: white; padding: 8px 16px; border-radius: 20px; font-weight: 600; }
        .stars { color: #fbbf24; }
        @media (max-width: 768px) {
            .hero h1 { font-size: 1.875rem; }
            .about-content { grid-template-columns: 1fr; }
            .stats { flex-direction: column; gap: 16px; }
        }
    </style>
</head>
<body>
    <section class="hero">
        <div class="hero-icon">${data.icon}</div>
        <span class="badge">${data.metier} Professionnel</span>
        <h1>${data.name}</h1>
        <p>${data.description}</p>
        ${data.rating ? `<div class="rating"><span class="stars">★★★★★</span> ${data.rating}/5 (${data.review_count || 'plusieurs'} avis)</div>` : ''}
        <br><br>
        <a href="tel:${data.phone}" class="btn">📞 ${data.phone}</a>
    </section>

    <section class="section">
        <h2>Nos Services</h2>
        <div class="services">
            ${data.services.map(s => `
            <div class="service-card">
                <h3>${s}</h3>
                <p>Service professionnel et de qualité, réalisé par des experts qualifiés.</p>
            </div>
            `).join('')}
        </div>
    </section>

    <section class="section about">
        <div class="about-content">
            <div class="about-text">
                <h3>À propos de nous</h3>
                <p>Fort de ${data.years_experience} ans d'expérience, nous mettons notre expertise au service de nos clients. Notre mission : vous offrir un travail de qualité, dans les règles de l'art, avec un service client irréprochable.</p>
                <div class="stats">
                    <div class="stat">
                        <div class="stat-number">${data.years_experience}+</div>
                        <div class="stat-label">Années d'expérience</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">500+</div>
                        <div class="stat-label">Clients satisfaits</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">24/7</div>
                        <div class="stat-label">Disponibilité</div>
                    </div>
                </div>
            </div>
            ${data.photos.length > 0 ? `
            <div class="photos">
                ${data.photos.slice(0, 2).map(p => `<div class="photo"><img src="${p}" alt="${data.name}" loading="lazy"></div>`).join('')}
            </div>
            ` : ''}
        </div>
    </section>

    <section class="section contact">
        <h2>Contactez-nous</h2>
        <div class="contact-info">
            <div class="contact-item">
                <strong>📍 Adresse</strong>
                ${data.address}
            </div>
            <div class="contact-item">
                <strong>📞 Téléphone</strong>
                <a href="tel:${data.phone}" style="color: white;">${data.phone}</a>
            </div>
            <div class="contact-item">
                <strong>✉️ Email</strong>
                <a href="mailto:${data.email}" style="color: white;">${data.email}</a>
            </div>
        </div>
        ${data.photos.length > 2 ? `
        <div class="photos" style="margin-top: 32px; padding: 0 20px;">
            ${data.photos.slice(2).map(p => `<div class="photo"><img src="${p}" alt="${data.name}" loading="lazy"></div>`).join('')}
        </div>
        ` : ''}
    </section>

    <section class="cta">
        <h2>Besoin d'un ${data.metier} ?</h2>
        <p style="font-size: 1.25rem; margin-bottom: 24px; opacity: 0.9;">Devis gratuit et sans engagement</p>
        <a href="tel:${data.phone}" class="btn btn-white">📞 Appelez maintenant</a>
    </section>

    <footer>
        <p>© ${new Date().getFullYear()} ${data.name} - Tous droits réservés</p>
        <p style="margin-top: 8px; font-size: 0.75rem;">SIRET: ${data.siret || 'N/A'}</p>
        <p style="margin-top: 16px; font-size: 0.75rem; opacity: 0.7;">Site créé avec ❤️ via <a href="https://amens.fr" style="color: ${data.color};">Amens</a></p>
    </footer>
</body>
</html>`;
}

export async function generateSites(prospects) {
  const results = [];
  const limit = parseInt(process.env.PROSPECTS_PER_RUN) || 5;
  
  for (let i = 0; i < Math.min(prospects.length, limit); i++) {
    try {
      const site = await generateSite(prospects[i]);
      results.push(site);
      // Délai entre générations
      if (i < Math.min(prospects.length, limit) - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (error) {
      console.error(`❌ Erreur génération site ${i}:`, error.message);
    }
  }
  
  return results;
}
