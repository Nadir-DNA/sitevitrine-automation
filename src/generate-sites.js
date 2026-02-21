import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { enrichProspectData } from './scraper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../../generated');

const METIER_CONFIG = {
  'electricien': { 
    title: 'Électricien', 
    services: [
      { emoji: '⚡', title: 'Installation électrique', desc: 'Mise en place complète de votre installation électrique' },
      { emoji: '🔌', title: 'Dépannage urgent', desc: 'Intervention rapide 24/7 pour tous vos problèmes' },
      { emoji: '💡', title: 'Mise aux normes', desc: 'Mise en conformité de votre installation' },
      { emoji: '🔧', title: 'Tableau électrique', desc: 'Installation et réparation de tableaux' }
    ],
    tarifs: [
      { nom: 'Dépannage', prix: '80€', desc: 'Intervention + 1h de main d\'œuvre' },
      { nom: 'Installation', prix: '250€', desc: 'À partir de, selon complexité' },
      { nom: 'Diagnostic', prix: '60€', desc: 'Analyse complète' }
    ],
    color: '#4F46E5', 
    icon: '⚡',
    avis: 'Très professionnel, intervention rapide et prix correct. Je recommande !'
  },
  'plombier': { 
    title: 'Plombier', 
    services: [
      { emoji: '🔧', title: 'Dépannage urgent', desc: 'Fuite, inondation, problème urgent' },
      { emoji: '🚿', title: 'Installation sanitaire', desc: 'Douche, baignoire, lavabo' },
      { emoji: '🔥', title: 'Chauffage', desc: 'Chaudière, radiateur, plancher chauffant' },
      { emoji: '🚽', title: 'Débouchage', desc: 'Canalisation, WC, évier' }
    ],
    tarifs: [
      { nom: 'Dépannage', prix: '90€', desc: 'Intervention urgente 24/7' },
      { nom: 'Installation', prix: '300€', desc: 'À partir de' },
      { nom: 'Débouchage', prix: '70€', desc: 'Canalisation simple' }
    ],
    color: '#3B82F6', 
    icon: '🔧',
    avis: 'Excellent travail, très propre et soigné. Tarifs transparents.'
  },
  'coiffeur': { 
    title: 'Coiffeur', 
    services: [
      { emoji: '💇', title: 'Coupe homme/femme', desc: 'Toutes longueurs et styles' },
      { emoji: '✂️', title: 'Coloration', desc: 'Balayage, mèches, couleur' },
      { emoji: '💅', title: 'Coiffure événement', desc: 'Mariage, soirée, cérémonie' },
      { emoji: '🌟', title: 'Soin capillaire', desc: 'Kératine, botox, nutrition' }
    ],
    tarifs: [
      { nom: 'Coupe femme', prix: '35€', desc: 'Shampooing inclus' },
      { nom: 'Coupe homme', prix: '25€', desc: 'Shampooing inclus' },
      { nom: 'Coloration', prix: '60€', desc: 'À partir de' }
    ],
    color: '#8B5CF6', 
    icon: '💇',
    avis: 'Super salon, équipe sympa et à l\'écoute. Je ressors ravie à chaque fois !'
  },
  'institut': { 
    title: 'Institut de beauté', 
    services: [
      { emoji: '💆', title: 'Soins visage', desc: 'Anti-âge, hydratant, purifiant' },
      { emoji: '✨', title: 'Massage', desc: 'Relaxant, sportif, drainant' },
      { emoji: '🌺', title: 'Épilation', desc: 'Cire, laser, fil' },
      { emoji: '💅', title: 'Manucure', desc: 'Vernis, gel, extensions' }
    ],
    tarifs: [
      { nom: 'Soin visage', prix: '55€', desc: '1h de soin complet' },
      { nom: 'Massage', prix: '70€', desc: '1h de massage' },
      { nom: 'Manucure', prix: '30€', desc: 'Vernis simple' }
    ],
    color: '#EC4899', 
    icon: '💆',
    avis: 'Moment de détente absolu, institut très propre et personnel qualifié.'
  },
  'default': { 
    title: 'Artisan', 
    services: [
      { emoji: '🛠️', title: 'Service personnalisé', desc: 'Adapté à vos besoins spécifiques' },
      { emoji: '⚙️', title: 'Devis gratuit', desc: 'Estimation sans engagement' },
      { emoji: '🔨', title: 'Intervention rapide', desc: 'Sous 24h selon disponibilité' },
      { emoji: '✅', title: 'Garantie décennale', desc: 'Travail certifié et assuré' }
    ],
    tarifs: [
      { nom: 'Consultation', prix: 'Gratuit', desc: 'Devis et conseils' },
      { nom: 'Intervention', prix: 'Sur devis', desc: 'Selon complexité' },
      { nom: 'Forfait', prix: 'Personnalisé', desc: 'Grandes prestations' }
    ],
    color: '#10B981', 
    icon: '🛠️',
    avis: 'Travail sérieux et professionnel. Je recommande vivement !'
  }
};

