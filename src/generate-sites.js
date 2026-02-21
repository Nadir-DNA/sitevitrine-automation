import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { enrichProspectData } from './scraper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../../generated');

const METIER_CONFIG = {
  'electricien': { title: 'Électricien', services: ['Installation électrique', 'Dépannage urgent', 'Mise aux normes', 'Tableau électrique'], color: '#f59e0b', icon: '⚡' },
  'plombier': { title: 'Plombier', services: ['Dépannage urgent', 'Installation sanitaire', 'Chauffage', 'Débouchage'], color: '#3b82f6', icon: '🔧' },
  'fleuriste': { title: 'Fleuriste', services: ['Bouquets personnalisés', 'Mariage', 'Deuil', 'Plantes'], color: '#ec4899', icon: '🌸' },
  'coiffeur': { title: 'Coiffeur', services: ['Coupe homme/femme', 'Coloration', 'Coiffure événement', 'Soin capillaire'], color: '#8b5cf6', icon: '💇' },
  'institut': { title: 'Institut de beauté', services: ['Soins visage', 'Massage', 'Épilation', 'Manucure'], color: '#ec4899', icon: '💆' },
  'default': { title: 'Artisan', services: ['Service personnalisé', 'Devis gratuit', 'Intervention rapide', 'Garantie décennale'], color: '#10b981', icon: '🛠️' }
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
      color: config.color,
      icon: config.icon,
      photos: enriched.photos || [],
      rating: enriched.rating,
      review_count: enriched.review_count,
      years_experience: enriched.annee_creation ? new Date().getFullYear() - parseInt(enriched.annee_creation) : 10,
      siret: enriched.siret || '',
      seo_title: `${config.title} ${enriched.ville || ''} - ${enriched.raison_sociale || enriched.nom}`,
      seo_description: `${config.title} professionnel à ${enriched.ville || 'votre service'}. ${config.services.join(', ')}. Devis gratuit.`,
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
  const ratingHtml = d.rating 
    ? `<div class="rating-badge"><span class="stars">★★★★★</span><span>${d.rating}/5</span><span style="font-weight: 400; color: #b45309;">(${d.review_count || '100+'} avis)</span></div>`
    : `<div class="rating-badge" style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); color: #065f46;"><span>✓</span> Devis gratuit</div>`;

  const servicesHtml = d.services.map((s, i) => 
    `<div class="service-card"><div class="service-icon">${['⚡', '🔧', '🏠', '✨'][i % 4]}</div><h3>${s}</h3><p>Un service professionnel et de qualité, réalisé par des experts qualifiés avec garantie satisfait ou remboursé.</p></div>`
  ).join('\n');

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
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root { --color: ${d.color}; --color-dark: ${d.color}dd; --color-light: ${d.color}22; --gradient: linear-gradient(135deg, ${d.color} 0%, ${d.color}99 100%); --shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); --shadow-sm: 0 10px 40px rgba(0, 0, 0, 0.1); --radius: 24px; --radius-sm: 16px; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.7; color: #1a1a2e; background: #fafafa; overflow-x: hidden; }
        nav { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(0, 0, 0, 0.05); padding: 16px 0; transition: all 0.3s ease; }
        nav.scrolled { background: rgba(255, 255, 255, 0.95); box-shadow: var(--shadow-sm); }
        .nav-content { max-width: 1400px; margin: 0 auto; padding: 0 32px; display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 1.5rem; font-weight: 800; background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .nav-links { display: flex; gap: 32px; list-style: none; }
        .nav-links a { text-decoration: none; color: #64648c; font-weight: 500; font-size: 0.95rem; transition: color 0.3s ease; }
        .nav-links a:hover { color: var(--color); }
        .nav-cta { background: var(--gradient); color: white; padding: 12px 28px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 8px; transition: all 0.3s ease; box-shadow: 0 4px 15px ${d.color}44; }
        .nav-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 25px ${d.color}66; }
        .hero { min-height: 100vh; display: flex; align-items: center; position: relative; overflow: hidden; background: linear-gradient(180deg, #ffffff 0%, #f8f9ff 100%); }
        .hero::before { content: ''; position: absolute; top: -50%; right: -20%; width: 80%; height: 150%; background: radial-gradient(ellipse, ${d.color}15 0%, transparent 70%); pointer-events: none; }
        .hero-container { max-width: 1400px; margin: 0 auto; padding: 120px 32px 80px; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .hero-content { position: relative; z-index: 2; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: white; padding: 8px 20px; border-radius: 50px; font-size: 0.875rem; font-weight: 600; color: var(--color); box-shadow: var(--shadow-sm); margin-bottom: 24px; border: 1px solid ${d.color}22; }
        .hero-badge span { font-size: 1.2rem; }
        .hero h1 { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 800; line-height: 1.1; color: #1a1a2e; margin-bottom: 24px; letter-spacing: -0.02em; }
        .hero h1 .highlight { background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero-description { font-size: 1.25rem; color: #64648c; margin-bottom: 40px; max-width: 540px; line-height: 1.8; }
        .hero-actions { display: flex; gap: 16px; flex-wrap: wrap; }
        .btn-primary { background: var(--gradient); color: white; padding: 18px 36px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 1rem; display: inline-flex; align-items: center; gap: 10px; transition: all 0.3s ease; box-shadow: 0 8px 30px ${d.color}44; border: none; cursor: pointer; }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 15px 40px ${d.color}66; }
        .btn-secondary { background: white; color: #1a1a2e; padding: 18px 36px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 1rem; display: inline-flex; align-items: center; gap: 10px; transition: all 0.3s ease; box-shadow: var(--shadow-sm); border: 1px solid rgba(0, 0, 0, 0.08); }
        .btn-secondary:hover { transform: translateY(-3px); box-shadow: var(--shadow); }
        .hero-stats { display: flex; gap: 48px; margin-top: 60px; padding-top: 40px; border-top: 1px solid rgba(0, 0, 0, 0.06); }
        .stat-item { text-align: left; }
        .stat-number { font-size: 2.5rem; font-weight: 800; background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1; margin-bottom: 4px; }
        .stat-label { color: #64648c; font-size: 0.9rem; font-weight: 500; }
        .hero-visual { position: relative; z-index: 1; }
        .hero-card { background: white; border-radius: var(--radius); padding: 40px; box-shadow: var(--shadow); position: relative; overflow: hidden; }
        .hero-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 6px; background: var(--gradient); }
        .hero-card-icon { font-size: 4rem; margin-bottom: 20px; }
        .hero-card h3 { font-size: 1.5rem; font-weight: 700; margin-bottom: 12px; color: #1a1a2e; }
        .hero-card p { color: #64648c; margin-bottom: 24px; }
        .rating-badge { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 12px 20px; border-radius: 50px; font-weight: 600; color: #92400e; }
        .rating-badge .stars { color: #f59e0b; }
        .services { padding: 120px 32px; background: white; }
        .section-container { max-width: 1400px; margin: 0 auto; }
        .section-header { text-align: center; margin-bottom: 64px; }
        .section-label { display: inline-block; background: var(--color-light); color: var(--color); padding: 8px 20px; border-radius: 50px; font-size: 0.875rem; font-weight: 600; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em; }
        .section-header h2 { font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; color: #1a1a2e; margin-bottom: 16px; letter-spacing: -0.02em; }
        .section-header p { font-size: 1.125rem; color: #64648c; max-width: 600px; margin: 0 auto; }
        .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px; }
        .service-card { background: white; border-radius: var(--radius); padding: 40px; border: 1px solid rgba(0, 0, 0, 0.06); transition: all 0.4s ease; position: relative; overflow: hidden; }
        .service-card::before { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--gradient); transform: scaleY(0); transition: transform 0.4s ease; }
        .service-card:hover { transform: translateY(-8px); box-shadow: var(--shadow); border-color: transparent; }
        .service-card:hover::before { transform: scaleY(1); }
        .service-icon { width: 64px; height: 64px; background: var(--color-light); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; margin-bottom: 24px; }
        .service-card h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 12px; color: #1a1a2e; }
        .service-card p { color: #64648c; font-size: 0.95rem; line-height: 1.7; }
        .about { padding: 120px 32px; background: linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%); }
        .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .about-content h2 { font-size: clamp(2rem, 4vw, 2.75rem); font-weight: 800; color: #1a1a2e; margin-bottom: 24px; line-height: 1.2; }
        .about-content p { color: #64648c; font-size: 1.1rem; line-height: 1.8; margin-bottom: 32px; }
        .features-list { list-style: none; display: grid; gap: 16px; }
        .features-list li { display: flex; align-items: center; gap: 12px; font-size: 1rem; color: #1a1a2e; font-weight: 500; }
        .features-list li::before { content: '✓'; width: 28px; height: 28px; background: var(--gradient); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; flex-shrink: 0; }
        .about-image { position: relative; }
        .about-image-card { background: white; border-radius: var(--radius); padding: 32px; box-shadow: var(--shadow); }
        .about-image-card img { width: 100%; border-radius: var(--radius-sm); object-fit: cover; }
        .contact { padding: 120px 32px; background: #1a1a2e; color: white; position: relative; overflow: hidden; }
        .contact::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(ellipse at top right, ${d.color}22 0%, transparent 50%); pointer-events: none; }
        .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; position: relative; z-index: 1; }
        .contact-content h2 { font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; margin-bottom: 24px; }
        .contact-content p { color: #a0a0b8; font-size: 1.125rem; margin-bottom: 40px; line-height: 1.8; }
        .contact-cards { display: grid; gap: 24px; }
        .contact-card { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: var(--radius-sm); padding: 28px; display: flex; align-items: center; gap: 20px; transition: all 0.3s ease; }
        .contact-card:hover { background: rgba(255, 255, 255, 0.08); border-color: ${d.color}44; }
        .contact-card-icon { width: 56px; height: 56px; background: var(--gradient); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
        .contact-card-content h3 { font-size: 0.875rem; color: #a0a0b8; font-weight: 500; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
        .contact-card-content a, .contact-card-content p { color: white; font-size: 1.125rem; font-weight: 600; text-decoration: none; margin: 0; }
        .contact-card-content a:hover { color: var(--color); }
        .contact-form-card { background: white; border-radius: var(--radius); padding: 48px; box-shadow: var(--shadow); }
        .contact-form-card h3 { font-size: 1.5rem; font-weight: 700; color: #1a1a2e; margin-bottom: 32px; }
        .form-group { margin-bottom: 24px; }
        .form-group label { display: block; font-size: 0.875rem; font-weight: 600; color: #64648c; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
        .form-group input, .form-group textarea { width: 100%; padding: 16px 20px; border: 2px solid #e5e5e5; border-radius: 12px; font-size: 1rem; font-family: inherit; transition: all 0.3s ease; }
        .form-group input:focus, .form-group textarea:focus { outline: none; border-color: var(--color); box-shadow: 0 0 0 4px ${d.color}22; }
        .form-group textarea { min-height: 120px; resize: vertical; }
        .cta { padding: 100px 32px; background: var(--gradient); text-align: center; position: relative; overflow: hidden; }
        .cta::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); pointer-events: none; }
        .cta-content { position: relative; z-index: 1; }
        .cta h2 { font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; color: white; margin-bottom: 16px; }
        .cta p { font-size: 1.25rem; color: rgba(255, 255, 255, 0.9); margin-bottom: 40px; max-width: 600px; margin-left: auto; margin-right: auto; }
        .cta .btn-white { background: white; color: var(--color); padding: 20px 48px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 1.1rem; display: inline-flex; align-items: center; gap: 12px; transition: all 0.3s ease; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2); }
        .cta .btn-white:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3); }
        footer { background: #0f0f1a; color: #a0a0b8; padding: 48px 32px; text-align: center; }
        .footer-content { max-width: 1400px; margin: 0 auto; }
        .footer-logo { font-size: 1.5rem; font-weight: 800; background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 16px; }
        .footer-links { display: flex; justify-content: center; gap: 32px; margin-bottom: 24px; flex-wrap: wrap; }
        .footer-links a { color: #a0a0b8; text-decoration: none; font-size: 0.9rem; transition: color 0.3s ease; }
        .footer-links a:hover { color: white; }
        .footer-bottom { padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 0.85rem; }
        .footer-bottom a { color: var(--color); text-decoration: none; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeInUp 0.6s ease forwards; }
        @media (max-width: 1024px) { .hero-container { grid-template-columns: 1fr; gap: 60px; padding-top: 100px; } .hero-visual { order: -1; } .about-grid, .contact-grid { grid-template-columns: 1fr; gap: 48px; } }
        @media (max-width: 768px) { .nav-links { display: none; } .hero-stats { flex-direction: column; gap: 24px; } .hero-actions { flex-direction: column; } .btn-primary, .btn-secondary { width: 100%; justify-content: center; } .services { padding: 80px 20px; } .contact { padding: 80px 20px; } .contact-form-card { padding: 32px 24px; } }
    </style>
</head>
<body>
    <nav id="navbar"><div class="nav-content"><div class="logo">${d.name}</div><ul class="nav-links"><li><a href="#services">Services</a></li><li><a href="#about">À propos</a></li><li><a href="#contact">Contact</a></li></ul><a href="tel:${d.phone}" class="nav-cta"><span>📞</span> Appeler</a></div></nav>

    <section class="hero"><div class="hero-container"><div class="hero-content"><div class="hero-badge"><span>${d.icon}</span> ${d.metier} Professionnel</div><h1>Votre <span class="highlight">${d.metier}</span><br>de confiance à ${d.address.split(',').pop().trim()}</h1><p class="hero-description">${d.description} Intervention rapide, travail soigné et tarifs transparents pour tous vos projets.</p><div class="hero-actions"><a href="tel:${d.phone}" class="btn-primary"><span>📞</span> ${d.phone}</a><a href="#contact" class="btn-secondary"><span>✉️</span> Demander un devis</a></div><div class="hero-stats"><div class="stat-item"><div class="stat-number">${d.years_experience}+</div><div class="stat-label">Années d'expérience</div></div><div class="stat-item"><div class="stat-number">500+</div><div class="stat-label">Clients satisfaits</div></div><div class="stat-item"><div class="stat-number">24/7</div><div class="stat-label">Disponibilité</div></div></div></div><div class="hero-visual"><div class="hero-card"><div class="hero-card-icon">${d.icon}</div><h3>${d.name}</h3><p>${d.metier} expérimenté à votre service pour tous vos travaux.</p>${ratingHtml}</div></div></div></section>

    <section class="services" id="services"><div class="section-container"><div class="section-header"><span class="section-label">Nos Services</span><h2>Des prestations de qualité</h2><p>Nous intervenons rapidement et efficacement pour tous vos besoins.</p></div><div class="services-grid">${servicesHtml}</div></div></section>

    <section class="about" id="about"><div class="section-container"><div class="about-grid"><div class="about-content"><span class="section-label">À propos</span><h2>Une expertise locale depuis ${d.years_experience} ans</h2><p>Notre équipe de professionnels qualifiés met son savoir-faire au service de votre confort. Nous nous engageons à vous offrir un travail irréprochable, dans le respect des délais et de votre budget.</p><ul class="features-list"><li>Intervention rapide sous 24h</li><li>Devis gratuit et sans engagement</li><li>Travail garanti décennale</li><li>Paiement en plusieurs fois</li></ul></div><div class="about-image"><div class="about-image-card"><img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80" alt="${d.name}" loading="lazy"></div></div></div></div></section>

    <section class="contact" id="contact"><div class="section-container"><div class="contact-grid"><div class="contact-content"><h2>Contactez-nous</h2><p>Une question ? Un projet ? N'hésitez pas à nous contacter. Notre équipe est à votre écoute du lundi au samedi.</p><div class="contact-cards"><div class="contact-card"><div class="contact-card-icon">📍</div><div class="contact-card-content"><h3>Adresse</h3><p>${d.address}</p></div></div><div class="contact-card"><div class="contact-card-icon">📞</div><div class="contact-card-content"><h3>Téléphone</h3><a href="tel:${d.phone}">${d.phone}</a></div></div><div class="contact-card"><div class="contact-card-icon">✉️</div><div class="contact-card-content"><h3>Email</h3><a href="mailto:${d.email}">${d.email}</a></div></div></div></div><div class="contact-form-card"><h3>Demande de devis gratuit</h3><form><div class="form-group"><label>Votre nom</label><input type="text" placeholder="Jean Dupont"></div><div class="form-group"><label>Votre téléphone</label><input type="tel" placeholder="06 XX XX XX XX"></div><div class="form-group"><label>Votre message</label><textarea placeholder="Décrivez votre projet..."></textarea></div><button type="submit" class="btn-primary" style="width: 100%; justify-content: center;">Envoyer ma demande ✓</button></form></div></div></div></section>

    <section class="cta"><div class="cta-content"><h2>Besoin d'un ${d.metier} ?</h2><p>Appelez-nous maintenant pour un devis gratuit et sans engagement.</p><a href="tel:${d.phone}" class="btn-white"><span>📞</span> ${d.phone}</a></div></section>

    <footer><div class="footer-content"><div class="footer-logo">${d.name}</div><div class="footer-links"><a href="#services">Services</a><a href="#about">À propos</a><a href="#contact">Contact</a></div><div class="footer-bottom"><p>© ${year} ${d.name} - Tous droits réservés</p><p style="margin-top: 8px;">SIRET: ${d.siret || 'En cours'}</p><p style="margin-top: 16px; opacity: 0.6;">Site créé avec Amens</p></div></div></footer>

    <script>
        window.addEventListener('scroll', () => { const navbar = document.getElementById('navbar'); if (window.scrollY > 50) { navbar.classList.add('scrolled'); } else { navbar.classList.remove('scrolled'); } });
        document.querySelectorAll('a[href^="#"]').forEach(anchor => { anchor.addEventListener('click', function(e) { e.preventDefault(); const target = document.querySelector(this.getAttribute('href')); if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }); });
        const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('animate-fade-in'); } }); }, { threshold: 0.1 });
        document.querySelectorAll('.service-card, .contact-card, .about-image-card').forEach(el => { observer.observe(el); });
    </script>
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