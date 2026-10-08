// "Air" screens (Claude Design handoff, turns 3a + 4a/4b): home carousel, share and
// links sheets, card editor with network picker, settings, sign-in sheet.
// App.jsx keeps all data logic (auth, save, photo, Wallet) and renders these.
import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { signUp, signIn, requestPasswordReset } from './apiClient';
import { COUNTRY_OPTIONS } from './countries';
import './air.css';

// ---------- Copy (French on French devices, English elsewhere) ----------

const STR = {
  fr: {
    myCards: 'Mes cartes', cards: 'Cartes', settings: 'Réglages',
    share: 'Partager', links: 'Liens', wallet: 'Apple Wallet', edit: 'Modifier', newCard: 'Nouvelle carte',
    shareTitle: 'Partager ma carte', qrWithLinks: 'Le QR contient la fiche contact et les {n} réseaux',
    qrPlain: 'Scannez pour enregistrer le contact', addWallet: 'Ajouter à Apple Wallet',
    allLinks: 'Tous les liens', nLinks: '{n} réseaux', oneLink: '1 réseau',
    emptyTitle: 'Votre première carte', emptyText: 'Créez une carte de visite numérique et partagez-la d’un QR code.',
    signedOutTitle: 'Digital QR Cards', signedOutText: 'Connectez-vous pour créer et partager vos cartes de visite.',
    createFirst: 'Créer ma carte', signIn: 'Se connecter',
    cancel: 'Annuler', editCard: 'Modifier la carte', ok: 'OK',
    identity: 'Identité', fullName: 'Nom complet', title: 'Poste', company: 'Société',
    contact: 'Coordonnées', phone: 'Téléphone', email: 'E-mail', website: 'Site web', address: 'Adresse',
    networks: 'Réseaux et messageries', addNetwork: 'Ajouter un réseau', addToCard: 'Ajouter à la carte',
    linkName: 'Nom du lien', style: 'Style de la carte', navy: 'Marine', white: 'Blanc', sky: 'Ciel',
    addPhoto: 'Ajouter une photo', photo: 'Photo', removePhoto: 'Retirer la photo', photoError: 'Cette image n’a pas pu être traitée.',
    deleteCard: 'Supprimer la carte', deleteCardQ: 'Supprimer cette carte ?', cannotUndo: 'Cette action est définitive.',
    delete: 'Supprimer', nameRequired: 'Indiquez un nom pour la carte.', saving: 'Enregistrement…',
    account: 'Compte', signedInAs: 'Connecté', cardsUsed: 'Cartes', help: 'Aide et contact', privacy: 'Confidentialité',
    signOut: 'Se déconnecter', deleteAccount: 'Supprimer mon compte',
    deleteAccountQ: 'Supprimer votre compte ?', deleteAccountText: 'Votre compte et toutes vos cartes seront supprimés définitivement.',
    typeDelete: 'Tapez DELETE pour confirmer', continue: 'Continuer', confirm: 'Confirmer',
    login: 'Connexion', register: 'Créer un compte', password: 'Mot de passe', registerBtn: 'Créer mon compte',
    forgot: 'Mot de passe oublié ?', sendReset: 'Envoyer le lien', backToLogin: 'Retour à la connexion',
    noAccount: 'Pas de compte ?', haveAccount: 'Déjà un compte ?', loading: 'Chargement…',
    errFields: 'Remplissez l’e-mail et un mot de passe de 6 caractères minimum.', errCreds: 'E-mail ou mot de passe incorrect.',
    errExists: 'Un compte existe déjà avec cet e-mail. Connectez-vous.', errGeneric: 'Une erreur est survenue. Réessayez.',
    errMail: 'Saisissez une adresse e-mail valide.', resetSent: 'Si un compte existe pour cette adresse, un e-mail de réinitialisation vient d’être envoyé. Pensez à vérifier vos spams.',
    errNetwork: 'Erreur réseau. Réessayez.', freeNote: 'Gratuit, sans achat intégré.',
  },
  en: {
    myCards: 'My cards', cards: 'Cards', settings: 'Settings',
    share: 'Share', links: 'Links', wallet: 'Apple Wallet', edit: 'Edit', newCard: 'New card',
    shareTitle: 'Share my card', qrWithLinks: 'The QR holds the contact card and {n} links',
    qrPlain: 'Scan to save the contact', addWallet: 'Add to Apple Wallet',
    allLinks: 'All links', nLinks: '{n} links', oneLink: '1 link',
    emptyTitle: 'Your first card', emptyText: 'Create a digital business card and share it with a QR code.',
    signedOutTitle: 'Digital QR Cards', signedOutText: 'Sign in to create and share your business cards.',
    createFirst: 'Create my card', signIn: 'Sign in',
    cancel: 'Cancel', editCard: 'Edit card', ok: 'Done',
    identity: 'Identity', fullName: 'Full name', title: 'Title', company: 'Company',
    contact: 'Contact', phone: 'Phone', email: 'Email', website: 'Website', address: 'Address',
    networks: 'Networks & messaging', addNetwork: 'Add a network', addToCard: 'Add to card',
    linkName: 'Link name', style: 'Card style', navy: 'Navy', white: 'White', sky: 'Sky',
    addPhoto: 'Add a photo', photo: 'Photo', removePhoto: 'Remove photo', photoError: 'This image could not be processed.',
    deleteCard: 'Delete card', deleteCardQ: 'Delete this card?', cannotUndo: 'This cannot be undone.',
    delete: 'Delete', nameRequired: 'Enter a name for the card.', saving: 'Saving…',
    account: 'Account', signedInAs: 'Signed in', cardsUsed: 'Cards', help: 'Help & contact', privacy: 'Privacy policy',
    signOut: 'Sign out', deleteAccount: 'Delete my account',
    deleteAccountQ: 'Delete your account?', deleteAccountText: 'Your account and all your cards will be permanently deleted.',
    typeDelete: 'Type DELETE to confirm', continue: 'Continue', confirm: 'Confirm',
    login: 'Sign in', register: 'Create account', password: 'Password', registerBtn: 'Create my account',
    forgot: 'Forgot password?', sendReset: 'Send reset link', backToLogin: 'Back to sign in',
    noAccount: 'No account?', haveAccount: 'Already have an account?', loading: 'Loading…',
    errFields: 'Enter your email and a password of at least 6 characters.', errCreds: 'Incorrect email or password.',
    errExists: 'An account with this email already exists. Please sign in.', errGeneric: 'Something went wrong. Please try again.',
    errMail: 'Enter a valid email address.', resetSent: 'If an account exists for this address, a reset email has just been sent. Check your spam folder.',
    errNetwork: 'Network error. Please try again.', freeNote: 'Free, no in-app purchases.',
  },
};

