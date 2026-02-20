# SiteVitrine Automation 🤖

Système complet de génération et déploiement automatique de sites vitrines pour artisans et commerçants.

## 🎯 Objectif

Transformer des prospects sans site web en clients en leur créant **gratuitement** un aperçu de site vitrine professionnel.

## 📦 Structure

```
scripts/
├── src/
│   ├── fetch-prospects.js    # Récupération Google Sheets
│   ├── scraper.js            # Enrichissement données (Google Maps)
│   ├── generate-sites.js     # Génération HTML/CSS
│   ├── deploy-sites.js       # Déploiement GitHub Pages
│   ├── send-emails.js        # Envoi emails Brevo
│   └── cron-runner.js        # Orchestration complète
├── crontab.example           # Configuration cron
└── package.json
```

## 🚀 Installation

```bash
cd /home/nadir/Bureau/SiteVitrine/scripts
npm install
```

## ⚙️ Configuration

```bash
cp .env.example .env
# Éditer .env avec vos clés API
```

Variables requises:
- `GOOGLE_SHEET_ID` - ID de la feuille prospects
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` - Compte service Google
- `GOOGLE_PRIVATE_KEY` - Clé privée service account
- `BREVO_API_KEY` - Clé API Brevo (Sendinblue)
- `GITHUB_TOKEN` - Token GitHub (repo + pages)

## 🎬 Utilisation

### Manuellement
```bash
npm run start          # Run complet
npm run prospect       # Récupérer prospects
npm run generate       # Générer sites
npm run deploy         # Déployer sites
npm run notify         # Envoyer emails
```

### Via Cron (Automatique)
```bash
crontab crontab.example
```

Par défaut:
- **Toutes les 2h** (00h30, 02h30, 04h30, 06h30)
- 5 prospects maximum par run
- 30s de délai entre chaque email

## 📊 Processus

1. **Fetch** → Récupère prospects depuis Google Sheets
2. **Scrape** → Enrichit avec Google Maps (photos, avis, tel)
3. **Generate** → Crée site HTML/CSS responsive
4. **Deploy** → Push sur GitHub Pages
5. **Notify** → Email Brevo avec lien du site

## 🎨 Templates

Templates générés selon le métier:
- Artisan (électricien, plombier...)
- Commerce (fleuriste, boulanger...)
- Services (coiffeur, etc.)

## 📈 Monitoring

Logs dans `../../logs/`:
- `cron-YYYY-MM-DD.log` - Exécutions
- `report-{timestamp}.json` - Rapports détaillés
- `health.log` - Health checks

## 🔔 Alertes

Envoi automatique si:
- Aucun prospect après 3 runs
- Taux d'erreur > 50%
- GitHub Pages indisponible
