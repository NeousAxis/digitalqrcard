// Email sending for password reset. Uses Resend (https://resend.com) via plain fetch — no SDK,
// so nothing extra to install. The API key is read from the Worker secret RESEND_API_KEY; the
// "from" address from EMAIL_FROM (e.g. "Digital QR Cards <noreply@digitalqrcard.xyz>").
//
// If no key is configured, sendResetEmail logs and returns false (it NEVER throws) so the
// forget-password request still returns 200 — we just haven't sent anything yet.

export async function sendResetEmail(env, to, resetUrl) {
  const key = env.RESEND_API_KEY;
  const from = env.EMAIL_FROM || "Digital QR Cards <onboarding@resend.dev>";
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — reset email NOT sent to", to);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "Réinitialisez votre mot de passe — Digital QR Cards",
        html: `
          <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
            <h2 style="color:#EC6B3E;margin:0 0 12px">Digital QR Cards</h2>
            <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
            <p style="margin:24px 0">
              <a href="${resetUrl}" style="background:#EC6B3E;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;display:inline-block;font-weight:600">
                Choisir un nouveau mot de passe
              </a>
            </p>
            <p style="color:#666;font-size:13px">Si le bouton ne marche pas, copiez ce lien :<br>${resetUrl}</p>
            <p style="color:#999;font-size:12px;margin-top:24px">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
          </div>`,
      }),
    });
    if (!res.ok) {
      console.error("[email] Resend error", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] send failed", e);
    return false;
  }
}