const LANG = (typeof navigator !== 'undefined' && /^fr/i.test(navigator.language || '')) ? 'fr' : 'en';
export const S = STR[LANG];
const fmt = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k]);

// ---------- Icons (stroke set from the design's Icon component) ----------

const PATHS = {
  edit: 'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z',
  qr: 'M3 3h5v5H3z M16 3h5v5h-5z M3 16h5v5H3z M21 16h-3a2 2 0 0 0-2 2v3 M21 21v.01 M12 7v3a2 2 0 0 1-2 2H7 M3 12h.01 M12 3h.01 M12 16v.01 M16 12h1 M21 12v.01 M12 21v-1',
  wallet: 'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1 M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4',
  trash: 'M3 6h18 M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6 M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2',
  card: 'M2 5h20v14H2z M2 10h20',
  settings: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
  mail: 'M2 4h20v16H2z M22 7l-10 6L2 7',
  globe: 'M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20 M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20 M2 12h20',
  pin: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z M12 7a3 3 0 1 0 0 6a3 3 0 1 0 0-6',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  x: 'M18 6L6 18 M6 6l12 12',
  plus: 'M5 12h14 M12 5v14',
  left: 'M15 18l-6-6l6-6',
  right: 'M9 18l6-6l-6-6',
  check: 'M20 6L9 17l-5-5',
  camera: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z M12 10a3 3 0 1 0 0 6a3 3 0 1 0 0-6',
};

export const Icon = ({ name, size = 20, stroke = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke}
    strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flex: 'none' }} aria-hidden="true">
    <path d={PATHS[name] || ''} />
  </svg>
);

// ---------- Card data helpers ----------

const CORE = ['title', 'company', 'phone', 'email', 'website', 'location'];

// The 23 platforms of the design's picker, monograms from the app's SOCIAL_ICONS_MAP.
const PLATFORMS = [
  ['linkedin', 'LinkedIn', 'LK'], ['instagram', 'Instagram', 'IG'], ['whatsapp', 'WhatsApp', 'WA'], ['telegram', 'Telegram', 'TG'],
  ['snapchat', 'Snapchat', 'SC'], ['tiktok', 'TikTok', 'TK'], ['twitter', 'X', 'X'], ['youtube', 'YouTube', 'YT'],
  ['facebook', 'Facebook', 'FB'], ['messenger', 'Messenger', 'MS'], ['discord', 'Discord', 'DC'], ['signal', 'Signal', 'SI'],
  ['twitch', 'Twitch', 'TW'], ['reddit', 'Reddit', 'RD'], ['bluesky', 'Bluesky', 'BS'], ['mastodon', 'Mastodon', 'MD'],
  ['wechat', 'WeChat', 'WC'], ['line', 'Line', 'LN'], ['zalo', 'Zalo', 'ZL'], ['spotify', 'Spotify', 'SP'],
  ['soundcloud', 'SoundCloud', 'SC'], ['pinterest', 'Pinterest', 'PI'], ['custom', LANG === 'fr' ? 'Lien perso' : 'Custom link', '★'],
].map(([type, label, mono]) => ({ type, label, mono }));

// Older cards may hold types outside the picker (or extra phones/emails).
const EXTRA_LABELS = {
  mixcloud: ['Mixcloud', 'MX'], bandcamp: ['Bandcamp', 'BC'], bitchat: ['BitChat', 'BC'], skype: ['Skype', 'SK'], viber: ['Viber', 'VB'],
  title: [S.title, 'PO'], company: [S.company, 'SO'], phone: [S.phone, 'TEL'], email: [S.email, '@'], website: [S.website, 'WWW'], location: [S.address, 'ADR'],
};

const PHONE_TYPES = ['phone', 'whatsapp', 'zalo'];

const PLACEHOLDERS = {
  whatsapp: '6 12 34 56 78', zalo: '912 345 678', linkedin: 'linkedin.com/in/…', custom: 'https://…',
  youtube: '@chaine', website: 'monsite.com',
};

export const platformOf = (type) => {
  const p = PLATFORMS.find(x => x.type === type);
  if (p) return p;
  const e = EXTRA_LABELS[type];
  if (e) return { type, label: e[0], mono: e[1] };
  const t = String(type || '');
  return { type: t, label: t.charAt(0).toUpperCase() + t.slice(1), mono: t.slice(0, 2).toUpperCase() };
};

