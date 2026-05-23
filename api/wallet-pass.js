// Vercel serverless function: generate + sign an Apple Wallet (.pkpass) for a card.
// POST JSON: { id, name, title, company, phone, email, website, location }
import { PKPass } from "passkit-generator";
import Jimp from "jimp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { ICON_29, ICON_58, ICON_87 } from "./_pass-assets.js";

// jimp's bundled fonts aren't traced by Vercel, so load copies shipped in api/_fonts.
const FONTS = join(dirname(fileURLToPath(import.meta.url)), "_fonts");

const hexToInt = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || ""));
  const [r, g, b] = m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [37, 99, 235];
  return ((r * 256 + g) * 256 + b) * 256 + 255;
};

// Compose the whole top banner ("strip") ourselves so the photo AND name are both
// big with NO overlap: large circular avatar on the left, big name to its right,
// on the theme color. Real iOS devices render this strip (the simulator doesn't).
// @2x/@3x are exact multiples of @1x. Returns null on failure (caller falls back).
async function makeStrip(b64, name, bgInt, lightBg) {
  try {
    const W = 1125, H = 432;
    const img = new Jimp(W, H, bgInt);
    let textX = 60;
    if (b64) {
      try {
        const av = (await Jimp.read(Buffer.from(String(b64), "base64"))).cover(340, 340).circle();
        img.composite(av, 50, Math.round((H - 340) / 2));
        textX = 440;
      } catch { /* name-only banner */ }
    }
    const shade = lightBg ? "black" : "white";
    const avail = W - textX - 50;
    const fontFile = (px) => join(FONTS, `open-sans-${px}-${shade}`, `open-sans-${px}-${shade}.fnt`);
    let font = await Jimp.loadFont(fontFile(128));
    if (Jimp.measureText(font, name) > avail) font = await Jimp.loadFont(fontFile(64));
    const th = Jimp.measureTextHeight(font, name, avail);
    img.print(font, textX, Math.max(0, Math.round((H - th) / 2)), name);
    const out = (w, h) => img.clone().resize(w, h).getBufferAsync(Jimp.MIME_PNG);
    return { s1: await out(375, 144), s2: await out(750, 288), s3: await img.getBufferAsync(Jimp.MIME_PNG) };
  } catch {
    return null;
  }
}

const b64buf = (s) => Buffer.from(s || "", "base64");
const envPem = (n) => Buffer.from(process.env[n] || "", "base64").toString("utf8");

// Resolve the card's theme hex into pass colors: the theme color is the
// background, and the text color flips to dark on light backgrounds so labels
// stay legible on pale themes (peach, rose quartz, serenity...).
function passColors(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || ""));
  const rgb = m
    ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
    : { r: 37, g: 99, b: 235 };
  const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  const lightBg = lum >= 0.6;
  return {
    background: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    foreground: lightBg ? "rgb(17, 24, 39)" : "rgb(255, 255, 255)",
    label: lightBg ? "rgb(55, 65, 81)" : "rgb(229, 231, 235)",
  };
}

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
    const colors = passColors(card.color);
    const lightBg = colors.foreground === "rgb(17, 24, 39)";
    const photoB64 = req.method === "GET" ? (req.query && req.query.p) : card.photo;
    const strip = await makeStrip(photoB64, name, hexToInt(card.color), lightBg);

    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.cyrilleger.digitalqrcardpro",
      teamIdentifier: "BXB662X8PV",
      organizationName: "Digital QR Cards",
      description: `${name} — Digital business card`,
      logoText: "Digital QR Card",
      serialNumber: String(card.id || Date.now()),
      backgroundColor: colors.background,
      foregroundColor: colors.foreground,
      labelColor: colors.label,
      // storeCard renders the primary field LARGE → big name.
      storeCard: {
        primaryFields: [],
        secondaryFields: [],
        auxiliaryFields: [],
        backFields: [],
      },
    };

    // No logo image — only the "Digital QR Card" logoText forms the header (shown in
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
    });

    const buffer = pass.getAsBuffer();
    res.setHeader("Content-Type", "application/vnd.apple.pkpass");
    res.setHeader("Content-Disposition", `attachment; filename="${name.replace(/[^a-z0-9]/gi, "_")}.pkpass"`);
    res.status(200).send(buffer);
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
}
