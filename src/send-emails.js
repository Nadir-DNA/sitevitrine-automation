import brevo from '@getbrevo/brevo';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'contact@amens.fr';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Amens Bien-Être';

export async function sendProspectEmail(site) {
  try {
    console.log(`📧 Envoi email à: ${site.prospect.email}`);
    
    if (!site.prospect.email || site.prospect.email === 'NULL') {
      console.log('⚠️ Pas d\'email pour ce prospect');
      return null;
    }
    
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, BREVO_API_KEY);
    
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.subject = `🌟 Votre site internet professionnel est prêt !`;
    sendSmtpEmail.htmlContent = generateEmailHTML(site);
    sendSmtpEmail.sender = { name: SENDER_NAME, email: SENDER_EMAIL };
    sendSmtpEmail.to = [{ email: site.prospect.email, name: site.prospect.raison_sociale || site.prospect.nom }];
    
    // Optionnel: BCC pour tracking
    // sendSmtpEmail.bcc = [{ email: 'admin@amens.fr' }];
    
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log(`✅ Email envoyé: ${result.messageId}`);
    
    return {
      messageId: result.messageId,
      sentAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Erreur envoi email:', error.message);
    return null;
  }
}

function generateEmailHTML(site) {
  const p = site.prospect;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre site est prêt</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white; border-radius: 12px 12px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background: #f9fafb; padding: 40px 30px; border-radius: 0 0 12px 12px; }
    .highlight { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    .cta-button { display: inline-block; background: #10b981; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .preview-box { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin: 20px 0; text-align: center; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
    .emoji { font-size: 48px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="emoji">🎉</div>
    <h1>${p.raison_sociale || p.nom}</h1>
    <p>Votre site internet professionnel est prêt !</p>
  </div>
  
  <div class="content">
    <p>Bonjour ${p.nom || 'Madame, Monsieur'},</p>
    
    <p>Nous avons créé <strong>gratuitement</strong> un aperçu de votre futur site internet professionnel. Voyez par vous-même :</p>
    
    <div class="preview-box">
      <p style="font-size: 18px; margin-bottom: 16px;">👆 Cliquez ci-dessous pour voir votre site</p>
      <a href="${site.deployedUrl}" class="cta-button" style="background: #3b82f6;">🌐 Voir mon site</a>
    </div>
    
    <div class="highlight">
      <strong>✨ Ce que vous obtenez :</strong>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Site responsive (mobile, tablette, desktop)</li>
        <li>Référencement Google optimisé</li>
        <li>Photos et avis clients intégrés</li>
        <li>Formulaire de contact</li>
        <li>Hébergement inclus</li>
      </ul>
    </div>
    
    <p><strong>Offre limitée :</strong> Ce site peut être activé dès maintenant pour seulement <strong>29€/mois</strong> (sans engagement).</p>
    
    <center>
      <a href="https://amens.fr/pricing?prospect=${site.id}" class="cta-button">🚀 Activer mon site</a>
    </center>
    
    <p style="margin-top: 30px;">Des questions ? Répondez simplement à cet email ou appelez-nous au <strong>01 23 45 67 89</strong>.</p>
    
    <p>Bien cordialement,<br>
    <strong>L'équipe Amens</strong></p>
  </div>
  
  <div class="footer">
    <p>Vous recevez cet email car vous êtes référencé comme professionnel du bien-être.</p>
    <p>© ${new Date().getFullYear()} Amens Bien-Être - Tous droits réservés</p>
    <p style="margin-top: 10px;"><a href="https://amens.fr/legal">Mentions légales</a></p>
  </div>
</body>
</html>
  `;
}

export async function sendNotificationEmails(sites) {
  const results = [];
  const delay = parseInt(process.env.DELAY_BETWEEN_EMAILS) || 30000; // 30s par défaut
  
  for (const site of sites) {
    try {
      const result = await sendProspectEmail(site);
      if (result) {
        results.push({ site: site.id, ...result });
      }
      // Délai entre emails pour éviter rate limiting
      if (sites.indexOf(site) < sites.length - 1) {
        console.log(`⏳ Attente ${delay/1000}s avant prochain email...`);
        await new Promise(r => setTimeout(r, delay));
      }
    } catch (error) {
      console.error(`❌ Erreur notification ${site.id}:`, error.message);
    }
  }
  
  return results;
}
