#!/bin/bash
set -e

echo "🚀 Installation SiteVitrine Automation..."

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non trouvé. Installez Node 18+"
    exit 1
fi

# Installer dépendances
echo "📦 Installation des dépendances..."
npm install

# Créer structure
echo "📁 Création des dossiers..."
mkdir -p ../logs
mkdir -p ../generated
mkdir -p ../prospects

# Copier env
echo "⚙️ Configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✏️ Éditez le fichier .env avec vos clés API"
fi

# Rendre scripts exécutables
chmod +x src/*.js

echo ""
echo "✅ Installation terminée !"
echo ""
echo "Prochaines étapes:"
echo "1. Configurez .env avec vos clés API"
echo "2. Testez: npm run prospect"
echo "3. Lancez: npm start"
echo "4. Automatisez: crontab crontab.example"
