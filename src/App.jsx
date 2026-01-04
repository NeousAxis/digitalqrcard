
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Smartphone, Edit2, Trash2, Plus, Share2, Download,
  MapPin, Globe, Mail, Phone, Building2, Briefcase,
  User, Star, X, Check, Copy, LogIn, LogOut,
  CreditCard, Layout, Zap, Cloud, CloudOff, AlertCircle, RefreshCw, Gem,
  ChevronLeft, ChevronRight, Settings, ArrowUp, ArrowDown,
  Facebook, Linkedin, Instagram, Twitter, Youtube, MessageCircle, Twitch, Music
} from 'lucide-react';
// Firebase imports
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot, // Changed from getDocs to onSnapshot
  addDoc,
  setDoc,
  doc,
  deleteDoc
} from 'firebase/firestore';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
// --- Utils ---
const THEME_COLORS = {
  // Pantone Trends (2010-2024)
  'pantone-peach-fuzz': 'linear-gradient(135deg, #FFBE98 0%, #FFD1B3 100%)', // 2024
  'pantone-viva-magenta': 'linear-gradient(135deg, #BE3455 0%, #E63E6D 100%)', // 2023
  'pantone-very-peri': 'linear-gradient(135deg, #6667AB 0%, #8A8BCF 100%)', // 2022
  'pantone-classic-blue': 'linear-gradient(135deg, #0F4C81 0%, #1A6FB0 100%)', // 2020
  'pantone-living-coral': 'linear-gradient(135deg, #FF6F61 0%, #FF8F85 100%)', // 2019
  'pantone-ultra-violet': 'linear-gradient(135deg, #5F4B8B 0%, #7D63B8 100%)', // 2018
  'pantone-greenery': 'linear-gradient(135deg, #88B04B 0%, #AACC66 100%)', // 2017
  'pantone-serenity': 'linear-gradient(135deg, #91A8D0 0%, #B3CDE0 100%)', // 2016 (Blue)
  'pantone-rose-quartz': 'linear-gradient(135deg, #F7CAC9 0%, #FAD0C4 100%)', // 2016 (Pink)
  'pantone-radiant-orchid': 'linear-gradient(135deg, #B565A7 0%, #D691C9 100%)', // 2014
  'pantone-emerald': 'linear-gradient(135deg, #009473 0%, #00BC91 100%)', // 2013
  'pantone-honeysuckle': 'linear-gradient(135deg, #D65076 0%, #E86E8D 100%)', // 2011
  'pantone-turquoise': 'linear-gradient(135deg, #45B8AC 0%, #5ECFC4 100%)', // 2010
  'pantone-olivine': 'linear-gradient(135deg, #6A7051 0%, #8A916B 100%)', // Olive
};

// --- Firebase Config (replace with your own values) ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Debug: Check if config is loaded
console.log('Firebase Config Loaded:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKeyPresent: !!firebaseConfig.apiKey
});

// Initialize Firestore
// We use basic getFirestore() to ensure reliable online operation and avoid complex persistence state bugs.
const db = getFirestore(app);

