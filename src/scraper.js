import puppeteer from 'puppeteer';

export async function enrichProspectData(prospect) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    console.log(`🔍 Enrichissement: ${prospect.nom || prospect.raison_sociale}`);
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Recherche Google Maps pour photos et avis
    const searchQuery = `${prospect.raison_sociale || prospect.nom} ${prospect.ville || prospect.code_postal}`;
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
    
    await page.goto(mapsUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Extraction données
    const data = await page.evaluate(() => {
      const result = {
        photos: [],
        rating: null,
        review_count: null,
        address: null,
        phone: null,
        hours: null,
        description: null
      };
      
      // Rating
      const ratingEl = document.querySelector('[role="img"][aria-label*="étoile"]');
      if (ratingEl) {
        const match = ratingEl.getAttribute('aria-label')?.match(/([\d,]+)/);
        if (match) result.rating = match[1].replace(',', '.');
      }
      
      // Review count
      const reviewEl = document.querySelector('button[aria-label*="avis"]');
      if (reviewEl) {
        const match = reviewEl.textContent?.match(/(\d+)/);
        if (match) result.review_count = parseInt(match[1]);
      }
      
      // Address
      const addressEl = document.querySelector('[data-item-id="address"]');
      if (addressEl) result.address = addressEl.textContent?.trim();
      
      // Phone
      const phoneEl = document.querySelector('[data-tooltip="Copier le numéro de téléphone"]');
      if (phoneEl) result.phone = phoneEl.textContent?.trim();
      
      // Photos (prendre les 3 premières)
      const photoEls = document.querySelectorAll('img[src*="googleusercontent"], img[src*="ggpht"]');
      result.photos = Array.from(photoEls).slice(0, 3).map(img => img.src);
      
      return result;
    });
    
    console.log(`✅ Données enrichies: ${data.photos.length} photos, rating: ${data.rating || 'N/A'}`);
    
    return {
      ...prospect,
      ...data,
      _enriched: true,
      _enrichedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Erreur scraper:', error.message);
    return prospect;
  } finally {
    await browser.close();
  }
}