const withHttps = (v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`);
const looksLikeUrl = (v) => /^https?:\/\//i.test(v) || /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v);
const handle = (v) => v.replace(/^@/, '');

export const buildSocialUrl = (type, value) => {
  const v = String(value || '').trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  switch (type) {
    case 'whatsapp': return `https://wa.me/${v.replace(/[^0-9]/g, '')}`;
    case 'zalo': return `https://zalo.me/${v.replace(/[^0-9]/g, '')}`;
    case 'instagram': return `https://instagram.com/${handle(v)}`;
    case 'twitter': return `https://x.com/${handle(v)}`;
    case 'linkedin': return v.includes('linkedin.com') ? withHttps(v) : `https://linkedin.com/in/${handle(v)}`;
    case 'facebook': return v.includes('facebook.com') ? withHttps(v) : `https://facebook.com/${handle(v)}`;
    case 'tiktok': return `https://tiktok.com/@${handle(v)}`;
    case 'telegram': return `https://t.me/${handle(v)}`;
    case 'snapchat': return `https://snapchat.com/add/${handle(v)}`;
    case 'youtube': return v.includes('youtube.com') ? withHttps(v) : `https://youtube.com/@${handle(v)}`;
    case 'messenger': return `https://m.me/${handle(v)}`;
    case 'twitch': return `https://twitch.tv/${handle(v)}`;
    case 'reddit': return `https://reddit.com/user/${handle(v).replace(/^u\//, '')}`;
    case 'bluesky': return `https://bsky.app/profile/${handle(v)}`;
    case 'line': return `https://line.me/ti/p/~${handle(v)}`;
    case 'spotify': return v.includes('spotify.com') ? withHttps(v) : `https://open.spotify.com/user/${handle(v)}`;
    case 'soundcloud': return `https://soundcloud.com/${handle(v)}`;
    case 'pinterest': return `https://pinterest.com/${handle(v)}`;
    default: return looksLikeUrl(v) ? withHttps(v) : v;
  }
};

const legacyFields = (card) => [
  { type: 'title', value: card.title }, { type: 'company', value: card.company },
  { type: 'phone', value: card.phone }, { type: 'email', value: card.email },
  { type: 'website', value: card.website }, { type: 'location', value: card.location || card.address },
  { type: 'custom', value: card.extra || card.extraValue, label: card.extraLabel || '' },
].filter(f => f.value);

export const fieldsOf = (card) => (Array.isArray(card?.fields) ? card.fields : legacyFields(card || {}))
  .filter(f => f && f.type && String(f.value || '').trim() !== '');

// First value of each core type; everything else (networks, extra phones…) is a "link".
export const cardData = (card) => {
  const core = {};
  const links = [];
  fieldsOf(card).forEach(f => {
    if (CORE.includes(f.type) && core[f.type] === undefined) core[f.type] = String(f.value).trim();
    else links.push(f);
  });
  return { ...core, links };
};

export const linkHref = (f) => {
  const v = String(f.value || '').trim();
  if (f.type === 'phone') return `tel:${v.replace(/[^\d+]/g, '')}`;
  if (f.type === 'email') return `mailto:${v}`;
  if (f.type === 'location') return `https://maps.apple.com/?q=${encodeURIComponent(v)}`;
  return buildSocialUrl(f.type, v);
};

export const openExternal = (url) => {
  if (!url) return;
  if (/^https?:\/\//i.test(url)) {
    if (Capacitor.isNativePlatform()) Browser.open({ url });
    else window.open(url, '_blank', 'noopener');
  } else {
    window.location.href = url;
  }
};

