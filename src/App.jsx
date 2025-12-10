
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Plus,
  Edit2,
  Trash2,
  Share2,
  Smartphone,
  CreditCard,
  Check,
  X,
  User,
  Phone,
  Mail,
  Globe,
  Briefcase,
  Languages,
  LogIn,
  LogOut,
  Building2,
  MapPin,
  Star,
  Cloud,
  CloudOff,
  RefreshCw,
  // New Icons for Pro Design
  Linkedin,
  Facebook,
  Twitter,
  Instagram
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
import { getAuth, signInAnonymously, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
// --- Utils ---
const THEME_COLORS = {
  // Gradients (Radiants)
  'radiant-ocean': 'linear-gradient(135deg, #00c6fb 0%, #005bea 100%)',
  'radiant-sunset': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'radiant-nature': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'radiant-purple': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'radiant-dark': 'linear-gradient(to right, #434343 0%, black 100%)',
  // Solids
  'card-bg-1': '#FF6B6B',
  'card-bg-2': '#4facfe',
  'card-bg-3': '#43e97b',
  'card-bg-4': '#fa709a',
  'card-bg-5': '#a18cd1'
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

// Initialize Firestore with Offline Persistence to avoid blocking UI on network issues
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';

const db = initializeFirestore(app, {
  // experimentalForceLongPolling: true, // AUTO-DETECT is better generally. Only use force if WS fails consistently.
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

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
  basic: 2,
  pro: 5
};

const TRANSLATIONS = {
  fr: {
    appName: 'DigitalQRCard',
    plan: 'Plan',
    manageSub: 'Gérer l\'abonnement',
    yourCards: 'Vos Cartes',
    manageCards: 'Gérez et partagez vos cartes de visite digitales',
    newCard: 'Nouvelle Carte',
    noCards: 'Aucune carte créée',
    startCreating: 'Commencez par créer votre première carte de visite digitale.',
    createFirst: 'Créer ma première carte',
    edit: 'Modifier',
    delete: 'Supprimer',
    share: 'Partager',
    close: 'Fermer',
    scanToAdd: 'Scannez pour ajouter',
    editCard: 'Modifier la carte',
    createNewCard: 'Nouvelle carte',
    fullName: 'Nom complet',
    title: 'Titre / Poste',
    company: 'Entreprise',
    phone: 'Téléphone',
    email: 'Email',
    website: 'Site Web',
    cardStyle: 'Style de la carte',
    cancel: 'Annuler',
    save: 'Enregistrer',
    choosePlan: 'Choisissez votre plan',
    moreCards: 'Gérez plus de cartes de visite digitales',
    free: 'Gratuit',
    month: '/mois',
    digitalCard: 'Carte digitale',
    digitalCards: 'Cartes digitales',
    unlimitedShare: 'Partage illimité',
    universalQR: 'QR Code universel',
    currentPlan: 'Plan Actuel',
    select: 'Sélectionner',
    popular: 'POPULAIRE',
    standardPack: 'Pack Standard',
    premiumPack: 'Pack Premium',
    premiumStyles: 'Styles premium',
    prioritySupport: 'Support prioritaire',
    chooseThis: 'Choisir ce plan',
    unlimitedAll: 'Tout illimité',
    proBadge: 'Badge Pro',
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer cette carte ?',
    upgraded: 'Merci ! Vous êtes maintenant abonné au plan',
    standard: 'Standard',
    premium: 'Premium',
    yourName: 'Votre Nom',
    yourTitle: 'Votre Titre',
    yourCompany: 'Ma Société SA',
    address: 'Adresse',
    login: 'Connexion',
    logout: 'Déconnexion',
    welcome: 'Bienvenue',
    extraFieldLabel: 'Label Champ Supplémentaire',
    extraFieldValue: 'Valeur Champ Supplémentaire'
  },
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
    welcome: 'Welcome'
  }
};

const PRICING = {
  basic: { price: '2 CHF', limit: 2, key: 'standardPack' },
  pro: { price: '4 CHF', limit: 5, key: 'premiumPack' }
};

// --- Components ---

const FIELD_TYPES = [
  { value: 'title', label: 'Title/Position', icon: Briefcase },
  { value: 'company', label: 'Company', icon: Building2 },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'website', label: 'Website', icon: Globe },
  { value: 'location', label: 'Address', icon: MapPin },
  { value: 'custom', label: 'Custom', icon: Star }
];

const CardPreview = ({ card, showQR, onClick, t }) => {
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
  const displayTitle = [title, company].filter(Boolean).join(' @ ');
  const phone = fields.find(f => f.type === 'phone')?.value;
  const email = fields.find(f => f.type === 'email')?.value;
  const website = fields.find(f => f.type === 'website')?.value;
  const location = fields.find(f => f.type === 'location')?.value;

  // Remaining fields for the list
  const listFields = fields.filter(f => !['title', 'company', 'phone', 'email', 'website', 'location'].includes(f.type));

  const themeBg = THEME_COLORS[card.theme || 'card-bg-1'];
  // Heuristic to get a solid color from the theme for the button/accents
  // If gradient, take the first color. If solid, use it.
  const accentColor = themeBg.includes('gradient')
    ? themeBg.match(/#[a-fA-F0-9]{6}/)?.[0] || '#38bdf8'
    : themeBg;

  return (
    <div
      onClick={onClick}
      className="pro-card"
      style={{ cursor: 'pointer' }}
    >
      {/* 1. Header Banner */}
      <div
        className="pro-header-banner"
        style={{ background: themeBg }}
      ></div>

      {/* 2. Avatar (Overlapping) */}
      <div className="pro-avatar-wrapper">
        <div className="pro-avatar">
          {/* Use first letter of name or User icon */}
          {card.name ? (
            <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: accentColor }}>{card.name.charAt(0).toUpperCase()}</span>
          ) : (
            <User size={48} color={accentColor} />
          )}
        </div>
      </div>

      {/* 3. Main Content */}
      <div className="pro-content">
        <h3 className="pro-name">{card.name || t.yourName}</h3>
        <p className="pro-title">{displayTitle || t.yourTitle}</p>

        {showQR ? (
          <div style={{ margin: '1rem 0' }}>
            <QRCodeSVG
              value={`BEGIN: VCARD
VERSION: 3.0
N: ;${card.name || ''};;;
FN:${card.name || ''}
ORG:${company || ''}
TITLE:${title || ''}
${fields
                  .filter(f => f.type !== 'title' && f.type !== 'company') // <--- FIX: Exclude title/company from loop to avoid duplication in Notes
                  .map(f => {
                    // Smart VCard Mapping
                    const val = f.value;
                    const lbl = (f.label || '').toLowerCase();

                    if (f.type === 'phone' || lbl.includes('phone') || lbl.includes('tel') || lbl.includes('mobile')) {
                      return `TEL;TYPE=CELL,VOICE:${val}`;
                    }
                    if (f.type === 'email' || lbl.includes('email') || lbl.includes('mail')) {
                      return `EMAIL;TYPE=WORK,INTERNET:${val}`;
                    }
                    if (f.type === 'website' || lbl.includes('web') || lbl.includes('site')) {
                      return `URL:${val}`;
                    }
                    if (f.type === 'location' || lbl.includes('address') || lbl.includes('adresse')) {
                      return `ADR;TYPE=WORK:;;${val};;;;`;
                    }
                    // Fallback to Note
                    const noteLabel = f.label || f.type || 'Info';
                    return `NOTE:${noteLabel.toUpperCase()}: ${val}`;
                  }).join('\n')
                }
END: VCARD`}
              size={160}
              level="M"
            />
            <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>Scan to save contact</p>
          </div>
        ) : (
          <>
            {/* 4. Action Buttons Row */}
            <div className="pro-actions-row">
              {phone && (
                <div className="pro-action-btn action-phone" title={phone}>
                  <Phone size={20} />
                </div>
              )}
              {email && (
                <div className="pro-action-btn action-email" title={email}>
                  <Mail size={20} />
                </div>
              )}
              {website && (
                <div className="pro-action-btn action-web" title={website}>
                  <Globe size={20} />
                </div>
              )}
              {location && (
                <div className="pro-action-btn action-map" title={location}>
                  <MapPin size={20} />
                </div>
              )}
            </div>

            {/* 5. Additional Info List (if any) */}
            {listFields.length > 0 && (
              <div className="pro-details-list">
                {listFields.map((field, idx) => (
                  <div key={idx} className="pro-detail-item">
                    <span className="pro-detail-icon"><Star size={14} /></span>
                    <span>{field.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 6. Main CTA */}
            <button
              className="pro-footer-btn"
              style={{ color: accentColor, borderColor: accentColor }}
            >
              Click here for more information
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

const Editor = ({ card, onSave, onCancel, t, isSaving, statusMessage }) => {
  const [name, setName] = useState(card?.name || '');
  const [theme, setTheme] = useState(card?.theme || 'radiant-ocean'); // Default to a nice radiant
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
      theme,
      fields: fields.filter(f => f.value && String(f.value).trim() !== '')
    });
  };

  return (
    <div className="editor-container glass-panel">
      <h2 className="editor-title">{card ? t.edit : t.createNewCard}</h2>

      <form onSubmit={handleSubmit} className="editor-form">
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
                  <div className="select-wrapper" style={{ position: 'relative', width: '70%' }}>
                    <select
                      value={field.type}
                      onChange={(e) => updateField(index, 'type', e.target.value)}
                      className="form-select"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                    >
                      {FIELD_TYPES.map(ft => (
                        <option key={ft.value} value={ft.value}>{ft.label}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    className="icon-btn delete"
                    title="Remove field"
                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Input Value */}
                <div className="input-group">
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => updateField(index, 'value', e.target.value)}
                    placeholder="Enter details..."
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>

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
        {statusMessage && (
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
        )}
      </form>
    </div>
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
          <div className={`pricing - card ${currentPlan === 'free' ? 'highlight' : ''} `}>
            <h3>{t.free}</h3>
            <div className="price">0 CHF<span>{t.month}</span></div>
            <ul className="features-list">
              <li><Check size={16} className="text-primary" /> 1 {t.digitalCard}</li>
              <li><Check size={16} className="text-primary" /> {t.unlimitedShare}</li>
              <li><Check size={16} className="text-primary" /> {t.universalQR}</li>
            </ul>
            <button
              disabled={currentPlan === 'free'}
              className={`btn - full ${currentPlan === 'free' ? 'btn-secondary' : 'btn-secondary'} `}
              style={{ opacity: currentPlan === 'free' ? 0.5 : 1 }}
            >
              {currentPlan === 'free' ? t.currentPlan : t.select}
            </button>
          </div>

          {/* Basic Plan */}
          <div className={`pricing - card ${currentPlan === 'basic' ? 'highlight' : ''} `}>
            <div className="popular-badge">{t.popular}</div>
            <h3>{t[PRICING.basic.key]}</h3>
            <div className="price">{PRICING.basic.price}<span>{t.month}</span></div>
            <ul className="features-list">
              <li><Check size={16} className="text-primary" /> {PRICING.basic.limit} {t.digitalCards}</li>
              <li><Check size={16} className="text-primary" /> {t.premiumStyles}</li>
              <li><Check size={16} className="text-primary" /> {t.prioritySupport}</li>
            </ul>
            <button
              onClick={() => onUpgrade('basic')}
              disabled={currentPlan === 'basic'}
              className={`btn - full ${currentPlan === 'basic' ? 'btn-secondary' : 'btn-primary'} `}
              style={{ opacity: currentPlan === 'basic' ? 0.5 : 1 }}
            >
              {currentPlan === 'basic' ? t.currentPlan : t.chooseThis}
            </button>
          </div>

          {/* Pro Plan */}
          <div className={`pricing - card ${currentPlan === 'pro' ? 'highlight' : ''} `}>
            <h3>{t[PRICING.pro.key]}</h3>
            <div className="price">{PRICING.pro.price}<span>{t.month}</span></div>
            <ul className="features-list">
              <li><Check size={16} className="text-primary" /> {PRICING.pro.limit} {t.digitalCards}</li>
              <li><Check size={16} className="text-primary" /> {t.unlimitedAll}</li>
              <li><Check size={16} className="text-primary" /> {t.proBadge}</li>
            </ul>
            <button
              onClick={() => onUpgrade('pro')}
              disabled={currentPlan === 'pro'}
              className={`btn - full ${currentPlan === 'pro' ? 'btn-secondary' : 'btn-secondary'} `}
              style={{ opacity: currentPlan === 'pro' ? 0.5 : 1 }}
            >
              {currentPlan === 'pro' ? t.currentPlan : t.chooseThis}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

function App() {
  const [cards, setCards] = useState([]);

  const [subscription, setSubscription] = useState(() => {
    return localStorage.getItem('subscription') || 'free';
  });

  const [lang, setLang] = useState('en');

  const [view, setView] = useState('dashboard'); // dashboard, editor
  const [editingCard, setEditingCard] = useState(null);
  const [showPricing, setShowPricing] = useState(false);
  const [sharedCardId, setSharedCardId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [user, setUser] = useState(null); // Firebase Auth user

  const t = TRANSLATIONS[lang];
  // Listen for auth state changes
  // Listen for auth state changes with explicit persistence handling
  useEffect(() => {
    // Only attempt sign-in if we are sure no user is loaded after initial check
    // We let onAuthStateChanged handle the initial 'restore' from local storage first.
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setEditingCard(null); // Reset logic to avoid confusion
      } else {
        // Only sign in if strictly necessary and not ensuring persistence
        signInAnonymously(auth).catch((error) => {
          console.error("Auth Error:", error);
          // If error is network, do not retry infinitely
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Separate effect for data loading when user changes
  useEffect(() => {
    if (!user) return;

    // Then listen to Firebase
    const colRef = collection(db, 'users', user.uid, 'cards');

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        _isPending: doc.metadata.hasPendingWrites
      }));
      setCards(loaded);
    }, (error) => {
      console.error("Error fetching cards:", error);
    });

    return () => unsubscribe();
  }, [user]);



  // Keep subscription in localStorage (still simple) -> REMOVED in favor of Firestore
  // useEffect(() => {
  //   localStorage.setItem('subscription', subscription);
  // }, [subscription]);

  const limit = SUBSCRIPTION_LIMITS[subscription];
  const canAddCard = cards.length < limit;

  const [statusMessage, setStatusMessage] = useState(null);

  const handleSaveCard = async (cardData) => {
    setIsSaving(true);
    setStatusMessage({ type: 'info', text: 'Vérification de la connexion...' });

    if (!navigator.onLine) {
      alert('Pas de connexion internet détectée.');
      setStatusMessage({ type: 'error', text: 'Pas de connexion internet.' });
      setIsSaving(false);
      return;
    }

    if (!user?.uid) {
      setStatusMessage({ type: 'error', text: 'Authentification requise. Veuillez patienter...' });
      // Try to wait a bit for auth
      await new Promise(r => setTimeout(r, 1000));
      if (!auth.currentUser) {
        alert('Erreur: Vous n\'êtes pas connecté au serveur.');
        setStatusMessage({ type: 'error', text: 'Erreur d\'authentification. Rechargez la page.' });
        setIsSaving(false);
        return;
      }
    }

    try {
      setStatusMessage({ type: 'info', text: 'Préparation des données...' });

      // Remove the temporary 'id' if it's a new card
      // eslint-disable-next-line no-unused-vars
      const { id, ...rawData } = cardData;

      // Sanitize data
      const dataToSave = JSON.parse(JSON.stringify(rawData));
      dataToSave.updatedAt = new Date().toISOString();

      console.log('Sending to Firestore...');
      setStatusMessage({ type: 'info', text: 'Envoi au serveur en cours...' });

      let targetDocRef;

      // 1. OPTIMISTIC UPDATE (Instant Feedback)
      // This ensures the "spinner" stops immediately and user sees their card.
      const optimisticCard = {
        ...dataToSave,
        id: editingCard?.id || 'temp_' + Date.now(),
        _isPending: true
      };

      setCards(prev => {
        if (editingCard) {
          return prev.map(c => c.id === editingCard.id ? optimisticCard : c);
        }
        return [...prev, optimisticCard];
      });

      setStatusMessage({ type: 'success', text: 'Enregistré !' });

      // Immediate switch
      setTimeout(() => {
        setView('dashboard');
        setEditingCard(null);
        setStatusMessage(null);
        setIsSaving(false);
      }, 500);

      // 2. BACKGROUND SYNC
      // We process the write in background. The onSnapshot listener will eventually
      // replace our optimistic card with the real server data (confirming sync).
      (async () => {
        try {
          if (editingCard) {
            const docRef = doc(db, 'users', user.uid, 'cards', editingCard.id);
            await setDoc(docRef, dataToSave);
          } else {
            await addDoc(collection(db, 'users', user.uid, 'cards'), dataToSave);
          }
        } catch (bgError) {
          console.error("Background Sync Error:", bgError);
          // Update the specific card in local state to show ERROR instead of Spinner
          setCards(prev => prev.map(c => {
            // Match by ID (handling the temp ID or persistent ID)
            if (c.id === (editingCard?.id || optimisticCard.id)) {
              return { ...c, _isPending: false, _error: bgError.message };
            }
            return c;
          }));
        }
      })();

    } catch (error) {
      console.error("Error saving card:", error);
      setStatusMessage({ type: 'error', text: error.message });
      // Do NOT close modal so user can retry
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!user?.uid) {
      return;
    }
    if (confirm(t.confirmDelete)) {
      const docRef = doc(db, 'users', user.uid, 'cards', id);
      await deleteDoc(docRef);
      setCards(cards.filter(c => c.id !== id));
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



  const handleLogout = async () => {
    await signOut(auth);
    setCards([]);
    setSubscription('free');
  };

  const toggleLang = () => {
    setLang(l => l === 'en' ? 'fr' : 'en');
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">
            <Smartphone className="text-white" size={24} />
          </div>
          <h1 className="brand-name">
            {t.appName}
          </h1>
        </div>

        <div className="header-controls">
          <button
            onClick={toggleLang}
            className="lang-btn"
            title="Switch Language"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              color: 'white',
              cursor: 'pointer',
              padding: 0
            }}
          >
            {lang === 'en' ? 'FR' : 'EN'}
          </button>

          {user ? (
            <>
              <div className="plan-info">
                <span className="plan-badge">{subscription}</span> <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>({cards.length}/{limit})</span>
              </div>
              <button
                onClick={() => setShowPricing(true)}
                className="btn-secondary"
              >
                {t.manageSub}
              </button>
            </>
          ) : (
            <div style={{ color: 'white', fontSize: '0.8rem' }}>
              Loading Auth...
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {view === 'dashboard' ? (
          <>
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 className="section-title">{t.yourCards}</h2>
              {user && (
                <button
                  onClick={() => {
                    if (canAddCard) {
                      setEditingCard(null);
                      setView('editor');
                    } else {
                      setShowPricing(true);
                    }
                  }}
                  className="btn-primary"
                >
                  <Plus size={20} /> {t.newCard}
                </button>
              )}
            </div>

            {cards.length === 0 ? (
              <div className="glass-panel empty-state">
                <div className="empty-icon">
                  <CreditCard size={40} className="text-gray-500" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{t.noCards}</h3>
                <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                  {t.startCreating}
                </p>
                {user ? (
                  <button
                    onClick={() => {
                      setEditingCard(null);
                      setView('editor');
                    }}
                    className="btn-primary"
                  >
                    {t.createFirst}
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="cards-grid">
                {cards.map(card => (
                  <div key={card.id} className="glass-panel card-wrapper">
                    <div className="card-preview-container">
                      <CardPreview
                        card={card}
                        showQR={sharedCardId === card.id}
                        onClick={() => setSharedCardId(sharedCardId === card.id ? null : card.id)}
                        t={t}
                      />
                      {/* Sync Status Indicator */}
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        color: 'white',
                        pointerEvents: 'none'
                      }}>
                        {card._error ? (
                          <>
                            <AlertCircle size={12} className="text-red-500" />
                            <span style={{ color: '#ef4444', fontWeight: 'bold' }} title={card._error}>Erreur Synchro</span>
                          </>
                        ) : card._isPending ? (
                          <>
                            <RefreshCw size={12} className="spin-slow" />
                            <span>En attente...</span>
                          </>
                        ) : (
                          <>
                            <Cloud size={12} className="text-green-400" />
                            <span style={{ color: '#4ade80' }}>Synchronisé</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="card-actions">
                      <div className="action-group">
                        <button
                          onClick={() => {
                            setEditingCard(card);
                            setView('editor');
                          }}
                          className="icon-btn"
                          title={t.edit}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(card.id)}
                          className="icon-btn delete"
                          title={t.delete}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <button
                        onClick={() => setSharedCardId(sharedCardId === card.id ? null : card.id)}
                        className={`share - btn ${sharedCardId === card.id ? 'active' : ''} `}
                      >
                        <Share2 size={18} />
                        {sharedCardId === card.id ? t.close : t.share}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <Editor
            card={editingCard}
            onSave={handleSaveCard}
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

      {/* Pricing Modal */}
      {showPricing && (
        <PricingModal
          currentPlan={subscription}
          onUpgrade={handleUpgrade}
          onClose={() => setShowPricing(false)}
          t={t}
        />
      )}
    </div>
  );
}

export default App;
