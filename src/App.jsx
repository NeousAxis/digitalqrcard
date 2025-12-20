
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Smartphone, Edit2, Trash2, Plus, Share2, Download,
  MapPin, Globe, Mail, Phone, Building2, Briefcase,
  User, Star, X, Check, Copy, LogIn, LogOut,
  CreditCard, Layout, Zap, Cloud, CloudOff, AlertCircle, RefreshCw, Gem,
  ChevronLeft, ChevronRight, Settings
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
  basic: 2,
  pro: 5
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

  // Remaining fields for the list
  const listFields = fields.filter(f => !['title', 'company', 'phone', 'email', 'website', 'location'].includes(f.type));

  /* Safe Theme Resolution */
  const safeTheme = (card.theme && THEME_COLORS[card.theme]) ? card.theme : 'pantone-classic-blue';
  const themeBg = THEME_COLORS[safeTheme];

  const accentColor = (themeBg && themeBg.includes('gradient'))
    ? themeBg.match(/#[a-fA-F0-9]{6}/)?.[0] || '#38bdf8'
    : themeBg || '#38bdf8';

  return (
    <div
      className={`pro-card ${isExpanded ? 'expanded' : ''}`}
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
        <p className="pro-title">{displayTitle || t.yourTitle}</p>

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
            {/* 4. Action Buttons Row */}
            <div className="pro-actions-row">
              {phone && (
                <a href={`tel:${phone}`} className="pro-action-btn action-phone" title={phone} style={{ textDecoration: 'none', color: accentColor }}>
                  <Phone size={20} />
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="pro-action-btn action-email" title={email} style={{ textDecoration: 'none', color: accentColor }}>
                  <Mail size={20} />
                </a>
              )}
              {website && (
                <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="pro-action-btn action-web" title={website} style={{ textDecoration: 'none', color: accentColor }}>
                  <Globe size={20} />
                </a>
              )}
              {location && (
                <div className="pro-action-btn action-map" title={location} style={{ color: accentColor }}>
                  <MapPin size={20} />
                </div>
              )}
            </div>

            {/* 5. Additional Info List (Expanded View) - NOW SHOWS ALL CONTACT DETAILS */}
            {isExpanded && (
              <div className="pro-details-list animate-fade-in" style={{ width: '100%', textAlign: 'left', marginTop: '1rem' }}>
                {/* Standard Contact Fields in List */}
                {phone && (
                  <div className="pro-detail-item" style={{ borderBottom: '1px solid #f1f5f9', padding: '0.75rem 0' }}>
                    <span className="pro-detail-icon" style={{ minWidth: '24px', color: accentColor }}><Phone size={16} /></span>
                    <div>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8' }}>Mobile</div>
                      <div style={{ color: '#334155' }}>
                        <a href={`tel:${phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{phone}</a>
                      </div>
                    </div>
                  </div>
                )}
                {email && (
                  <div className="pro-detail-item" style={{ borderBottom: '1px solid #f1f5f9', padding: '0.75rem 0' }}>
                    <span className="pro-detail-icon" style={{ minWidth: '24px', color: accentColor }}><Mail size={16} /></span>
                    <div>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8' }}>Email</div>
                      <div style={{ color: '#334155' }}>
                        <a href={`mailto:${email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{email}</a>
                      </div>
                    </div>
                  </div>
                )}
                {website && (
                  <div className="pro-detail-item" style={{ borderBottom: '1px solid #f1f5f9', padding: '0.75rem 0' }}>
                    <span className="pro-detail-icon" style={{ minWidth: '24px', color: accentColor }}><Globe size={16} /></span>
                    <div>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8' }}>Website</div>
                      <div style={{ color: '#334155' }}>
                        <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>{website}</a>
                      </div>
                    </div>
                  </div>
                )}
                {location && (
                  <div className="pro-detail-item" style={{ borderBottom: '1px solid #f1f5f9', padding: '0.75rem 0' }}>
                    <span className="pro-detail-icon" style={{ minWidth: '24px', color: accentColor }}><MapPin size={16} /></span>
                    <div>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8' }}>Address</div>
                      <div style={{ color: '#334155' }}>{location}</div>
                    </div>
                  </div>
                )}

                {/* Custom Fields */}
                {listFields.map((field, idx) => (
                  <div key={idx} className="pro-detail-item" style={{ borderBottom: '1px solid #f1f5f9', padding: '0.75rem 0' }}>
                    <span className="pro-detail-icon" style={{ minWidth: '24px', color: accentColor }}><Star size={16} /></span>
                    <div>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8' }}>{field.label || field.type}</div>
                      <div style={{ color: '#334155' }}>{field.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 6. Main CTA - Toggles Expansion */}
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

const Editor = ({ card, onSave, onCancel, t, isSaving, statusMessage }) => {
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
        {/* Image Upload Section */}
        <div className="form-group" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
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
              cursor: 'pointer',
              position: 'relative'
            }}
            onClick={() => document.getElementById('card-image-input').click()}
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
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', cursor: 'pointer' }}
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
              <li>1 {t.digitalCard}</li>
              <li>{t.unlimitedShare}</li>
              <li>{t.universalQR}</li>
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
              <li>{PRICING.basic.limit} {t.digitalCards}</li>
              <li>{t.premiumStyles}</li>
              <li>{t.prioritySupport}</li>
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
              <li>{PRICING.pro.limit} {t.digitalCards}</li>
              <li>{t.unlimitedAll}</li>
              <li>{t.proBadge}</li>
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

function App() {
  const [cards, setCards] = useState([]);

  const [subscription, setSubscription] = useState(() => {
    return localStorage.getItem('subscription') || 'free';
  });

  const [view, setView] = useState('dashboard'); // dashboard, editor
  const [editingCard, setEditingCard] = useState(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false); // New State for Auth Modal
  const [sharedCardId, setSharedCardId] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null); // Expanded Details View
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const [user, setUser] = useState(null); // Firebase Auth user

  /* --- PRO CAROUSEL COMPONENT --- */
  // eslint-disable-next-line react/prop-types
  const Carousel = ({ items, renderItem }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const next = () => setActiveIndex(current => (current + 1) % items.length);
    const prev = () => setActiveIndex(current => (current - 1 + items.length) % items.length);

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
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

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
                  {subscription.toUpperCase()}
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
            className="footer-nav-item"
            onClick={() => alert("Settings coming soon!")}
          >
            <Settings size={24} />
            <span>Settings</span>
          </button>
        </nav>

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
    </ErrorBoundary>
  );
}

export default App;