export async function generateSite(prospect) {
  try {
    console.log(`🎨 Génération site: ${prospect.raison_sociale || prospect.nom}`);
    
    const enriched = await enrichProspectData(prospect);
    const metier = (enriched.activite || enriched.metier || 'default').toLowerCase();
    const config = METIER_CONFIG[metier] || METIER_CONFIG.default;
    
    const data = {
      name: enriched.raison_sociale || enriched.nom || 'Votre Entreprise',
      metier: config.title,
      address: enriched.address || enriched.adresse || enriched.ville || 'Sur rendez-vous',
      phone: enriched.phone || enriched.telephone || enriched.portable || 'Contactez-nous',
      email: enriched.email || 'contact@example.com',
      description: enriched.description || `${config.title} professionnel à votre service`,
      services: config.services,
      tarifs: config.tarifs,
      color: config.color,
      icon: config.icon,
      emojis: config.emojis,
      photos: enriched.photos || [],
      rating: enriched.rating || 4.8,
      review_count: enriched.review_count || 127,
      years_experience: enriched.annee_creation ? new Date().getFullYear() - parseInt(enriched.annee_creation) : 10,
      siret: enriched.siret || '',
      ville: enriched.ville || 'votre ville',
      avis: config.avis,
      seo_title: `${config.title} ${enriched.ville || ''} - ${enriched.raison_sociale || enriched.nom}`,
      seo_description: `${config.title} professionnel à ${enriched.ville || 'votre service'}. ${config.services.map(s => s.title).join(', ')}. Devis gratuit.`,
      generated_at: new Date().toISOString()
    };
    
    const html = generateHTML(data);
    
    const siteDir = path.join(OUTPUT_DIR, enriched._id);
    await fs.ensureDir(siteDir);
    await fs.writeFile(path.join(siteDir, 'index.html'), html);
    await fs.writeJson(path.join(siteDir, 'prospect.json'), enriched, { spaces: 2 });
    
    console.log(`✅ Site généré: ${siteDir}`);
    
    return { id: enriched._id, dir: siteDir, url: `https://nadir-dna.github.io/sitevitrine-${enriched._id}`, prospect: enriched };
  } catch (error) {
    console.error('❌ Erreur generateSite:', error.message);
    throw error;
  }
}