// vCard 3.0 for the share QR: contact fields plus every network as a typed URL.
export const cardToVCard = (card) => {
  const d = cardData(card);
  const name = (card.name || '').trim();
  const parts = name.split(/\s+/);
  const last = parts.length > 1 ? parts.pop() : '';
  const first = parts.join(' ');
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${last};${first};;;`, `FN:${name}`];
  if (d.company) lines.push(`ORG:${d.company}`);
  if (d.title) lines.push(`TITLE:${d.title}`);
  if (d.phone) lines.push(`TEL;TYPE=CELL:${d.phone}`);
  if (d.email) lines.push(`EMAIL;TYPE=WORK:${d.email}`);
  if (d.website) lines.push(`URL:${withHttps(d.website)}`);
  if (d.location) lines.push(`ADR;TYPE=WORK:;;${d.location};;;;`);
  d.links.forEach(f => {
    const v = String(f.value).trim();
    if (f.type === 'phone') { lines.push(`TEL;TYPE=CELL:${v}`); return; }
    if (f.type === 'email') { lines.push(`EMAIL;TYPE=WORK:${v}`); return; }
    if (f.type === 'location') { lines.push(`ADR;TYPE=WORK:;;${v};;;;`); return; }
    const url = buildSocialUrl(f.type, v);
    const label = (f.type === 'custom' && f.label) ? f.label : platformOf(f.type).label;
    if (/^https?:\/\//i.test(url)) lines.push(`URL;TYPE=${label.replace(/[;:,]/g, ' ')}:${url}`);
    else lines.push(`NOTE:${label}: ${v}`);
  });
  lines.push('END:VCARD');
  return lines.join('\r\n');
};

export const AIR_THEMES = {
  'air-navy': { bg: '#0a1a3a', fg: '#ffffff', sub: 'rgba(255,255,255,.66)', chip: 'rgba(255,255,255,.12)', mono: '#ffffff', monoFg: '#0a1a3a', more: 'rgba(255,255,255,.35)' },
  'air-white': { bg: '#ffffff', fg: '#0a1a3a', sub: 'rgba(10,26,58,.6)', chip: 'rgba(10,26,58,.07)', mono: '#0a1a3a', monoFg: '#ffffff', more: 'rgba(10,26,58,.25)' },
  'air-sky': { bg: '#8fb5ff', fg: '#0a1a3a', sub: 'rgba(10,26,58,.68)', chip: 'rgba(10,26,58,.1)', mono: '#ffffff', monoFg: '#0a1a3a', more: 'rgba(10,26,58,.3)' },
};
export const AIR_ROTATION = ['air-navy', 'air-white', 'air-sky'];
// Cards saved before Air keep their data; their colour follows the carousel position.
export const themeKeyOf = (card, index) => (AIR_THEMES[card?.theme] ? card.theme : AIR_ROTATION[(index || 0) % 3]);

export const splitName = (name) => {
  const w = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (w.length < 2) return { first: w[0] || '', last: '' };
  return { first: w.slice(0, -1).join(' '), last: w[w.length - 1] };
};

export const initialsOf = (name) => {
  const w = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!w.length) return '?';
  if (w.length === 1) return w[0].slice(0, 2).toUpperCase();
  return (w[0][0] + w[w.length - 1][0]).toUpperCase();
};

const nameSize = (first, last) => {
  const longest = Math.max(first.length, last.length, 4);
  return Math.max(28, Math.min(50, Math.floor(520 / longest)));
};

const stripProto = (v) => String(v || '').replace(/^https?:\/\//i, '').replace(/\/$/, '');

// ---------- Sheet primitives ----------

const Sheet = ({ onClose, children, center = false, label }) => (
  <div className="air-overlay" onClick={onClose} role="dialog" aria-label={label}>
    <div className={`air-sheet${center ? ' center' : ''}`} onClick={e => e.stopPropagation()}>
      <div className="air-grab" />
      {children}
    </div>
  </div>
);

const SheetHead = ({ title, sub, onClose, onBack }) => (
  <div className="air-sheet-head">
    {onBack && <button type="button" className="air-x" onClick={onBack} aria-label="Back"><Icon name="left" size={16} stroke={2} /></button>}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
      <span className="air-sheet-title">{title}</span>
      {sub && <span className="air-sheet-sub">{sub}</span>}
    </div>
    <button type="button" className="air-x" onClick={onClose} aria-label="Close"><Icon name="x" size={16} stroke={2} /></button>
  </div>
);

export const AirToast = ({ message }) => {
  if (!message || !message.text) return null;
  return (
    <div className={`air-toast${message.type === 'error' ? ' error' : ''}`} role="status">
      {message.type === 'success' && <Icon name="check" size={16} stroke={2} />}
      <span>{message.text}</span>
    </div>
  );
};

// ---------- Card face ----------

export const AirCardFace = ({ card, index, onOpenLinks }) => {
  const th = AIR_THEMES[themeKeyOf(card, index)];
  const d = cardData(card);
  const { first, last } = splitName(card.name);
  const size = nameSize(first, last);
  const shown = d.links.slice(0, 4);
  return (
    <div className="air-card" style={{ background: th.bg, color: th.fg }}>
      <div className="air-card-top">
        <div className="air-avatar" style={{ background: th.chip }}>
          {card.image ? <img src={card.image} alt="" /> : initialsOf(card.name)}
        </div>
        {d.company && <div className="air-chip" style={{ background: th.chip }}><span>{d.company}</span></div>}
      </div>
      <div style={{ flex: 1, minHeight: 12 }} />
      <div className="air-name" style={{ fontSize: size }}>
        {first && <span>{first}</span>}
        {last && <span>{last}</span>}
      </div>
      {d.title && <span className="air-role" style={{ color: th.sub }}>{d.title}</span>}
      {(d.phone || d.email || d.website) && (
        <div className="air-contact-row">
          {d.phone && <a className="air-pill-btn" style={{ background: th.chip }} href={linkHref({ type: 'phone', value: d.phone })} aria-label={S.phone}><Icon name="phone" size={17} /></a>}
          {d.email && <a className="air-pill-btn" style={{ background: th.chip }} href={linkHref({ type: 'email', value: d.email })} aria-label={S.email}><Icon name="mail" size={17} /></a>}
          {d.website && (
            <button type="button" className="air-pill-btn wide" style={{ background: th.chip }} onClick={() => openExternal(withHttps(d.website))}>
              <Icon name="globe" size={17} /><span>{stripProto(d.website)}</span>
            </button>
          )}
        </div>
      )}
      {shown.length > 0 && (
        <button type="button" className="air-socials" onClick={onOpenLinks} aria-label={S.allLinks}>
          {shown.map((f, i) => (
            <span key={i} className="air-mono" style={{ background: th.mono, color: th.monoFg }}>{platformOf(f.type).mono}</span>
          ))}
          {d.links.length > 4 && <span className="air-more" style={{ border: `1.5px solid ${th.more}` }}>+{d.links.length - 4}</span>}
        </button>
      )}
    </div>
  );
};

// ---------- Home ----------

export const AirHome = ({ user, cards, activeIndex, onIndexChange, canAdd, canWallet, onNew, onEdit, onShare, onLinks, onWallet, onSignIn, logo }) => {
  const trackRef = useRef(null);
  const scrolling = useRef(false);

  const step = () => {
    const el = trackRef.current;
    const first = el && el.firstElementChild;
    return first ? first.getBoundingClientRect().width + 12 : 1;
  };

  // Keep the scroll position in sync when the index changes from outside (dots, save).
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const current = Math.round(el.scrollLeft / step());
    if (current !== activeIndex) el.scrollTo({ left: activeIndex * step(), behavior: scrolling.current ? 'smooth' : 'auto' });
    scrolling.current = true;
  }, [activeIndex, cards.length]);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / step());
    if (i !== activeIndex && i >= 0 && i < cards.length) onIndexChange(i);
  };

  const active = cards[activeIndex] || cards[0];
  const activeLinks = active ? cardData(active).links.length : 0;

  return (
    <div className="air-home">
      <header className="air-header">
        <h1 className="air-h1">{S.myCards}</h1>
        {user && canAdd && (
          <button type="button" className="air-round" onClick={onNew} aria-label={S.newCard}><Icon name="plus" size={20} stroke={2} /></button>
        )}
      </header>

      {!user || cards.length === 0 ? (
        <div className="air-empty">
          <div className="air-empty-mark">{logo}</div>
          <h2>{user ? S.emptyTitle : S.signedOutTitle}</h2>
          <p>{user ? S.emptyText : S.signedOutText}</p>
          {user
            ? <button type="button" className="air-btn-main" onClick={onNew}><Icon name="plus" size={20} stroke={2} />{S.createFirst}</button>
            : <button type="button" className="air-btn-main" onClick={onSignIn}>{S.signIn}</button>}
        </div>
      ) : (
        <>
          <div className="air-track" ref={trackRef} onScroll={onScroll}>
            {cards.map((card, i) => (
              <div className="air-slide" key={card.id || i}>
                <AirCardFace card={card} index={i} onOpenLinks={() => onLinks(card)} />
              </div>
            ))}
          </div>
          {cards.length > 1 && (
            <div className="air-dots">
              {cards.map((c, i) => (
                <button key={c.id || i} type="button" className="air-dot" aria-label={`${i + 1}`}
                  onClick={() => onIndexChange(i)}
                  style={{ width: i === activeIndex ? 22 : 6, background: i === activeIndex ? '#0a1a3a' : 'rgba(10,26,58,.22)' }} />
              ))}
            </div>
          )}
          {active && (
            <div className="air-actions">
              <button type="button" className="air-btn-main" onClick={() => onShare(active)}><Icon name="qr" size={20} stroke={1.8} />{S.share}</button>
              {activeLinks > 0 && (
                <button type="button" className="air-btn-white" onClick={() => onLinks(active)}><Icon name="link" size={18} stroke={1.8} />{S.links}</button>
              )}
              {canWallet && (
                <button type="button" className="air-btn-circle" onClick={() => onWallet(active)} aria-label={S.addWallet}><Icon name="wallet" size={21} stroke={1.8} /></button>
              )}
              <button type="button" className="air-btn-circle" onClick={() => onEdit(active)} aria-label={S.edit}><Icon name="edit" size={19} stroke={1.8} /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ---------- Share + links sheets ----------

export const ShareSheet = ({ card, canWallet, onWallet, onClose }) => {
  const d = cardData(card);
  const n = d.links.length;
  const qrSize = Math.min(246, (typeof window !== 'undefined' ? window.innerWidth : 402) - 140);
  return (
    <Sheet onClose={onClose} center label={S.shareTitle}>
      <SheetHead title={S.shareTitle} onClose={onClose} />
      <div className="air-qr-box">
        <QRCodeSVG value={cardToVCard(card)} size={qrSize} level="M" bgColor="#eef4ff" fgColor="#0a1a3a" />
      </div>
      <div className="air-share-name">
        <strong>{card.name}</strong>
        <span>{n > 0 ? fmt(S.qrWithLinks, { n }) : ([d.title, d.company].filter(Boolean).join(' · ') || S.qrPlain)}</span>
      </div>
      {canWallet && (
        <button type="button" className="air-btn-wallet" onClick={() => onWallet(card)}><Icon name="wallet" size={19} stroke={1.8} />{S.addWallet}</button>
      )}
    </Sheet>
  );
};

export const LinksSheet = ({ card, onClose }) => {
  const { links } = cardData(card);
  return (
    <Sheet onClose={onClose} label={S.allLinks}>
      <SheetHead title={S.allLinks} sub={`${links.length === 1 ? S.oneLink : fmt(S.nLinks, { n: links.length })} · ${card.name}`} onClose={onClose} />
      <div className="air-list">
        {links.map((f, i) => {
          const p = platformOf(f.type);
          const label = f.type === 'custom' && f.label ? f.label : p.label;
          return (
            <button key={i} type="button" className="air-list-row" onClick={() => openExternal(linkHref(f))}>
              <span className="air-mono-sq">{p.mono}</span>
              <span className="air-list-text"><b>{label}</b><small>{f.value}</small></span>
              <span style={{ color: 'rgba(10,26,58,.35)' }}><Icon name="right" size={18} stroke={2} /></span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
};

// ---------- Phone input (country code + number) ----------

const BY_DIAL = [...COUNTRY_OPTIONS].sort((a, b) => b.dial.length - a.dial.length);
const BY_NAME = [...COUNTRY_OPTIONS].sort((a, b) => a.name.localeCompare(b.name));

const PhoneInput = ({ value, onChange, placeholder, autoFocus, className }) => {
  const v = value || '';
  const match = BY_DIAL.find(o => v.startsWith(o.dial));
  const dial = match ? match.dial : '';
  const rest = match ? v.slice(dial.length) : v;
  return (
    <div className={`air-phone ${className || ''}`}>
      <select value={dial} onChange={e => onChange(e.target.value + rest.replace(/^\+\d*/, ''))} aria-label="Country code">
        <option value="">🌐</option>
        {BY_NAME.map(o => <option key={o.code} value={o.dial}>{o.flag} {o.dial}</option>)}
      </select>
      <input type="tel" inputMode="tel" value={rest} placeholder={placeholder} autoFocus={autoFocus}
        onChange={e => onChange(dial + e.target.value)} />
    </div>
  );
};

// ---------- Photo compression (photo is stored inside the 50KB fields column) ----------

const compressImage = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const BUDGET = 44000; // base64 chars
      const render = (maxDim, quality) => {
        let w = img.width, h = img.height;
        if (w > h) { if (w > maxDim) { h *= maxDim / w; w = maxDim; } }
        else if (h > maxDim) { w *= maxDim / h; h = maxDim; }
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        return c.toDataURL('image/jpeg', quality);
      };
      const steps = [[400, 0.72], [360, 0.65], [320, 0.6], [280, 0.5], [240, 0.45], [200, 0.4]];
      let out = '';
      for (const [dim, q] of steps) { out = render(dim, q); if (out.length <= BUDGET) break; }
      resolve(out);
    };
    img.onerror = () => reject(new Error('image'));
    img.src = event.target.result;
  };
  reader.onerror = () => reject(new Error('read'));
  reader.readAsDataURL(file);
});

// ---------- Editor ----------

export const AirEditor = ({ card, defaultTheme, isSaving, onSave, onCancel, onDelete }) => {
  const isNew = !card;
  const init = cardData(card || {});
  const [name, setName] = useState(card?.name || '');
  const [image, setImage] = useState(card?.image || '');
  const [theme, setTheme] = useState(AIR_THEMES[card?.theme] ? card.theme : (defaultTheme || 'air-navy'));
  const [core, setCore] = useState({
    title: init.title || '', company: init.company || '', phone: init.phone || '',
    email: init.email || '', website: init.website || '', location: init.location || '',
  });
  const [nets, setNets] = useState(init.links.map(f => ({ ...f })));
  const [picker, setPicker] = useState(false);
  const [pending, setPending] = useState(null);
  const [draft, setDraft] = useState('');
  const [draftLabel, setDraftLabel] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  const setC = (k) => (e) => setCore(c => ({ ...c, [k]: typeof e === 'string' ? e : e.target.value }));
  const used = new Set(nets.map(n => n.type));

  const save = () => {
    if (!name.trim()) { setError(S.nameRequired); return; }
    const fields = [
      ...CORE.filter(k => core[k].trim()).map(k => ({ type: k, value: core[k].trim() })),
      ...nets.filter(n => String(n.value || '').trim()).map(n => (n.type === 'custom' ? { type: 'custom', value: n.value.trim(), label: n.label || '' } : { type: n.type, value: n.value.trim() })),
    ];
    onSave({ id: card?.id, name: name.trim(), image, theme, fields, card_order: card?.card_order });
  };

  const onPhoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try { setImage(await compressImage(file)); } catch { setError(S.photoError); }
  };

  const closePicker = () => { setPicker(false); setPending(null); setDraft(''); setDraftLabel(''); };
  const addNet = () => {
    const v = draft.trim();
    if (!v || !pending) return;
    setNets(n => [...n, pending === 'custom' ? { type: 'custom', value: v, label: draftLabel.trim() } : { type: pending, value: v }]);
    closePicker();
  };

  const roleLine = [core.title, core.company].filter(Boolean).join(' · ');
  const pend = pending ? platformOf(pending) : null;

  return (
    <div className="air-editor">
      <div className="air-editor-bar">
        <button type="button" className="air-bar-btn" onClick={onCancel}>{S.cancel}</button>
        <span className="air-bar-title">{isNew ? S.newCard : S.editCard}</span>
        <button type="button" className="air-bar-btn primary" onClick={save} disabled={isSaving}>{isSaving ? '…' : S.ok}</button>
      </div>

      <div className="air-editor-body">
        <div className="air-summary" style={{ background: AIR_THEMES[theme].bg, color: AIR_THEMES[theme].fg, boxShadow: theme === 'air-white' ? '0 1px 0 rgba(10,26,58,.06)' : 'none' }}>
          <label className="air-summary-photo" htmlFor="air-photo-input" aria-label={image ? S.photo : S.addPhoto}>
            <div className="air-avatar" style={{ background: AIR_THEMES[theme].chip }}>
              {image ? <img src={image} alt="" /> : initialsOf(name)}
            </div>
            <span className="air-photo-badge"><Icon name="camera" size={12} stroke={2} /></span>
          </label>
          <input id="air-photo-input" type="file" accept="image/*" onChange={onPhoto}
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden', pointerEvents: 'none' }} />
          <div className="air-summary-text">
            <b>{name || S.fullName}</b>
            <span style={{ color: AIR_THEMES[theme].sub }}>{roleLine || (image ? S.photo : S.addPhoto)}</span>
          </div>
          {image && (
            <button type="button" className="air-mini-x" onClick={() => setImage('')} aria-label={S.removePhoto}
              style={{ background: AIR_THEMES[theme].chip, color: AIR_THEMES[theme].fg }}><Icon name="x" size={14} stroke={2} /></button>
          )}
        </div>

        {error && <div className="air-msg error">{error}</div>}

        <div className="air-section">
          <div className="air-section-head"><span>{S.identity}</span></div>
          <div className="air-group">
            <div className="air-field"><label>{S.fullName}</label>
              <input value={name} onChange={e => { setName(e.target.value); setError(''); }} placeholder="Marie Dupont" autoComplete="name" /></div>
            <div className="air-field"><label>{S.title}</label>
              <input value={core.title} onChange={setC('title')} placeholder={LANG === 'fr' ? 'Directrice marketing' : 'Marketing Director'} /></div>
            <div className="air-field"><label>{S.company}</label>
              <input value={core.company} onChange={setC('company')} placeholder="BrightLabs" /></div>
          </div>
        </div>

        <div className="air-section">
          <div className="air-section-head"><span>{S.contact}</span></div>
          <div className="air-group">
            <div className="air-field"><label>{S.phone}</label>
              <PhoneInput value={core.phone} onChange={setC('phone')} placeholder="6 12 34 56 78" /></div>
            <div className="air-field"><label>{S.email}</label>
              <input type="email" inputMode="email" autoCapitalize="off" value={core.email} onChange={setC('email')} placeholder="marie@brightlabs.fr" /></div>
            <div className="air-field"><label>{S.website}</label>
              <input type="url" inputMode="url" autoCapitalize="off" value={core.website} onChange={setC('website')} placeholder="brightlabs.fr" /></div>
            <div className="air-field"><label>{S.address}</label>
              <input value={core.location} onChange={setC('location')} placeholder="Paris" /></div>
          </div>
        </div>

        <div className="air-section">
          <div className="air-section-head"><span>{S.networks}</span><span>{nets.length}</span></div>
          <div className="air-group">
            {nets.map((n, i) => {
              const p = platformOf(n.type);
              const upd = (val) => setNets(list => list.map((x, j) => (j === i ? { ...x, value: val } : x)));
              return (
                <div className="air-net-row" key={i}>
                  <span className="air-mono-sq">{p.mono}</span>
                  <span className="air-list-text">
                    <small>{n.type === 'custom' && n.label ? n.label : p.label}</small>
                    {PHONE_TYPES.includes(n.type)
                      ? <PhoneInput value={n.value} onChange={upd} />
                      : <input value={n.value} autoCapitalize="off" onChange={e => upd(e.target.value)} />}
                  </span>
                  <button type="button" className="air-mini-x" onClick={() => setNets(list => list.filter((_, j) => j !== i))} aria-label={S.delete}>
                    <Icon name="x" size={14} stroke={2} />
                  </button>
                </div>
              );
            })}
            <button type="button" className="air-add-row" onClick={() => setPicker(true)}>
              <span className="plus"><Icon name="plus" size={18} stroke={2} /></span>{S.addNetwork}
            </button>
          </div>
        </div>

        <div className="air-section">
          <div className="air-section-head"><span>{S.style}</span></div>
          <div className="air-swatches">
            {AIR_ROTATION.map(k => (
              <button type="button" key={k} className={`air-swatch${theme === k ? ' active' : ''}`} onClick={() => setTheme(k)}
                style={{ background: AIR_THEMES[k].bg, color: AIR_THEMES[k].fg }}>
                {S[k.replace('air-', '')]}
              </button>
            ))}
          </div>
        </div>

        {!isNew && (
          <button type="button" className="air-danger-btn" onClick={() => setConfirmDelete(true)}>
            <Icon name="trash" size={18} stroke={1.8} />{S.deleteCard}
          </button>
        )}
      </div>

      {picker && !pending && (
        <Sheet onClose={closePicker} label={S.addNetwork}>
          <SheetHead title={S.addNetwork} onClose={closePicker} />
          <div className="air-grid">
            {PLATFORMS.map(p => {
              const taken = used.has(p.type) && p.type !== 'custom';
              return (
                <button type="button" key={p.type} className="air-grid-btn" style={{ opacity: taken ? 0.35 : 1 }}
                  onClick={() => { if (!taken) { setPending(p.type); setDraft(''); setDraftLabel(''); } }}>
                  <span className="mono">{p.mono}</span>
                  <span className="lbl">{p.label}</span>
                </button>
              );
            })}
          </div>
        </Sheet>
      )}

      {pend && (
        <Sheet onClose={closePicker} label={pend.label}>
          <div className="air-sheet-head">
            <button type="button" className="air-x" onClick={() => setPending(null)} aria-label="Back"><Icon name="left" size={16} stroke={2} /></button>
            <span className="air-mono-sq" style={{ width: 44, height: 44, borderRadius: 22, fontSize: 14 }}>{pend.mono}</span>
            <span className="air-sheet-title" style={{ flex: 1 }}>{pend.label}</span>
          </div>
          {pending === 'custom' && (
            <input className="air-input" value={draftLabel} onChange={e => setDraftLabel(e.target.value)} placeholder={S.linkName} />
          )}
          {PHONE_TYPES.includes(pending) ? (
            <div className="air-input" style={{ display: 'flex', alignItems: 'center' }}>
              <PhoneInput value={draft} onChange={setDraft} placeholder={PLACEHOLDERS[pending]} autoFocus className="grow" />
            </div>
          ) : (
            <input className="air-input" value={draft} autoFocus autoCapitalize="off" onChange={e => setDraft(e.target.value)}
              placeholder={PLACEHOLDERS[pending] || '@identifiant'} onKeyDown={e => { if (e.key === 'Enter') addNet(); }} />
          )}
          <button type="button" className="air-btn-block" onClick={addNet} disabled={!draft.trim()}>{S.addToCard}</button>
        </Sheet>
      )}

      {confirmDelete && (
        <ConfirmSheet title={S.deleteCardQ} text={S.cannotUndo} confirmLabel={S.delete}
          onConfirm={() => { setConfirmDelete(false); onDelete(card.id); }} onClose={() => setConfirmDelete(false)} />
      )}
    </div>
  );
};

// ---------- Confirm sheet ----------

export const ConfirmSheet = ({ title, text, confirmLabel, requireWord, onConfirm, onClose }) => {
  const [typed, setTyped] = useState('');
  const blocked = requireWord && typed.trim().toUpperCase() !== requireWord;
  return (
    <Sheet onClose={onClose} label={title}>
      <SheetHead title={title} onClose={onClose} />
      {text && <div className="air-msg" style={{ textAlign: 'left', padding: '0 4px' }}>{text}</div>}
      {requireWord && (
        <input className="air-input" value={typed} onChange={e => setTyped(e.target.value)} placeholder={requireWord}
          autoCapitalize="characters" style={{ textAlign: 'center' }} />
      )}
      <button type="button" className="air-btn-block danger" onClick={onConfirm} disabled={blocked}>{confirmLabel}</button>
      <button type="button" className="air-btn-block ghost" onClick={onClose}>{S.cancel}</button>
    </Sheet>
  );
};

// ---------- Settings ----------

export const AirSettings = ({ user, cardsCount, limit, onSignIn, onSignOut, onDeleteAccount }) => {
  const [step, setStep] = useState(0);
  return (
    <div className="air-settings">
      <header className="air-header"><h1 className="air-h1">{S.settings}</h1></header>
      <div className="air-settings-body">
        <div className="air-section">
          <div className="air-section-head"><span>{S.account}</span></div>
          <div className="air-group">
            {user ? (
              <>
                <div className="air-set-row"><span>{S.signedInAs}</span><span className="val">{user.email || ''}</span></div>
                <div className="air-set-row"><span>{S.cardsUsed}</span><span className="val">{cardsCount} / {limit}</span></div>
                <button type="button" className="air-set-row" onClick={onSignOut}><span>{S.signOut}</span><Icon name="right" size={18} stroke={2} /></button>
              </>
            ) : (
              <button type="button" className="air-set-row" onClick={onSignIn}><span>{S.signIn}</span><Icon name="right" size={18} stroke={2} /></button>
            )}
          </div>
        </div>

        <div className="air-section">
          <div className="air-group">
            <a className="air-set-row" href="mailto:support@digitalqrcard.xyz?subject=Digital%20QR%20Cards"><span>{S.help}</span><Icon name="mail" size={18} stroke={1.8} /></a>
            <button type="button" className="air-set-row" onClick={() => openExternal('https://www.digitalqrcard.xyz/privacy.html')}><span>{S.privacy}</span><Icon name="right" size={18} stroke={2} /></button>
          </div>
        </div>

        {user && (
          <div className="air-group">
            <button type="button" className="air-set-row danger" onClick={() => setStep(1)}><span>{S.deleteAccount}</span><Icon name="trash" size={18} stroke={1.8} /></button>
          </div>
        )}

        <div className="air-footnote">Digital QR Cards · {S.freeNote}</div>
      </div>

      {step === 1 && (
        <ConfirmSheet title={S.deleteAccountQ} text={S.deleteAccountText} confirmLabel={S.continue}
          onConfirm={() => setStep(2)} onClose={() => setStep(0)} />
      )}
      {step === 2 && (
        <ConfirmSheet title={S.typeDelete} confirmLabel={S.deleteAccount} requireWord="DELETE"
          onConfirm={() => { setStep(0); onDeleteAccount(); }} onClose={() => setStep(0)} />
      )}
    </div>
  );
};

// ---------- Tab bar ----------

export const AirTabBar = ({ view, onChange }) => (
  <nav className="air-tabbar">
    <button type="button" className={`air-tab${view !== 'settings' ? ' active' : ''}`} onClick={() => onChange('dashboard')}>
      <Icon name="card" size={18} />{S.cards}
    </button>
    <button type="button" className={`air-tab${view === 'settings' ? ' active' : ''}`} onClick={() => onChange('settings')}>
      <Icon name="settings" size={18} />{S.settings}
    </button>
  </nav>
);

// ---------- Sign-in sheet ----------

export const AuthSheet = ({ onClose, onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [forgotMsg, setForgotMsg] = useState(null);
  const [forgotSent, setForgotSent] = useState(false);

  const submit = async () => {
    if (loading) return;
    if (!email.trim() || password.length < 6) { setError(S.errFields); return; }
    setLoading(true); setError(null);
    try {
      const u = isRegister ? await signUp({ email: email.trim(), password }) : await signIn({ email: email.trim(), password });
      if (onLoginSuccess) onLoginSuccess(u);
      onClose();
    } catch (err) {
      const msg = String(err?.message || '');
      if (msg.includes('already') || msg.includes('exist') || err?.code === 409) {
        if (isRegister) { setIsRegister(false); setError(S.errExists); } else setError(S.errCreds);
      } else if (msg.includes('Invalid credentials') || msg.toLowerCase().includes('password') || err?.code === 401) {
        setError(S.errCreds);
      } else setError(msg || S.errGeneric);
    } finally { setLoading(false); }
  };

  const sendReset = async () => {
    const mail = email.trim();
    if (!mail.includes('@')) { setForgotMsg(S.errMail); return; }
    setLoading(true); setForgotMsg(null);
    try { await requestPasswordReset(mail); setForgotSent(true); setForgotMsg(S.resetSent); }
    catch { setForgotMsg(S.errNetwork); }
    finally { setLoading(false); }
  };

  return (
    <Sheet onClose={onClose} label={S.login}>
      <SheetHead title={forgot ? S.forgot : (isRegister ? S.register : S.login)} onClose={onClose} onBack={forgot ? () => { setForgot(false); setForgotMsg(null); setForgotSent(false); } : undefined} />
      <input className="air-input" type="email" inputMode="email" autoCapitalize="off" autoComplete="email"
        value={email} onChange={e => setEmail(e.target.value)} placeholder={S.email} />
      {!forgot && (
        <input className="air-input" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'}
          value={password} onChange={e => setPassword(e.target.value)} placeholder={S.password}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }} />
      )}
      {!forgot && error && <div className="air-msg error">{error}</div>}
      {forgot && forgotMsg && <div className={`air-msg ${forgotSent ? 'ok' : 'error'}`}>{forgotMsg}</div>}
      {forgot ? (
        !forgotSent && <button type="button" className="air-btn-block" onClick={sendReset} disabled={loading}>{loading ? S.loading : S.sendReset}</button>
      ) : (
        <button type="button" className="air-btn-block" onClick={submit} disabled={loading}>{loading ? S.loading : (isRegister ? S.registerBtn : S.signIn)}</button>
      )}
      {!forgot && !isRegister && (
        <button type="button" className="air-link-btn" onClick={() => { setForgot(true); setForgotMsg(null); setForgotSent(false); }}>{S.forgot}</button>
      )}
      {!forgot && (
        <div className="air-msg">
          {isRegister ? S.haveAccount : S.noAccount}{' '}
          <button type="button" className="air-link-btn" onClick={() => { setIsRegister(!isRegister); setError(null); }}>
            {isRegister ? S.signIn : S.register}
          </button>
        </div>
      )}
    </Sheet>
  );
};
