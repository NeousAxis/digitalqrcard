// Vercel serverless function: generate + sign an Apple Wallet (.pkpass) for a card.
// POST JSON: { id, name, title, company, phone, email, website, location }
import { PKPass } from "passkit-generator";
import { Resvg } from "@resvg/resvg-js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { ICON_29, ICON_58, ICON_87 } from "./_pass-assets.js";

// Fonts shipped in api/_fonts so Vercel bundles them with the function.
const FONT_FILE = join(dirname(fileURLToPath(import.meta.url)), "_fonts", "HostGrotesk-SemiBold.ttf");

// "Air" palette (design 3d): navy pass, pale blue labels, powder-blue strip.
const AIR = { navy: "#0a1a3a", powder: "#cfe3ff", label: "#8fb5ff" };

const xml = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const svgRender = (svg, width) => new Resvg(svg, {
  fitTo: width ? { mode: "width", value: width } : { mode: "original" },
  font: { fontFiles: [FONT_FILE], loadSystemFonts: false, defaultFontFamily: "Host Grotesk" },
});

// Width in px of the name lines at a given font size (measured with the real font).
function nameWidth(lines, size) {
  const t = lines.map((l, i) => `<text x="0" y="${(i + 1) * size}" font-family="Host Grotesk" font-weight="600" font-size="${size}" letter-spacing="${-0.03 * size}">${xml(l)}</text>`).join("");
  const bbox = svgRender(`<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="${size * 3}">${t}</svg>`).getBBox();
  return bbox ? bbox.width : 0;
}

// Strip banner (eventTicket strip = 375x98pt), drawn at @3x (1125x294): first name /
// last name in Host Grotesk on powder blue, a navy disc on the right with the photo
// (or the initials). @1x/@2x are exact divisions so Wallet keeps them. Null on failure.
function makeStrip(photoB64, name) {
  try {
    const W = 1125, H = 294, PAD = 63, D = 170;
    const words = name.split(/\s+/).filter(Boolean);
    const lines = words.length > 1 ? [words[0], words.slice(1).join(" ")] : [name];
    const initials = (words.length > 1 ? words[0][0] + words[words.length - 1][0] : name.slice(0, 2)).toUpperCase();
    const avail = W - PAD * 2 - D - 42;
    let size = 100;
    while (size > 40 && nameWidth(lines, size) > avail) size -= 6;
    const lh = size * 0.98;
    const top = (H - lh * lines.length) / 2 + size * 0.78;
    const text = lines.map((l, i) => `<text x="${PAD}" y="${top + i * lh}" font-family="Host Grotesk" font-weight="600" font-size="${size}" letter-spacing="${-0.03 * size}" fill="${AIR.navy}">${xml(l)}</text>`).join("");
    const cx = W - PAD - D / 2, cy = H / 2, r = D / 2;
    const photo = photoB64 && /^[A-Za-z0-9+/=]+$/.test(String(photoB64));
    const disc = photo
      ? `<clipPath id="c"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><circle cx="${cx}" cy="${cy}" r="${r}" fill="${AIR.navy}"/><image href="data:image/jpeg;base64,${photoB64}" x="${cx - r}" y="${cy - r}" width="${D}" height="${D}" preserveAspectRatio="xMidYMid slice" clip-path="url(#c)"/>`
      : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${AIR.navy}"/><text x="${cx}" y="${cy + 21}" text-anchor="middle" font-family="Host Grotesk" font-weight="600" font-size="60" fill="${AIR.powder}">${xml(initials)}</text>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${AIR.powder}"/>${text}${disc}</svg>`;
    const png = (w) => Buffer.from(svgRender(svg, w).render().asPng());
    return { s1: png(375), s2: png(750), s3: png(1125) };
  } catch {
    return null;
  }
}

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
    const photoB64 = req.method === "GET" ? (req.query && req.query.p) : card.photo;
    const strip = makeStrip(photoB64, name);

    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.cyrilleger.digitalqrcardpro",
      teamIdentifier: "BXB662X8PV",
      organizationName: "Digital QR Cards",
      description: `${name} — Digital business card`,
      logoText: "Digital QR Cards",
      serialNumber: String(card.id || Date.now()),
      backgroundColor: "rgb(10, 26, 58)",
      foregroundColor: "rgb(255, 255, 255)",
      labelColor: "rgb(143, 181, 255)",
      // eventTicket (not storeCard): with a strip, storeCard squeezes all four fields
      // into one row; eventTicket keeps two rows (title/company, phone/email) as in
      // the Air design. Primary stays empty: the name is drawn in the strip.
      eventTicket: {
        primaryFields: [],
        secondaryFields: [],
        auxiliaryFields: [],
        backFields: [],
      },
    };

    // No logo image — only the "Digital QR Cards" logoText forms the header (shown in
    // the collapsed Wallet stack so the pass stays identifiable); strip banner below.
    const buffers = {
      "icon.png": b64buf(ICON_29),
      "icon@2x.png": b64buf(ICON_58),
      "icon@3x.png": b64buf(ICON_87),
      "pass.json": Buffer.from(JSON.stringify(passJson)),
    };
    if (strip) {
      buffers["strip.png"] = strip.s1;
      buffers["strip@2x.png"] = strip.s2;
      buffers["strip@3x.png"] = strip.s3;
    }

    const pass = new PKPass(buffers, {
      wwdr: envPem("PASS_WWDR_B64"),
      signerCert: envPem("PASS_CERT_B64"),
      signerKey: envPem("PASS_KEY_B64"),
    });

    // Avatar + name are baked big into the strip; only fall back to a text field if it failed.
    if (card.num) pass.headerFields.push({ key: "num", label: "CARD", value: String(card.num).padStart(2, "0") });
    if (!strip) pass.primaryFields.push({ key: "name", label: "", value: name });
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
      altText: "Scan to save",
    });

    const buffer = pass.getAsBuffer();
    res.setHeader("Content-Type", "application/vnd.apple.pkpass");
    res.setHeader("Content-Disposition", `attachment; filename="${name.replace(/[^a-z0-9]/gi, "_")}.pkpass"`);
    res.status(200).send(buffer);
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
}