function generateHTML(d) {
  const year = new Date().getFullYear();
  
  // Générer les cartes de services
  const servicesHtml = d.services.map((s, i) => {
    return `
    <div class="card">
      <div class="card-icon">${s.emoji || d.emojis[i % 4]}</div>
      <h3>${s.title}</h3>
      <p>${s.desc}</p>
    </div>`;
  }).join('\n');

  // Générer les cartes de tarifs
  const tarifsHtml = d.tarifs.map((t, i) => {
    const featured = i === 1 ? 'featured' : '';
    return `
    <div class="card ${featured}">
      <h3>${t.nom}</h3>
      <div class="price-tag">${t.prix}</div>
      <p>${t.desc}</p>
    </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${d.seo_title}</title>
    <meta name="description" content="${d.seo_description}">
    <meta name="theme-color" content="${d.color}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: ${d.color};
            --primary-hover: ${d.color}dd;
            --bg-dark: #0F172A;
            --bg-card: rgba(30, 41, 59, 0.7);
            --text-light: #F8FAFC;
            --text-muted: #94A3B8;
            --glass-bg: rgba(255, 255, 255, 0.05);
            --glass-border: rgba(255, 255, 255, 0.1);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: var(--bg-dark);
            color: var(--text-light);
            line-height: 1.6;
            overflow-x: hidden;
        }

        .purchase-banner {
            background: linear-gradient(90deg, #EC4899, #8B5CF6, #3B82F6);
            background-size: 200% 200%;
            animation: gradientMove 5s ease infinite;
            color: white;
            text-align: center;
            padding: 12px 20px;
            font-weight: 600;
            font-size: 0.95rem;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 15px;
            flex-wrap: wrap;
        }
        .purchase-banner button {
            background: white;
            color: #0F172A;
            border: none;
            padding: 8px 16px;
            border-radius: 30px;
            font-weight: 800;
            cursor: pointer;
            transition: transform 0.2s;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding-left: 20px;
            padding-right: 20px;
        }
        
        section { 
            padding: 120px 0;
            border-bottom: 1px solid var(--glass-border); 
        }
        
        .section-title {
            font-size: 1.8rem;
            font-weight: 800;
            text-align: center;
            margin-bottom: 80px; 
            background: linear-gradient(to right, #FFFFFF, #94A3B8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .hero {
            min-height: 80vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            position: relative;
            padding: 80px 20px 120px 20px; 
            border-bottom: 1px solid var(--glass-border);
        }
        .hero::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80vw;
            height: 80vw;
            background: radial-gradient(circle, ${d.color}26 0%, rgba(15, 23, 42, 0) 70%);
            z-index: -1;
        }
        .badge {
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            padding: 6px 16px;
            border-radius: 50px;
            font-size: 0.85rem;
            margin-bottom: 25px;
            backdrop-filter: blur(10px);
            animation: slideDown 0.8s ease-out;
        }
        .badge span { color: #FBBF24; font-weight: bold; }
        h1 {
            font-size: clamp(2.2rem, 8vw, 4rem);
            font-weight: 800;
            line-height: 1.1;
            margin-bottom: 20px;
            background: linear-gradient(to right, #FFFFFF, #94A3B8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: slideUp 1s ease-out 0.2s both;
        }
        .hero p {
            font-size: 1.1rem;
            color: var(--text-muted);
            max-width: 650px;
            margin-bottom: 40px;
            animation: slideUp 1s ease-out 0.4s both;
        }
        .cta-button {
            display: inline-block;
            background-color: var(--primary);
            color: white;
            text-decoration: none;
            padding: 16px 35px;
            font-size: 1.05rem;
            font-weight: 600;
            border-radius: 50px;
            box-shadow: 0 10px 30px ${d.color}66;
            transition: all 0.3s ease;
            animation: slideUp 1s ease-out 0.6s both;
            width: 100%;
            text-align: center;
            max-width: 350px;
        }

        .social-proof {
            margin-top: 50px; 
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: 16px;
            padding: 25px;
            width: 100%;
            max-width: 800px;
            backdrop-filter: blur(12px);
            animation: fadeIn 1.5s ease-out 0.8s both;
        }
        .stars { font-size: 1.3rem; color: #FBBF24; margin-bottom: 8px; }
        .quote { font-size: 1rem; font-style: italic; color: #E2E8F0; margin-bottom: 10px; }

        .swipe-row {
            display: flex;
            gap: 20px;
            overflow-x: auto;
            padding-bottom: 20px;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
        }
        
        .swipe-row::-webkit-scrollbar { display: none; }
        .swipe-row { -ms-overflow-style: none; scrollbar-width: none; }

        .card {
            background: var(--bg-card);
            border: 1px solid var(--glass-border);
            border-radius: 16px;
            padding: 25px 20px;
            min-width: 260px;
            flex: 1;
            scroll-snap-align: start;
            display: flex;
            flex-direction: column;
            text-align: left;
        }
        
        .card-icon { font-size: 2rem; margin-bottom: 15px; }
        .card h3 { font-size: 1.15rem; margin-bottom: 10px; color: white; }
        .card p { color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; }
        
        .price-tag {
            font-size: 1.8rem;
            font-weight: 800;
            color: white;
            margin: 10px 0 15px 0;
        }
        .price-tag span { font-size: 0.9rem; color: var(--text-muted); font-weight: 400; }
        .card.featured {
            background: linear-gradient(145deg, ${d.color}33, rgba(30, 41, 59, 0.8));
            border-color: var(--primary);
        }

        .map-wrapper {
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid var(--glass-border);
            height: 350px;
            width: 100%;
        }

        footer {
            text-align: center;
            padding: 80px 20px; 
            color: var(--text-muted);
            font-size: 0.85rem;
        }

        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

        @media (min-width: 900px) {
            .swipe-row { overflow-x: visible; }
            .card.featured { transform: scale(1.05); }
        }
    </style>
</head>
<body>

    <div class="purchase-banner">
        Site de démonstration pour ${d.name}
        <button onclick="window.location.href='https://amens.fr'">Obtenir mon site</button>
    </div>

    <header class="hero container">
        <div class="badge">Recommandé à <span>${d.rating}/5</span></div>
        <h1>${d.name}</h1>
        <p>Votre expert <strong>${d.metier}</strong> à <strong>${d.ville}</strong>. ${d.description}</p>
        <a href="tel:${d.phone}" class="cta-button">Appeler le ${d.phone}</a>
        
        <div class="social-proof">
            <div class="stars">★★★★★</div>
            <p class="quote">"${d.avis}"</p>
            <p style="font-size: 0.85rem; color: #94A3B8;">Basé sur <strong>${d.review_count} avis vérifiés</strong></p>
        </div>
    </header>

    <section class="container">
        <h2 class="section-title">Nos Services</h2>
        <div class="swipe-row">
            ${d.services.map(s => `
            <div class="card">
                <div class="card-icon">${s.emoji}</div>
                <h3>${s.title}</h3>
                <p>${s.desc}</p>
            </div>`).join('')}
        </div>
    </section>

    <section class="container">
        <h2 class="section-title">Nos Tarifs</h2>
        <div class="swipe-row">
            ${d.tarifs.map((t, i) => `
            <div class="card ${i === 1 ? 'featured' : ''}">
                <h3>${t.nom}</h3>
                <div class="price-tag">${t.prix}</div>
                <p>${t.desc}</p>
            </div>`).join('')}
        </div>
    </section>

    <section class="container" style="border-bottom: none;">
        <h2 class="section-title">Zone d'Intervention</h2>
        <div class="map-wrapper">
            <iframe 
                width="100%" 
                height="100%" 
                frameborder="0" 
                style="border:0;" 
                allowfullscreen="" 
                aria-hidden="false" 
                tabindex="0"
                src="https://maps.google.com/maps?q=${encodeURIComponent(d.name + ' ' + d.address)}&t=&z=14&ie=UTF8&iwloc=&output=embed">
            </iframe>
        </div>
    </section>

    <footer>
        <p>📍 ${d.address} | 📞 ${d.phone}</p>
        <p style="margin-top: 10px;">© ${year} ${d.name} - Tous droits réservés.</p>
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
      if (i < Math.min(prospects.length, limit) - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (error) {
      console.error(`❌ Erreur génération site ${i}:`, error.message);
    }
  }
  
  return results;
}