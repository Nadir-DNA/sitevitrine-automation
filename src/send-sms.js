import brevo from '@getbrevo/brevo';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_SMS = process.env.BREVO_SENDER_SMS || 'Amens';

export async function sendProspectSMS(site) {
  try {
    const phone = site.prospect.telephone || site.prospect.portable || site.prospect.mobile;
    
    if (!phone || phone === 'NULL' || phone.length < 10) {
      console.log(`⚠️ Pas de téléphone valide pour: ${site.prospect.raison_sociale || site.prospect.nom}`);
      return null;
    }
    
    // Format français: +33XXXXXXXXX
    let formattedPhone = phone.replace(/\s/g, '').replace(/^0/, '+33');
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+33' + formattedPhone;
    }
    
    console.log(`📱 Envoi SMS à: ${formattedPhone}`);
    
    const apiInstance = new brevo.TransactionalSMSApi();
    apiInstance.setApiKey(brevo.TransactionalSMSApiApiKeys.apiKey, BREVO_API_KEY);
    
    const sendTransacSms = new brevo.SendTransacSms();
    sendTransacSms.sender = SENDER_SMS;
    sendTransacSms.recipient = formattedPhone;
    sendTransacSms.content = generateSMSContent(site);
    
    const result = await apiInstance.sendTransacSms(sendTransacSms);
    
    console.log(`✅ SMS envoyé: ${result.messageId}`);
    
    return {
      messageId: result.messageId,
      sentAt: new Date().toISOString(),
      phone: formattedPhone
    };
    
  } catch (error) {
    console.error('❌ Erreur envoi SMS:', error.message);
    return null;
  }
}

function generateSMSContent(site) {
  const name = site.prospect.raison_sociale || site.prospect.nom || 'Votre entreprise';
  const shortUrl = site.deployedUrl.replace('https://', '');
  
  // SMS max 160 chars
  return `🌟 ${name}, votre site internet est prêt ! Découvrez-le ici: ${shortUrl} - Activer pour 29€/mois: https://amens.fr - Amens Bien-Être`;
}

export async function sendTestBatch(sites, batchSize = 5) {
  const results = [];
  const delay = 10000; // 10s entre SMS pour éviter rate limiting
  
  console.log(`🧪 MODE TEST: Envoi de ${Math.min(sites.length, batchSize)} SMS maximum`);
  
  for (let i = 0; i < Math.min(sites.length, batchSize); i++) {
    try {
      const result = await sendProspectSMS(sites[i]);
      if (result) {
        results.push({ site: sites[i].id, ...result });
      }
      
      // Délai entre SMS
      if (i < Math.min(sites.length, batchSize) - 1) {
        console.log(`⏳ Attente 10s avant prochain SMS...`);
        await new Promise(r => setTimeout(r, delay));
      }
    } catch (error) {
      console.error(`❌ Erreur SMS ${sites[i].id}:`, error.message);
    }
  }
  
  console.log(`\n📊 Résultat: ${results.length}/${Math.min(sites.length, batchSize)} SMS envoyés`);
  
  return results;
}
