// Vercel serverless function: generate + sign an Apple Wallet (.pkpass) for a card.
// POST JSON: { id, name, title, company, phone, email, website, location }
import { PKPass } from "passkit-generator";
import { ICON_29, ICON_58, ICON_87, LOGO_50, LOGO_100 } from "./_pass-assets.js";

const b64buf = (s) => Buffer.from(s || "", "base64");
const envPem = (n) => Buffer.from(process.env[n] || "", "base64").toString("utf8");

function esc(s) {
  return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function buildVCard(c) {
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  lines.push(`N:${esc(c.name)};;;`);
  lines.push(`FN:${esc(c.name)}`);
  if (c.title) lines.push(`TITLE:${esc(c.title)}`);
  if (c.company) lines.push(`ORG:${esc(c.company)}`);
  if (c.phone) lines.push(`TEL;TYPE=CELL:${esc(c.phone)}`);
  if (c.email) lines.push(`EMAIL:${esc(c.email)}`);
  if (c.website) lines.push(`URL:${esc(c.website)}`);
  if (c.location) lines.push(`ADR:;;${esc(c.location)};;;;`);
  lines.push("END:VCARD");
  return lines.join("\n");
}

export default async function handler(req, res) {
  try {
    let card = {};
    if (req.method === "POST") {
      card = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body) || {};
    } else if (req.method === "GET") {
      // GET ?d=<base64 of card JSON> — lets the app open the URL directly so iOS
      // shows the native "Add to Apple Wallet" sheet.
      const d = req.query && req.query.d;
      if (!d) { res.status(400).json({ error: "missing ?d= card payload" }); return; }
      card = JSON.parse(Buffer.from(String(d), "base64").toString("utf8"));
    } else {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    const name = (card.name || "").trim() || "My Card";

    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.cyrilleger.digitalqrcardpro",
      teamIdentifier: "BXB662X8PV",
      organizationName: "Digital QR Cards",
      description: `${name} — Digital business card`,
      serialNumber: String(card.id || Date.now()),
      backgroundColor: "rgb(33, 46, 83)",
      foregroundColor: "rgb(255, 255, 255)",
      labelColor: "rgb(176, 200, 235)",
      generic: {
        primaryFields: [],
        secondaryFields: [],
        auxiliaryFields: [],
        backFields: [],
      },
    };

    const pass = new PKPass(
      {
        "icon.png": b64buf(ICON_29),
        "icon@2x.png": b64buf(ICON_58),
        "icon@3x.png": b64buf(ICON_87),
        "logo.png": b64buf(LOGO_50),
        "logo@2x.png": b64buf(LOGO_100),
        "pass.json": Buffer.from(JSON.stringify(passJson)),
      },
      {
        wwdr: envPem("PASS_WWDR_B64"),
        signerCert: envPem("PASS_CERT_B64"),
        signerKey: envPem("PASS_KEY_B64"),
      }
    );

    pass.primaryFields.push({ key: "name", label: "NAME", value: name });
    if (card.title) pass.secondaryFields.push({ key: "title", label: "TITLE", value: card.title });
    if (card.company) pass.secondaryFields.push({ key: "company", label: "COMPANY", value: card.company });
    if (card.phone) pass.auxiliaryFields.push({ key: "phone", label: "PHONE", value: card.phone });
    if (card.email) pass.auxiliaryFields.push({ key: "email", label: "EMAIL", value: card.email });
    if (card.website) pass.backFields.push({ key: "website", label: "Website", value: card.website });
    if (card.location) pass.backFields.push({ key: "location", label: "Location", value: card.location });

    pass.setBarcodes({
      message: buildVCard(card),
      format: "PKBarcodeFormatQR",
      messageEncoding: "iso-8859-1",
    });

    const buffer = pass.getAsBuffer();
    res.setHeader("Content-Type", "application/vnd.apple.pkpass");
    res.setHeader("Content-Disposition", `attachment; filename="${name.replace(/[^a-z0-9]/gi, "_")}.pkpass"`);
    res.status(200).send(buffer);
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
}