const auth = getAuth(app);
// CRITICAL: Ensure persistence is LOCAL so user ID survives refresh
setPersistence(auth, browserLocalPersistence).catch(console.error);
const generateVCard = (card) => {
  const nameParts = card.name ? card.name.trim().split(/\s+/) : [];
  const lastName = nameParts.length > 1 ? nameParts.pop() : '';
  const firstName = nameParts.join(' ') || (card.name || '');
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;; `,
    `FN:${firstName} ${lastName} `,
    `ORG:${card.company}; `,
    `TITLE:${card.title} `,
    `TEL; TYPE = CELL, VOICE:${card.phone} `,
    `EMAIL; TYPE = WORK, INTERNET:${card.email} `,
    `URL:${card.website} `
  ];
  if (card.address) {
    lines.push(`ADR; TYPE = WORK: ;;${card.address};;;; `);
  }
  if (card.extraLabel && card.extraValue) {
    lines.push(`${card.extraLabel.toUpperCase()}:${card.extraValue} `);
  }
  lines.push('END:VCARD');
  return lines.join('\n');
};

const SUBSCRIPTION_LIMITS = {
  free: 1,
  basic: 3,
  pro: 5
};

// --- ISO Helper for Flags ---
// Extensive mapping of country codes to ISO 3166-1 alpha-2 and Dial Codes
// Constructed to support a dropdown.
// Format: code: { iso: 'US', dial_code: '+1' }
// But existing map is '1': 'US'. Let's expand it for the dropdown options logic.

const COUNTRY_OPTIONS = [
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'United States' },
  { code: 'CA', dial: '+1', flag: '🇨🇦', name: 'Canada' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'France' },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: 'CH', dial: '+41', flag: '🇨🇭', name: 'Switzerland' },
  { code: 'BE', dial: '+32', flag: '🇧🇪', name: 'Belgium' },
  { code: 'ES', dial: '+34', flag: '🇪🇸', name: 'Spain' },
  { code: 'IT', dial: '+39', flag: '🇮🇹', name: 'Italy' },
  { code: 'PT', dial: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: 'NL', dial: '+31', flag: '🇳🇱', name: 'Netherlands' },
  { code: 'LU', dial: '+352', flag: '🇱🇺', name: 'Luxembourg' },
  { code: 'IE', dial: '+353', flag: '🇮🇪', name: 'Ireland' },
  { code: 'SE', dial: '+46', flag: '🇸🇪', name: 'Sweden' },
  { code: 'NO', dial: '+47', flag: '🇳🇴', name: 'Norway' },
  { code: 'DK', dial: '+45', flag: '🇩🇰', name: 'Denmark' },
  { code: 'FI', dial: '+358', flag: '🇫🇮', name: 'Finland' },
  { code: 'RU', dial: '+7', flag: '🇷🇺', name: 'Russia' },
  { code: 'UA', dial: '+380', flag: '🇺🇦', name: 'Ukraine' },
  { code: 'JP', dial: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: 'CN', dial: '+86', flag: '🇨🇳', name: 'China' },
  { code: 'IN', dial: '+91', flag: '🇮🇳', name: 'India' },
  { code: 'AU', dial: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: 'NZ', dial: '+64', flag: '🇳🇿', name: 'New Zealand' },
  { code: 'BR', dial: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: 'MX', dial: '+52', flag: '🇲🇽', name: 'Mexico' },
  { code: 'VN', dial: '+84', flag: '🇻🇳', name: 'Vietnam' },
  { code: 'TH', dial: '+66', flag: '🇹🇭', name: 'Thailand' },
  { code: 'ID', dial: '+62', flag: '🇮🇩', name: 'Indonesia' },
  { code: 'MY', dial: '+60', flag: '🇲🇾', name: 'Malaysia' },
  { code: 'PH', dial: '+63', flag: '🇵🇭', name: 'Philippines' },
  { code: 'SG', dial: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: 'KR', dial: '+82', flag: '🇰🇷', name: 'South Korea' },
  { code: 'ZA', dial: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: 'TR', dial: '+90', flag: '🇹🇷', name: 'Turkey' },
  { code: 'IL', dial: '+972', flag: '🇮🇱', name: 'Israel' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'EG', dial: '+20', flag: '🇪🇬', name: 'Egypt' },
  { code: 'MA', dial: '+212', flag: '🇲🇦', name: 'Morocco' },
  { code: 'DZ', dial: '+213', flag: '🇩🇿', name: 'Algeria' },
  { code: 'TN', dial: '+216', flag: '🇹🇳', name: 'Tunisia' },
  { code: 'GR', dial: '+30', flag: '🇬🇷', name: 'Greece' },
  { code: 'AT', dial: '+43', flag: '🇦🇹', name: 'Austria' },
  { code: 'PL', dial: '+48', flag: '🇵🇱', name: 'Poland' },
  { code: 'RO', dial: '+40', flag: '🇷🇴', name: 'Romania' },
  { code: 'CZ', dial: '+420', flag: '🇨🇿', name: 'Czech Republic' },
  { code: 'HU', dial: '+36', flag: '🇭🇺', name: 'Hungary' },
  { code: 'HR', dial: '+385', flag: '🇭🇷', name: 'Croatia' },
  { code: 'RS', dial: '+381', flag: '🇷🇸', name: 'Serbia' },
  { code: 'BG', dial: '+359', flag: '🇧🇬', name: 'Bulgaria' },
  { code: 'SK', dial: '+421', flag: '🇸🇰', name: 'Slovakia' },
  { code: 'SI', dial: '+386', flag: '🇸🇮', name: 'Slovenia' },
  { code: 'LT', dial: '+370', flag: '🇱🇹', name: 'Lithuania' },
  { code: 'LV', dial: '+371', flag: '🇱🇻', name: 'Latvia' },
  { code: 'EE', dial: '+372', flag: '🇪🇪', name: 'Estonia' },
  { code: 'CY', dial: '+357', flag: '🇨🇾', name: 'Cyprus' },
  { code: 'MT', dial: '+356', flag: '🇲🇹', name: 'Malta' },
  { code: 'IS', dial: '+354', flag: '🇮🇸', name: 'Iceland' },
  { code: 'AR', dial: '+54', flag: '🇦🇷', name: 'Argentina' },
  { code: 'CL', dial: '+56', flag: '🇨🇱', name: 'Chile' },
  { code: 'CO', dial: '+57', flag: '🇨🇴', name: 'Colombia' },
  { code: 'PE', dial: '+51', flag: '🇵🇪', name: 'Peru' },
  { code: 'VE', dial: '+58', flag: '🇻🇪', name: 'Venezuela' },
  { code: 'EC', dial: '+593', flag: '🇪🇨', name: 'Ecuador' },
  { code: 'HK', dial: '+852', flag: '🇭🇰', name: 'Hong Kong' },
  { code: 'TW', dial: '+886', flag: '🇹🇼', name: 'Taiwan' }
  // Add more as needed, but this covers major bases
].sort((a, b) => a.name.localeCompare(b.name));

const getCountryFlag = (phone) => {
  if (!phone) return '';
  // Try to find a matching prefix from our robust list
  const cleanPhone = phone.startsWith('+') ? phone : '+' + phone.replace(/\D/g, '');

  // Sort options by dial code length desc to match +1242 before +1
  const match = COUNTRY_OPTIONS
    .sort((a, b) => b.dial.length - a.dial.length)
    .find(opt => cleanPhone.startsWith(opt.dial));

  return match ? match.flag : '🌐';
};

const formatPhoneWithFlag = (phone) => {
  if (!phone) return '';
  const flag = getCountryFlag(phone);
  return flag ? `${flag} ${phone}` : phone;
};

const SOCIAL_ICONS_MAP = {
  whatsapp: 'WA',
  instagram: 'IG',
  linkedin: 'LK',
  facebook: 'FB',
  twitter: 'X',
  youtube: 'YT',
  tiktok: 'TK',
  snapchat: 'SC',
  telegram: 'TG',
  pinterest: 'PI',
  discord: 'DC',
  reddit: 'RD',
  messenger: 'MS',
  wechat: 'WC',
  line: 'LN',
  skype: 'SK',
  viber: 'VB',
  zalo: 'ZL',
  twitch: 'TW',
  mastodon: 'MD',
  bluesky: 'BS',
  signal: 'SI',
  bitchat: 'BC',
  spotify: 'SP',
  soundcloud: 'SC',
  custom: '★'
};

const getSocialInitials = (type) => {
  return SOCIAL_ICONS_MAP[type.toLowerCase()] || type.substring(0, 2).toUpperCase();
};

const TRANSLATIONS = {
  en: {
    appName: 'DigitalQRCard',
    plan: 'Plan',
    manageSub: 'Manage Subscription',
    yourCards: 'Your Cards',
    manageCards: 'Manage and share your digital business cards',
    newCard: 'New Card',
    noCards: 'No cards created',
    startCreating: 'Start by creating your first digital business card.',
    createFirst: 'Create my first card',
    edit: 'Edit',
    delete: 'Delete',
    share: 'Share',
    close: 'Close',
    scanToAdd: 'Scan to add',
    editCard: 'Edit Card',
    createNewCard: 'New Card',
    fullName: 'Full Name',
    title: 'Title / Position',
    company: 'Company',
    phone: 'Phone',
    email: 'Email',
    website: 'Website',
    cardStyle: 'Card Style',
    cancel: 'Cancel',
    save: 'Save',
    choosePlan: 'Choose your plan',
    moreCards: 'Manage more digital business cards',
    free: 'Free',
    month: '/month',
    digitalCard: 'Digital Card',
    digitalCards: 'Digital Cards',
    unlimitedShare: 'Unlimited Sharing',
    universalQR: 'Universal QR Code',
    currentPlan: 'Current Plan',
    select: 'Select',
    popular: 'POPULAR',
    standardPack: 'Standard Pack',
    premiumPack: 'Premium Pack',
    premiumStyles: 'Premium Styles',
    prioritySupport: 'Priority Support',
    chooseThis: 'Choose this plan',
    unlimitedAll: 'Unlimited Everything',
    proBadge: 'Pro Badge',
    confirmDelete: 'Are you sure you want to delete this card?',
    upgraded: 'Thank you! You are now subscribed to the',
    standard: 'Standard',
    premium: 'Premium',
    yourName: 'Your Name',
    yourTitle: 'Your Title',
    yourCompany: 'My Company Inc',
    address: 'Address',
    extraFieldLabel: 'Extra Field Label',
    extraFieldValue: 'Extra Field Value',
    login: 'Login',
    logout: 'Logout',
    welcome: 'Welcome',
    clickMoreInfo: 'Click here for more information',
    lessInfo: 'Less information'
  }
};

const PRICING = {
  basic: { price: '2 CHF', limit: 3, key: 'standardPack' },
  pro: { price: '4 CHF', limit: 5, key: 'premiumPack' }
};

// --- Components ---

const FIELD_TYPES = [
  { value: 'title', label: 'Title/Position', icon: Briefcase, tier: 'free' },
  { value: 'phone', label: 'Phone', icon: Phone, tier: 'free' },
  { value: 'email', label: 'Email', icon: Mail, tier: 'free' },
  { value: 'company', label: 'Company', icon: Building2, tier: 'basic' },
  { value: 'location', label: 'Address', icon: MapPin, tier: 'basic' },
  { value: 'website', label: 'Website', icon: Globe, tier: 'basic' },
  // Socials
  { value: 'facebook', label: 'Facebook', icon: Facebook, tier: 'basic' },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, tier: 'basic' },
  { value: 'instagram', label: 'Instagram', icon: Instagram, tier: 'basic' },
  { value: 'youtube', label: 'YouTube', icon: Youtube, tier: 'basic' },
  { value: 'tiktok', label: 'TikTok', icon: MessageCircle, tier: 'basic' },
  { value: 'snapchat', label: 'Snapchat', icon: MessageCircle, tier: 'basic' },
  { value: 'twitch', label: 'Twitch', icon: Twitch, tier: 'basic' },
  { value: 'line', label: 'Line', icon: MessageCircle, tier: 'basic' },
  { value: 'messenger', label: 'Messenger', icon: MessageCircle, tier: 'basic' },
  { value: 'discord', label: 'Discord', icon: MessageCircle, tier: 'basic' },
  { value: 'reddit', label: 'Reddit', icon: MessageCircle, tier: 'basic' },
  { value: 'mastodon', label: 'Mastodon', icon: MessageCircle, tier: 'basic' },
  { value: 'bluesky', label: 'Bluesky', icon: Cloud, tier: 'basic' },
  { value: 'wechat', label: 'WeChat', icon: MessageCircle, tier: 'basic' },
  { value: 'telegram', label: 'Telegram', icon: MessageCircle, tier: 'basic' },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, tier: 'basic' },
  { value: 'twitter', label: 'X (Twitter)', icon: Twitter, tier: 'basic' },
  { value: 'pinterest', label: 'Pinterest', icon: Globe, tier: 'basic' },
  { value: 'soundcloud', label: 'SoundCloud', icon: Music, tier: 'basic' },
  { value: 'mixcloud', label: 'Mixcloud', icon: Music, tier: 'basic' },
  { value: 'bandcamp', label: 'Bandcamp', icon: Music, tier: 'basic' },

  { value: 'zalo', label: 'Zalo', icon: MessageCircle, tier: 'basic' },
  { value: 'signal', label: 'Signal', icon: MessageCircle, tier: 'basic' },
  { value: 'bitchat', label: 'BitChat', icon: MessageCircle, tier: 'basic' },
  { value: 'custom', label: 'Custom', icon: Star, tier: 'pro' }
];



const CardPreview = ({ card, showQR, isExpanded, onToggleExpand, t }) => {
  // Pro Design Implementation
  const fields = card.fields || [
    { type: 'title', value: card.title },
    { type: 'company', value: card.company },
    { type: 'phone', value: card.phone },
    { type: 'email', value: card.email },
    { type: 'website', value: card.website },
    { type: 'location', value: card.location },
    { type: 'custom', value: card.extra, label: card.extraLabel }
  ].filter(f => f.value);

  // Extract core fields for the top section
  const title = fields.find(f => f.type === 'title')?.value || '';
  const company = fields.find(f => f.type === 'company')?.value || '';
  // eslint-disable-next-line no-unused-vars
  const displayTitle = [title, company].filter(Boolean).join(' @ ');
  const phone = fields.find(f => f.type === 'phone')?.value;
  const email = fields.find(f => f.type === 'email')?.value;
  const website = fields.find(f => f.type === 'website')?.value;
  const location = fields.find(f => f.type === 'location')?.value;

  // Identify "Other" fields (Socials, etc) for the collapsed view icons
  const coreTypes = ['title', 'company', 'phone', 'email', 'website', 'location'];
  const socialFields = fields.filter(f => !coreTypes.includes(f.type));

  /* Safe Theme Resolution */
  const safeTheme = (card.theme && THEME_COLORS[card.theme]) ? card.theme : 'pantone-classic-blue';
  const themeBg = THEME_COLORS[safeTheme];

  const accentColor = (themeBg && themeBg.includes('gradient'))
    ? themeBg.match(/#[a-fA-F0-9]{6}/)?.[0] || '#38bdf8'
    : themeBg || '#38bdf8';

  return (
    <div
      className={`pro-card ${isExpanded ? 'expanded' : ''}`}
      style={{ overflow: 'hidden' }} // Ensure rounded corners clip content
    >
      {/* 1. Header Banner */}
      <div className={`pro-header-banner ${safeTheme}`}></div>

      {/* 2. Avatar */}
      <div className="pro-avatar-wrapper">
        <div className="pro-avatar">
          {/* Use first letter of name or User icon */}
          {card.image ? (
            <img src={card.image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            card.name ? (
              <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: accentColor }}>
                {(() => {
                  const parts = card.name.trim().split(/\s+/);
                  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
                  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
                })()}
              </span>
            ) : (
              <User size={48} color={accentColor} />
            )
          )}
        </div>
      </div>

      {/* 3. Content */}
      <div className="pro-content">
        <h3 className="pro-name">{card.name || t.yourName}</h3>
        {displayTitle ? <p className="pro-title">{displayTitle}</p> : null}

        {/* QR Overlay - Only visible if showQR is passed as true */}
        {showQR ? (
          <div className="animate-fade-in" style={{
            position: 'absolute', inset: 0, background: 'white', zIndex: 100,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '2rem', borderRadius: '1.5rem'
          }}>
            <QRCodeSVG
              value={(() => {
                const parts = (card.name || '').trim().split(/\s+/);
                const lastName = parts.length > 1 ? parts.pop() : '';
                const firstName = parts.join(' ') || '';
                const vCardData = [
                  'BEGIN:VCARD',
                  'VERSION:3.0',
                  `N:${lastName};${firstName};;;`,
                  `FN:${card.name || ''}`,
                  `ORG:${company || ''}`,
                  `TITLE:${title || ''}`,
                  ...fields
                    .filter(f => f.type !== 'title' && f.type !== 'company')
                    .map(f => {
                      const val = (f.value || '').trim();
                      if (!val) return null;
                      const lbl = (f.label || '').toLowerCase();
                      if (f.type === 'phone' || lbl.includes('phone') || lbl.includes('tel') || lbl.includes('mobile')) {
                        return `TEL;TYPE=CELL:${val}`;
                      }
                      if (f.type === 'email' || lbl.includes('email') || lbl.includes('mail')) {
                        return `EMAIL;TYPE=WORK:${val}`;
                      }
                      if (f.type === 'website' || lbl.includes('web') || lbl.includes('site')) {
                        return `URL:${val.startsWith('http') ? val : 'https://' + val}`;
                      }
                      if (f.type === 'location' || lbl.includes('address') || lbl.includes('adresse')) {
                        return `ADR;TYPE=WORK:;;${val};;;;`;
                      }
                      // For Socials/Whatsapp, standard says usually use URL or specific properties. Notes are safest for generic readers.
                      // But for Whatsapp specifically, X-SOCIALPROFILE is supported by some.
                      // Let's stick to simple NOTE for max compatibility or URL if it looks like one.
                      if (f.type === 'whatsapp' && !val.startsWith('http')) {
                        return `URL:https://wa.me/${val.replace(/[^0-9]/g, '')}`; // Auto-convert generic whatsapp number
                      }
                      // General URL fallback
                      if (val.startsWith('http')) return `URL:${val}`;

                      const noteLabel = f.label || f.type || 'Info';
                      return `NOTE:${noteLabel.toUpperCase()}: ${val}`;
                    })
                    .filter(Boolean),
                  'END:VCARD'
                ].join('\r\n');
                return vCardData;
              })()}
              size={240}
              level="M"
            />
          </div>
        ) : (
          <>
            {/* 4. Unified Action Buttons Row (Primary Contacts + Socials) */}
            <div className="pro-actions-row" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', width: '100%', marginBottom: '1.5rem', alignItems: 'center' }}>
              {/* Common Style for consistency */}
              {(() => {
                const btnStyle = {
                  width: '44px', height: '44px',
                  borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textDecoration: 'none',
                  color: accentColor,
                  border: `1px solid ${accentColor}`, // Normalized border
                  background: 'transparent',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  transition: 'transform 0.1s'
                };

                return (
                  <>
                    {/* Primary Icons */}
                    {phone && (
                      <a href={`tel:${phone}`} className="pro-action-btn" title={phone} style={btnStyle}>
                        <Phone size={20} />
                      </a>
                    )}
                    {email && (
                      <a href={`mailto:${email}`} className="pro-action-btn" title={email} style={btnStyle}>
                        <Mail size={20} />
                      </a>
                    )}
                    {website && (
                      <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="pro-action-btn" title={website} style={btnStyle}>
                        <Globe size={20} />
                      </a>
                    )}
                    {location && (
                      <div className="pro-action-btn" title={location} style={btnStyle}>
                        <MapPin size={20} />
                      </div>
                    )}

                    {/* Social Icons */}
                    {socialFields.map((field, idx) => {
                      const def = FIELD_TYPES.find(t => t.value === field.type);
                      const Icon = def ? def.icon : Star;

                      return (
                        <div key={idx}
                          className="pro-action-btn"
                          style={btnStyle}
                          title={field.label || field.type}
                        >
                          <Icon size={20} />
                        </div>
                      )
                    })}
                  </>
                );
              })()}
            </div>

            {/* 5. REMOVED SEPARATE SOCIAL ROW (Merged above) */}

            {/* 6. Full Details List (Expanded View) */}
            {isExpanded && (
              <div className="pro-details-list animate-fade-in" style={{ width: '100%', textAlign: 'left', marginTop: '1rem' }}>
                {fields.map((field, idx) => {
                  // Skip Header fields
                  if (['title', 'company'].includes(field.type)) return null;

                  // Find definition
                  const def = FIELD_TYPES.find(t => t.value === field.type);
                  const Icon = def ? def.icon : Star;
                  // Use robust label separation
                  const label = field.label || def?.label || field.type;
                  let val = field.value;

                  // Determine Layout & Content
                  let ContentWrapper = ({ children }) => <>{children}</>;

                  // Core Types check
                  const coreTypes = ['title', 'company', 'phone', 'email', 'website', 'location'];
                  let isSocial = !coreTypes.includes(field.type);

                  // Phone Special Handling (Flags)
                  if (field.type === 'phone' || field.type.includes('phone') || field.type.includes('mobile')) {
                    val = formatPhoneWithFlag(val);
                    ContentWrapper = ({ children }) => <a href={`tel:${field.value}`} style={{ color: 'inherit', textDecoration: 'none' }}>{children}</a>;
                    isSocial = false;
                  }
                  else if (field.type === 'email') {
                    ContentWrapper = ({ children }) => <a href={`mailto:${field.value}`} style={{ color: 'inherit', textDecoration: 'none' }}>{children}</a>;
                    isSocial = false;
                  }
                  // Website Handling
                  else if (field.type === 'website') {
                    ContentWrapper = ({ children }) => <a href={field.value.startsWith('http') ? field.value : `https://${field.value}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>{children}</a>;
                    isSocial = false;
                  }
                  // Social / Platform Handling
                  else if (isSocial) {
                    // Get Platform Name
                    const platformName = def?.label || field.type.charAt(0).toUpperCase() + field.type.slice(1);

                    // Set Display Value to Platform Name (User Request: "Just write Whatsapp")
                    val = platformName;

                    // Helper to build URL
                    const buildSocialUrl = (type, value) => {
                      const v = value.trim();
                      if (v.startsWith('http')) return v;
                      switch (type) {
                        case 'whatsapp': return `https://wa.me/${v.replace(/[^0-9]/g, '')}`;
                        case 'instagram': return `https://instagram.com/${v.replace('@', '')}`;
                        case 'twitter': return `https://twitter.com/${v.replace('@', '')}`;
                        case 'linkedin': return `https://linkedin.com/in/${v}`;
                        case 'facebook': return `https://facebook.com/${v}`;
                        case 'tiktok': return `https://tiktok.com/@${v.replace('@', '')}`;
                        case 'telegram': return `https://t.me/${v.replace('@', '')}`;
                        case 'snapchat': return `https://snapchat.com/add/${v}`;
                        case 'youtube': return `https://youtube.com/${v.startsWith('@') ? v : '@' + v}`;
                        default: return v; // Fallback
                      }
                    };

                    const href = buildSocialUrl(field.type, field.value);

                    // Only link if valid
                    if (href && (href !== field.value || href.startsWith('http'))) {
                      ContentWrapper = ({ children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>{children}</a>;
                    }
                  }

                  return (
                    <div key={idx} className="pro-detail-item" style={{ borderBottom: '1px solid #f1f5f9', padding: '0.75rem 0', display: 'flex', alignItems: isSocial ? 'center' : 'flex-start' }}>
                      <span className="pro-detail-icon" style={{ minWidth: '24px', color: accentColor, marginTop: isSocial ? '0' : '2px', display: 'flex', alignItems: 'center' }}>
                        <Icon size={16} />
                      </span>
                      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        {/* HIDE LABEL IF IT IS THE SAME AS THE VALUE OR IF IT IS A SOCIAL FIELD */}
                        {!isSocial && label.toLowerCase() !== val.toLowerCase() && (
                          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8' }}>{label}</div>
                        )}
                        <div style={{ color: '#334155', wordBreak: 'break-word', overflowWrap: 'anywhere', fontWeight: isSocial ? '600' : 'normal' }}>
                          <ContentWrapper>{val}</ContentWrapper>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 7. Footer Toggle CTA */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="pro-footer-btn"
              style={{ color: accentColor, borderColor: accentColor }}
            >
              {isExpanded ? t.lessInfo : t.clickMoreInfo}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Helper to migrate old cards to new structure
const migrateCard = (card) => {
  if (card.fields) return card.fields;
  return [
    { type: 'title', value: card.title },
    { type: 'company', value: card.company },
    { type: 'phone', value: card.phone },
    { type: 'email', value: card.email },
    { type: 'website', value: card.website },
    { type: 'location', value: card.location || card.address },
    { type: 'custom', value: card.extra || card.extraValue, label: card.extraLabel || '' }
  ].filter(f => f.value);
};

const Editor = ({ card, onSave, onCancel, t, isSaving, statusMessage, subscription = 'free' }) => {
  const [name, setName] = useState(card?.name || '');
  const [image, setImage] = useState(card?.image || null); // New Image State
  const [uploadStatus, setUploadStatus] = useState(null); // Local state for image upload feedback
  const [theme, setTheme] = useState(card?.theme || 'pantone-classic-blue'); // Default to Classic Blue
  const [fields, setFields] = useState(card ? migrateCard(card) : [
    { type: 'title', value: '' },
    { type: 'company', value: '' },
    { type: 'phone', value: '' },
    { type: 'email', value: '' }
  ]);

  const addField = () => {
    setFields([...fields, { type: 'phone', value: '' }]);
  };

  const removeField = (index) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };

  const moveField = (index, direction) => {
    const newFields = [...fields];
    if (direction === -1 && index > 0) {
      [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
    } else if (direction === 1 && index < newFields.length - 1) {
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    }
    setFields(newFields);
  };

  const updateField = (index, key, val) => {
    const newFields = [...fields];
    newFields[index][key] = val;
    setFields(newFields);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: card?.id,
      name,
      image, // Save the base64 image
      theme,
      fields: fields.filter(f => f.value && String(f.value).trim() !== '')
    });
  };

  return (
    <div className="editor-container glass-panel">
      <h2 className="editor-title">{card ? t.edit : t.createNewCard}</h2>

      <form onSubmit={handleSubmit} className="editor-form">


        {/* Locked Feature: Image Upload */}
        <div className="form-group" style={{ textAlign: 'center', marginBottom: '1.5rem', position: 'relative' }}>
          {subscription === 'free' && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(2px)', zIndex: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem'
            }}>
              <Gem size={24} color="#8b5cf6" />
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#1e293b', marginTop: '0.5rem' }}>Standard Feature</span>
            </div>
          )}
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: '#f1f5f9',
              margin: '0 auto 1rem auto',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed #cbd5e1',
              cursor: subscription === 'free' ? 'not-allowed' : 'pointer',
              position: 'relative'
            }}
            onClick={() => subscription !== 'free' && document.getElementById('card-image-input').click()}
          >
            {image ? (
              <img src={image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>+ Photo</span>
            )}
          </div>
          <input
            id="card-image-input"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            disabled={subscription === 'free'}
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;

              setUploadStatus({ type: 'info', text: 'Traitement en cours...' });

              // Helper to resize and compress image
              const compressImage = (file) => {
                return new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.readAsDataURL(file);
                  reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = () => {
                      const canvas = document.createElement('canvas');
                      const MAX_WIDTH = 500; // Reduced for safety & speed
                      const MAX_HEIGHT = 500;
                      let width = img.width;
                      let height = img.height;

                      if (width > height) {
                        if (width > MAX_WIDTH) {
                          height *= MAX_WIDTH / width;
                          width = MAX_WIDTH;
                        }
                      } else {
                        if (height > MAX_HEIGHT) {
                          width *= MAX_HEIGHT / height;
                          height = MAX_HEIGHT;
                        }
                      }
                      canvas.width = width;
                      canvas.height = height;
                      const ctx = canvas.getContext('2d');
                      ctx.drawImage(img, 0, 0, width, height);
                      // Compress to JPEG at 80% quality
                      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                      resolve(dataUrl);
                    };
                    img.onerror = (err) => reject(new Error("Failed to load image"));
                  };
                  reader.onerror = (err) => reject(new Error("Failed to read file"));
                });
              };

              try {
                // Try to compress
                const compressedBase64 = await compressImage(file);
                setImage(compressedBase64);
                setUploadStatus({ type: 'success', text: 'Photo ajoutée !' });
                setTimeout(() => setUploadStatus(null), 3000);

              } catch (error) {
                console.error("Image processing error:", error);

                // FALLBACK: If compression fails but file is reasonably small (< 4MB), use it raw
                if (file.size < 4 * 1024 * 1024) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    setImage(e.target.result);
                    setUploadStatus({ type: 'success', text: 'Photo (brute) ajoutée !' });
                    setTimeout(() => setUploadStatus(null), 3000);
                  };
                  reader.readAsDataURL(file);
                } else {
                  alert("Erreur technique: " + (error.message || "L'image ne peut pas être traitée"));
                  setUploadStatus({ type: 'error', text: 'Erreur image' });
                }
              }
            }}
          />
          <label
            htmlFor="card-image-input"
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', cursor: subscription === 'free' ? 'not-allowed' : 'pointer', opacity: subscription === 'free' ? 0.5 : 1 }}
          >
            Upload Photo / Logo
          </label>
          {/* Feedback Message Display */}
          {uploadStatus && (
            <div style={{
              marginTop: '0.5rem',
              fontSize: '0.8rem',
              color: uploadStatus.type === 'error' ? '#ef4444' : uploadStatus.type === 'success' ? '#10b981' : '#64748b',
              fontWeight: '600'
            }}>
              {uploadStatus.text}
            </div>
          )}
        </div>

        {/* Fixed Name Field */}
        <div className="form-group">
          <label className="field-label">{t.fullName}</label>
          <div className="input-group">
            <User className="input-icon" size={18} />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: John Doe"
              className="form-input"
              required
            />
          </div>
        </div>

        {/* Dynamic Fields */}
        <div className="dynamic-fields-section">
          <label className="field-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Contact Details & Info</label>
          <div className="fields-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {fields.map((field, index) => (
              <div key={index} className="dynamic-field-row glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {/* Header: Type + Delete */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div className="select-wrapper" style={{ position: 'relative', width: '50%' }}>
                    <select
                      value={field.type}
                      onChange={(e) => updateField(index, 'type', e.target.value)}
                      className="form-select"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                    >
                      {FIELD_TYPES
                        .filter(ft => {
                          if (subscription === 'pro') return true; // Pro gets everything
                          if (subscription === 'basic') return ft.tier !== 'pro'; // Basic gets free + basic
                          return ft.tier === 'free'; // Free only gets free
                        })
                        .map(ft => (
                          <option key={ft.value} value={ft.value}>{ft.label}</option>
                        ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => moveField(index, -1)}
                      disabled={index === 0}
                      className="icon-btn"
                      title="Move Up"
                      style={{
                        background: '#f1f5f9',
                        color: '#334155',
                        opacity: index === 0 ? 0.3 : 1,
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveField(index, 1)}
                      disabled={index === fields.length - 1}
                      className="icon-btn"
                      title="Move Down"
                      style={{
                        background: '#f1f5f9',
                        color: '#334155',
                        opacity: index === fields.length - 1 ? 0.3 : 1,
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeField(index)}
                      className="icon-btn delete"
                      title="Remove field"
                      style={{ background: '#fee2e2', color: '#ef4444' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Input Value */}
                {/* Input Value - SPECIAL HANDING FOR PHONE with Dropdown */}
                {['phone', 'whatsapp'].includes(field.type) ? (
                  <div className="input-group" style={{ display: 'flex', gap: '0.5rem' }}>
                    {/* Country Select */}
                    <select
                      value={(() => {
                        const val = field.value || '';
                        // Find matching dial code
                        const match = COUNTRY_OPTIONS
                          .sort((a, b) => b.dial.length - a.dial.length)
                          .find(opt => val.startsWith(opt.dial));
                        return match ? match.dial : '';
                      })()}
                      onChange={(e) => {
                        const newCode = e.target.value;
                        const oldVal = field.value || '';
                        let currentNumber = oldVal;

                        // Strip old code if exists
                        const oldMatch = COUNTRY_OPTIONS
                          .sort((a, b) => b.dial.length - a.dial.length)
                          .find(opt => oldVal.startsWith(opt.dial));

                        if (oldMatch) {
                          currentNumber = oldVal.slice(oldMatch.dial.length);
                        } else if (oldVal.startsWith('+')) {
                          // Logic fallback: might be a custom code not in list?
                          // Just keep it or try to regex it?
                          // Let's assume if no match, we treat whole as number
                        }

                        updateField(index, 'value', newCode + currentNumber);
                      }}
                      className="form-select"
                      style={{
                        width: '130px',
                        flexShrink: 0,
                        padding: '0.75rem',
                        borderRadius: '0.75rem',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#f8fafc',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="">🌐 Code</option>
                      {COUNTRY_OPTIONS.map(opt => (
                        <option key={opt.code} value={opt.dial}>
                          {opt.flag} {opt.dial}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={(() => {
                        const val = field.value || '';
                        const match = COUNTRY_OPTIONS
                          .sort((a, b) => b.dial.length - a.dial.length)
                          .find(opt => val.startsWith(opt.dial));
                        return match ? val.slice(match.dial.length) : val;
                      })()}
                      onChange={(e) => {
                        const typedPart = e.target.value;
                        const val = field.value || '';
                        const match = COUNTRY_OPTIONS
                          .sort((a, b) => b.dial.length - a.dial.length)
                          .find(opt => val.startsWith(opt.dial));

                        const prefix = match ? match.dial : '';
                        updateField(index, 'value', prefix + typedPart);
                      }}
                      placeholder="Phone Number"
                      className="form-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                ) : (
                  <div className="input-group">
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => updateField(index, 'value', e.target.value)}
                      placeholder={(() => {
                        if (field.type === 'instagram') return 'Username (e.g. john.doe)';
                        if (field.type === 'twitter') return 'Username (e.g. @john)';
                        if (field.type === 'linkedin') return 'Profile URL (e.g. linkedin.com/in/...)';
                        return `Enter ${field.type} details...`;
                      })()}
                      className="form-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                )}

                {field.type === 'custom' && (
                  <div className="input-group" style={{ marginTop: '0.5rem' }}>
                    <input
                      type="text"
                      value={field.label || ''}
                      onChange={(e) => updateField(index, 'label', e.target.value)}
                      placeholder="Label (e.g. Portfolio)"
                      className="form-input text-sm"
                      style={{ opacity: 0.8 }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addField}
            className="btn-secondary"
            style={{ width: '100%', marginTop: '1rem', borderStyle: 'dashed' }}
          >
            <Plus size={16} /> Add Field
          </button>
        </div>

        {/* Theme Selector */}
        <div className="form-group theme-selector-group" style={{ marginTop: '2rem' }}>
          <label className="field-label">{t.cardStyle}</label>
          <div className="theme-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '1rem' }}>
            {Object.entries(THEME_COLORS).map(([key, bg]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTheme(key)}
                className={`theme - option ${theme === key ? 'active' : ''} `}
                style={{
                  height: '60px',
                  borderRadius: '12px',
                  background: bg,
                  border: theme === key ? '2px solid white' : '2px solid transparent',
                  boxShadow: theme === key ? '0 0 0 2px rgba(255,255,255,0.2), 0 4px 12px rgba(0,0,0,0.3)' : 'none',
                  transform: theme === key ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                title={key}
              >
                {theme === key && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.1)',
                    borderRadius: '10px'
                  }}>
                    <div style={{ width: 8, height: 8, background: 'white', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-secondary">
            {t.cancel}
          </button>
          <button type="submit" className="btn-primary">
            {isSaving ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="spinner-small"></span> {t.save}...
              </span>
            ) : t.save}
          </button>

        </div>
        {/* Spacer for Fixed Footer */}
        <div style={{ height: '80px' }}></div>
        {
          statusMessage && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              background: statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
              color: statusMessage.type === 'error' ? '#fca5a5' : '#93c5fd',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}>
              {statusMessage.text}
            </div>
          )
        }
      </form >
    </div >
  );
};

const PricingModal = ({ currentPlan, onUpgrade, onClose, t }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-panel pricing-modal animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="pricing-header">
          <div>
            <h2 className="section-title" style={{ fontSize: '2rem', margin: 0 }}>{t.choosePlan}</h2>
            <p style={{ color: '#94a3b8' }}>{t.moreCards}</p>
          </div>
          <button onClick={onClose} className="icon-btn"><X size={24} /></button>
        </div>

        <div className="pricing-grid">
          {/* Free Plan */}
          <div className={`pricing-card ${currentPlan === 'free' ? 'highlight' : ''}`}>
            <h3>{t.free}</h3>
            <div className="price">0 CHF<span>{t.month}</span></div>
            <ul className="features-list">
              <li><strong>1</strong> Digital Card</li>
              <li>Name, Title, Email, Phone</li>
              <li style={{ opacity: 0.5, textDecoration: 'line-through' }}>Photo / Logo</li>
              <li style={{ opacity: 0.5, textDecoration: 'line-through' }}>Social Networks</li>
              <li style={{ opacity: 0.5, textDecoration: 'line-through' }}>Company Info</li>
            </ul>
            <button
              disabled={true}
              className="btn-secondary btn-full"
              style={{ opacity: 0.7, cursor: 'default' }}
            >
              {currentPlan === 'free' ? t.currentPlan : t.select}
            </button>
          </div>

          {/* Basic Plan */}
          <div className={`pricing-card ${currentPlan === 'basic' ? 'highlight' : ''}`}>
            {currentPlan !== 'basic' && <div className="popular-badge">{t.popular}</div>}
            <h3>{t[PRICING.basic.key]}</h3>
            <div className="price">{PRICING.basic.price}<span>{t.month}</span></div>
            <ul className="features-list">
              <li><strong>{PRICING.basic.limit}</strong> Digital Cards</li>
              <li>Everything in Free</li>
              <li><strong>✅ Add Photo / Logo</strong></li>
              <li>✅ Company & Location</li>
              <li>✅ Social Networks (FB, Insta, Linked...)</li>
            </ul>
            <button
              onClick={() => onUpgrade('basic')}
              disabled={currentPlan === 'basic'}
              className={`btn-full ${currentPlan === 'basic' ? 'btn-secondary' : 'btn-primary'}`}
            >
              {currentPlan === 'basic' ? t.currentPlan : t.chooseThis}
            </button>
          </div>

          {/* Pro Plan */}
          <div className={`pricing-card ${currentPlan === 'pro' ? 'highlight' : ''}`}>
            <h3>{t[PRICING.pro.key]}</h3>
            <div className="price">{PRICING.pro.price}<span>{t.month}</span></div>
            <ul className="features-list">
              <li><strong>{PRICING.pro.limit}</strong> Digital Cards</li>
              <li>Everything in Free</li>
              <li><strong>✅ Add Photo / Logo</strong></li>
              <li>✅ Company & Location</li>
              <li>✅ All Social Networks</li>
              <li><strong>✅ Unlimited Custom Fields</strong></li>
            </ul>
            <button
              onClick={() => onUpgrade('pro')}
              disabled={currentPlan === 'pro'}
              className={`btn-full ${currentPlan === 'pro' ? 'btn-secondary' : 'btn-secondary'}`}
              style={currentPlan !== 'pro' ? { border: '1px solid white' } : {}}
            >
              {currentPlan === 'pro' ? t.currentPlan : t.chooseThis}
            </button>
          </div>
        </div>
      </div>
    </div>

  );
};

const AuthModal = ({ onClose, onLoginGoogle }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose(); // Auth listener will handle the rest
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-panel" style={{ maxWidth: '400px', width: '90%', padding: '2rem' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 className="section-title" style={{ margin: 0 }}>{isRegister ? 'Créer un compte' : 'Connexion'}</h2>
          <button onClick={onClose} className="icon-btn"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label className="field-label">Email</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="field-label">Mot de passe</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && <div style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '1rem' }}>{error}</div>}

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            {isRegister ? 'S\'inscrire' : 'Se connecter'}
          </button>
        </form>

        <div style={{ margin: '1.5rem 0', textAlign: 'center', borderBottom: '1px solid #e2e8f0', lineHeight: '0.1em' }}>
          <span style={{ background: '#fff', padding: '0 10px', color: '#64748b' }}>OU</span>
        </div>

        <button onClick={onLoginGoogle} className="btn-google" style={{ width: '100%', justifyContent: 'center' }}>
          <LogIn size={18} style={{ marginRight: '0.5rem' }} /> Continuer avec Google
        </button>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          {isRegister ? (
            <p>Déjà un compte ? <span onClick={() => setIsRegister(false)} style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold' }}>Se connecter</span></p>
          ) : (
            <p>Pas de compte ? <span onClick={() => setIsRegister(true)} style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold' }}>Créer un compte</span></p>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'white', textAlign: 'center' }}>
          <h1>Something went wrong.</h1>
          <p style={{ color: '#ef4444' }}>{this.state.error && this.state.error.toString()}</p>
          <button onClick={() => window.location.reload()} className="btn-primary" style={{ marginTop: '1rem' }}>
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/* --- PRO CAROUSEL COMPONENT --- */
// eslint-disable-next-line react/prop-types
const Carousel = ({ items, renderItem, activeIndex = 0, onIndexChange }) => {
  // Use controlled state for index

  // Safety: Adjust index if items are removed
  useEffect(() => {
    if (activeIndex >= items.length && items.length > 0) {
      if (onIndexChange) onIndexChange(items.length - 1);
    }
  }, [items.length, activeIndex, onIndexChange]);

  const next = () => {
    if (onIndexChange) onIndexChange((activeIndex + 1) % items.length);
  };
  const prev = () => {
    if (onIndexChange) onIndexChange((activeIndex - 1 + items.length) % items.length);
  };

  if (!items.length) return null;

  return (
    <div className="carousel-container">
      <div className="carousel-track" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
        {items.map((item, index) => (
          <div key={item.id || index} className={`carousel-item ${index === activeIndex ? 'active' : ''}`}>
            {renderItem(item, index === activeIndex)}
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <>
          <button onClick={prev} className="carousel-nav prev" aria-label="Previous">
            <ChevronLeft size={24} />
          </button>
          <button onClick={next} className="carousel-nav next" aria-label="Next">
            <ChevronRight size={24} />
          </button>

          <div className="carousel-dots">
            {items.map((_, idx) => (
              <button
                key={idx}
                className={`dot ${idx === activeIndex ? 'active' : ''}`}
                onClick={() => onIndexChange(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

function App() {
  const [cards, setCards] = useState([]);

  const [subscription, setSubscription] = useState(() => {
    return localStorage.getItem('subscription') || 'free';
  });

  const [activeCardIndex, setActiveCardIndex] = useState(0); // Lifted state for Carousel
  const [view, setView] = useState('dashboard'); // dashboard, editor
  const [editingCard, setEditingCard] = useState(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false); // New State for Auth Modal
  const [sharedCardId, setSharedCardId] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null); // Expanded Details View
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const [user, setUser] = useState(null); // Firebase Auth user



  const t = TRANSLATIONS['en'];

  // Listen for auth state changes with explicit persistence handling
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setCards([]); // Clear data on logout
        setSubscription('free');
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch Subscription Status from DB when User Logs In
  useEffect(() => {
    const fetchSubscription = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.subscription) {
              setSubscription(data.subscription);
              localStorage.setItem('subscription', data.subscription);
            }
          }
        } catch (error) {
          console.error("Error fetching subscription:", error);
        }
      }
    };
    fetchSubscription();
  }, [user]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login Error:", error);
      alert("Erreur de connexion : " + error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // Separate effect for data loading - depends specifically on user.uid to avoid object reference churn
  useEffect(() => {
    if (!user?.uid) {
      setCards([]); // Clear cards if no user
      return;
    }

    console.log("Subscribing to cards for user:", user.uid);
    const colRef = collection(db, 'users', user.uid, 'cards');

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log("Cards loaded from server:", loaded.length);
      setCards(loaded);
    }, (error) => {
      console.error("Error fetching cards:", error);
      alert("ERREUR CRITIQUE DE CHARGEMENT:\n" + error.message);
    });

    return () => unsubscribe();
  }, [user?.uid]);


  const handleSaveCard = async (cardData) => {
    setIsSaving(true);
    setStatusMessage({ type: 'info', text: 'Sauvegarde...' });

    if (!navigator.onLine) {
      alert('Erreur: Pas de connexion internet.');
      setIsSaving(false);
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("Erreur: Vous n'êtes pas connecté. Veuillez vous reconnecter.");
      setIsSaving(false);
      return;
    }

    try {
      // 1. Prepare Data
      // eslint-disable-next-line no-unused-vars
      const { id, ...rawData } = cardData;
      const dataToSave = JSON.parse(JSON.stringify(rawData));
      dataToSave.updatedAt = new Date().toISOString();
      dataToSave.userId = currentUser.uid;

      let savedId;

      // 2. Write to Firestore
      if (editingCard && !editingCard.id.startsWith('temp_')) {
        // Update existing
        savedId = editingCard.id;
        const docRef = doc(db, 'users', currentUser.uid, 'cards', savedId);
        await setDoc(docRef, dataToSave);

        // Manual State Update (Update Item)
        setCards(prev => prev.map(c => c.id === savedId ? { ...dataToSave, id: savedId } : c));
      } else {
        // Create new
        const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'cards'), dataToSave);
        savedId = docRef.id;

        // Manual State Update (Add Item)
        setCards(prev => [...prev, { ...dataToSave, id: savedId }]);
      }

      // 3. Success feedback
      setStatusMessage({ type: 'success', text: 'Sauvegardé !' });

      // Short timeout to let the user see the "Saved" state before closing
      setTimeout(() => {
        setView('dashboard');

        // FIND NEW INDEX to stay on this card
        setCards(currentCards => {
          const newIndex = currentCards.findIndex(c => c.id === savedId);
          if (newIndex !== -1) setActiveCardIndex(newIndex);
          return currentCards;
        });

        setEditingCard(null);
        setStatusMessage(null);
        setIsSaving(false);
      }, 500);

    } catch (error) {
      console.error("Save Error:", error);
      alert(`Erreur de sauvegarde (${error.code || 'unknown'}): ${error.message}`);
      setStatusMessage({ type: 'error', text: error.message });
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    if (confirm(t.confirmDelete)) {
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'cards', id);
        await deleteDoc(docRef);
        // Optimistically remove from list to feel fast, onSnapshot will confirm
        setCards(cards.filter(c => c.id !== id));
      } catch (err) {
        alert("Erreur lors de la suppression: " + err.message);
      }
    }
  };

  const handleUpgrade = async (plan) => {
    if (!user?.uid) return;

    // In a real app, here you would redirect to Stripe checkout.
    // On success webhook, you update the DB. 
    // For now, we simulate immediate upgrade:

    const userRef = doc(db, 'users', user.uid);
    // Merge true to avoid overwriting other fields
    await setDoc(userRef, { subscription: plan }, { merge: true });

    setSubscription(plan);
    setShowPricing(false);
    alert(`${t.upgraded} ${plan === 'basic' ? t.standard : t.premium} plan.`);
  };







  return (
    <ErrorBoundary>
      <div className="app-container">
        {/* Header */}
        <header className="app-header glass-header">
          <div className="brand">
            <div className="brand-icon-pro">
              <Smartphone className="text-white" size={24} />
            </div>
            <h1 className="brand-name-pro">
              {t.appName}
            </h1>
          </div>

          <div className="header-controls">
            {user && (
              <>
                <div className="plan-badge-pro">
                  {subscription === 'pro' ? 'PREMIUM' : (subscription === 'basic' ? 'STANDARD' : 'FREE')}
                </div>
                <button onClick={handleLogout} className="btn-logout" title="Sign Out">
                  <LogOut size={20} />
                </button>
              </>
            )}
          </div>
        </header>

        {/* Auth Modal */}
        {showAuthModal && !user && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onLoginGoogle={() => {
              setShowAuthModal(false);
              handleLogin();
            }}
          />
        )}

        {/* Main Content */}
        <main className="main-content-pro">
          {view === 'dashboard' ? (
            <>
              {cards.length === 0 ? (
                <div className="empty-state-pro">
                  <div className="empty-icon-pro">
                    <CreditCard size={48} />
                  </div>
                  <h3>{t.noCards}</h3>
                  <p>{t.startCreating}</p>
                  {user ? (
                    <button
                      onClick={() => {
                        setEditingCard(null);
                        setView('editor');
                      }}
                      className="btn-create-pro"
                    >
                      <Plus size={20} /> {t.createFirst}
                    </button>
                  ) : (
                    <button onClick={() => setShowAuthModal(true)} className="btn-create-pro">
                      <LogIn size={18} /> {t.login}
                    </button>
                  )}
                </div>
              ) : (
                <div className="carousel-wrapper">
                  <Carousel
                    items={cards}
                    activeIndex={activeCardIndex}
                    onIndexChange={setActiveCardIndex}
                    renderItem={(card, isActive) => (
                      <div className="card-slide-container">
                        <div className="pro-card-container-wrapper">
                          <CardPreview
                            card={card}
                            showQR={sharedCardId === card.id}
                            isExpanded={expandedCardId === card.id}
                            onToggleExpand={() => setExpandedCardId(expandedCardId === card.id ? null : card.id)}
                            t={t}
                          />
                          {/* Floating Actions for this card */}
                          <div className={`pro-card-actions ${isActive ? 'visible' : ''}`}>
                            <button
                              onClick={() => {
                                setEditingCard(card);
                                setView('editor');
                              }}
                              className="action-circle-btn edit"
                              title={t.edit}
                            >
                              <Edit2 size={20} />
                              <span className="btn-label">{t.edit}</span>
                            </button>

                            <button
                              onClick={() => setSharedCardId(sharedCardId === card.id ? null : card.id)}
                              className={`action-circle-btn share ${sharedCardId === card.id ? 'active' : ''}`}
                              title={t.share}
                            >
                              {sharedCardId === card.id ? <X size={20} /> : <Share2 size={20} />}
                              <span className="btn-label">{sharedCardId === card.id ? t.close : t.share}</span>
                            </button>

                            <button
                              onClick={() => handleDelete(card.id)}
                              className="action-circle-btn delete"
                              title={t.delete}
                            >
                              <Trash2 size={20} />
                              <span className="btn-label">Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  />
                  {cards.length < (subscription === 'pro' ? PRICING.pro.limit : (subscription === 'basic' ? PRICING.basic.limit : 1)) && (
                    <div style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: '1rem' }}>
                      <button
                        onClick={() => {
                          setEditingCard(null);
                          setView('editor');
                        }}
                        className="btn-create-pro"
                        style={{ margin: '0 auto' }}
                      >
                        <Plus size={20} /> {t.createNewCard}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : view === 'settings' ? (
            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px', margin: '2rem auto' }}>
              <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Settings</h2>

              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ color: '#94a3b8' }}>Current Plan</span>
                  <span className="plan-badge-pro" style={{ margin: 0 }}>
                    {subscription === 'pro' ? 'PREMIUM PACK' : (subscription === 'basic' ? 'STANDARD PACK' : 'FREE')}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ color: '#94a3b8' }}>Status</span>
                  <span style={{ color: '#4ade80', fontWeight: 'bold' }}>Active</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ color: '#94a3b8' }}>Renewal Date</span>
                  <span style={{ color: 'white' }}>{new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString()}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8' }}>Cards Used</span>
                  <span style={{ color: 'white' }}>
                    {cards.length} / {subscription === 'pro' ? PRICING.pro.limit : (subscription === 'basic' ? PRICING.basic.limit : 1)}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                  To manage your billing or cancel your subscription, please contact support.
                </p>
              </div>

              <button
                onClick={() => setView('dashboard')}
                className="btn-secondary"
                style={{ width: '100%', marginTop: '1rem' }}
              >
                Back to Dashboard
              </button>
            </div>
          ) : (
            <Editor
              card={editingCard}
              onSave={handleSaveCard}
              subscription={subscription}
              onCancel={() => {
                setView('dashboard');
                setEditingCard(null);
              }}
              t={t}
              isSaving={isSaving}
              statusMessage={statusMessage}
            />
          )}
        </main>

        {/* Footer Navigation */}
        <nav className="app-footer">
          <button
            className={`footer-nav-item ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => setView('dashboard')}
          >
            <CreditCard size={24} />
            <span>Cards</span>
          </button>

          <button
            className="footer-nav-item highlight"
            onClick={() => setShowPricing(true)}
          >
            <Gem size={24} />
            <span>Upgrade</span>
          </button>

          <button
            className={`footer-nav-item ${view === 'settings' ? 'active' : ''}`}
            onClick={() => setView('settings')}
          >
            <Settings size={24} />
            <span>Settings</span>
          </button>
        </nav>

        {/* Pricing Modal */}
        {
          showPricing && (
            <PricingModal
              currentPlan={subscription}
              onUpgrade={handleUpgrade}
              onClose={() => setShowPricing(false)}
              t={t}
            />
          )
        }
      </div >
    </ErrorBoundary >
  );
}

export default App;
