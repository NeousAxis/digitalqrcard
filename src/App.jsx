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
  Star
} from 'lucide-react';
// Firebase imports
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';
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
const db = getFirestore(app);
const auth = getAuth(app);
const generateVCard = (card) => {
  const nameParts = card.name ? card.name.trim().split(/\s+/) : [];
  const lastName = nameParts.length > 1 ? nameParts.pop() : '';
  const firstName = nameParts.join(' ') || (card.name || '');
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
    `FN:${firstName} ${lastName}`,
    `ORG:${card.company};`,
    `TITLE:${card.title}`,
    `TEL;TYPE=CELL,VOICE:${card.phone}`,
    `EMAIL;TYPE=WORK,INTERNET:${card.email}`,
    `URL:${card.website}`
  ];
  if (card.address) {
    lines.push(`ADR;TYPE=WORK:;;${card.address};;;;`);
  }
  if (card.extraLabel && card.extraValue) {
    lines.push(`${card.extraLabel.toUpperCase()}:${card.extraValue}`);
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
  const Icon = Smartphone;
  // Backward compatibility: construct fields if they don't exist
  const fields = card.fields || [
    { type: 'title', value: card.title },
    { type: 'company', value: card.company },
    { type: 'phone', value: card.phone },
    { type: 'email', value: card.email },
    { type: 'website', value: card.website },
    { type: 'location', value: card.location }, // Fixed: uses card.location as per previous definition
    { type: 'custom', value: card.extra, label: card.extraLabel }
  ].filter(f => f.value);

  const getIcon = (type) => {
    const ft = FIELD_TYPES.find(f => f.value === type);
    return ft ? <ft.icon size={16} /> : <Star size={16} />;
  };

  return (
    <div
      onClick={onClick}
      className={`digital-card theme-${card.theme || 'card-bg-1'}`}
      style={{
        background: THEME_COLORS[card.theme || 'card-bg-1'],
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative patterns */}
      <div className="card-pattern-circle-1" />
      <div className="card-pattern-circle-2" />

      <div className="card-content">
        <div className="card-header-section">
          <div className="card-avatar-placeholder">
            <User size={32} className="text-white opacity-90" />
          </div>
          <div className="card-main-info">
            <h3 className="card-name">{card.name || t.yourName}</h3>
            {/* Render first 'title' field as subtitle if exists, otherwise first field */}
            <p className="card-title">
              {fields.find(f => f.type === 'title')?.value || (fields[0]?.value)}
            </p>
          </div>
        </div>

        <div className="card-body-section">
          {showQR ? (
            <div className="qr-wrapper" style={{ background: 'white', padding: '1rem', borderRadius: '1rem', margin: '0 auto', width: 'fit-content' }}>
              <QRCodeSVG
                value={`BEGIN:VCARD\nVERSION:3.0\nFN:${card.name}\n${fields.map(f => {
                  if (f.type === 'phone') return `TEL:${f.value}`;
                  if (f.type === 'email') return `EMAIL:${f.value}`;
                  if (f.type === 'website') return `URL:${f.value}`;
                  if (f.type === 'title') return `TITLE:${f.value}`;
                  if (f.type === 'company') return `ORG:${f.value}`;
                  if (f.type === 'location') return `ADR:;;${f.value}`;
                  return `NOTE:${f.label || f.type}: ${f.value}`;
                }).join('\n')}\nEND:VCARD`}
                size={180}
                level="M"
              />
            </div>
          ) : (
            <div className="info-stack">
              {fields.map((field, idx) => (
                <div key={idx} className="info-row">
                  <span className="info-icon-wrapper">
                    {getIcon(field.type)}
                  </span>
                  <div className="info-content">
                    <span className="info-value">{field.value}</span>
                    <span className="info-label">{(field.type === 'custom' ? field.label : FIELD_TYPES.find(t => t.value === field.type)?.label) || field.type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
    { type: 'custom', value: card.extra || card.extraValue, label: card.extraLabel }
  ].filter(f => f.value);
};

const Editor = ({ card, onSave, onCancel, t }) => {
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
      fields: fields.filter(f => f.value.trim() !== '')
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
                className={`theme-option ${theme === key ? 'active' : ''}`}
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
            {t.save}
          </button>
        </div>
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
          <div className={`pricing-card ${currentPlan === 'free' ? 'highlight' : ''}`}>
            <h3>{t.free}</h3>
            <div className="price">0 CHF<span>{t.month}</span></div>
            <ul className="features-list">
              <li><Check size={16} className="text-primary" /> 1 {t.digitalCard}</li>
              <li><Check size={16} className="text-primary" /> {t.unlimitedShare}</li>
              <li><Check size={16} className="text-primary" /> {t.universalQR}</li>
            </ul>
            <button
              disabled={currentPlan === 'free'}
              className={`btn-full ${currentPlan === 'free' ? 'btn-secondary' : 'btn-secondary'}`}
              style={{ opacity: currentPlan === 'free' ? 0.5 : 1 }}
            >
              {currentPlan === 'free' ? t.currentPlan : t.select}
            </button>
          </div>

          {/* Basic Plan */}
          <div className={`pricing-card ${currentPlan === 'basic' ? 'highlight' : ''}`}>
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
              className={`btn-full ${currentPlan === 'basic' ? 'btn-secondary' : 'btn-primary'}`}
              style={{ opacity: currentPlan === 'basic' ? 0.5 : 1 }}
            >
              {currentPlan === 'basic' ? t.currentPlan : t.chooseThis}
            </button>
          </div>

          {/* Pro Plan */}
          <div className={`pricing-card ${currentPlan === 'pro' ? 'highlight' : ''}`}>
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
              className={`btn-full ${currentPlan === 'pro' ? 'btn-secondary' : 'btn-secondary'}`}
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

  const [user, setUser] = useState(null); // Firebase Auth user

  const t = TRANSLATIONS[lang];
  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        signInAnonymously(auth).catch(console.error);
        return;
      }
      setUser(u);
      if (u) {
        // Load subscription from Firestore
        try {
          // Logic for reading subscription if needed
        } catch (e) {
          console.error(e);
        }
      } else {
        setCards([]);
        setSubscription('free');
      }
    });
    return () => unsubscribe();
  }, []);

  // Separate effect for data loading when user changes
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      // Load Cards
      const colRef = collection(db, 'users', user.uid, 'cards');
      const snapshot = await getDocs(colRef);
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCards(loaded);

      // Load Subscription (Simulated/Workaround since getDoc missing)
      // We will assume 'free' unless we find a specific document.
      // For now, let's keep the localStorage fallback as a partial cache if db fails
      // BUT we really want DB.
    };
    loadData();
  }, [user]);



  // Keep subscription in localStorage (still simple) -> REMOVED in favor of Firestore
  // useEffect(() => {
  //   localStorage.setItem('subscription', subscription);
  // }, [subscription]);

  const limit = SUBSCRIPTION_LIMITS[subscription];
  const canAddCard = cards.length < limit;

  const handleSaveCard = async (cardData) => {
    if (!user?.uid) {
      alert('Please log in to save cards.');
      return;
    }
    // Remove the temporary 'id' if it's a new card
    // eslint-disable-next-line no-unused-vars
    const { id, ...dataToSave } = cardData;

    if (editingCard) {
      // Update existing document for this user
      const docRef = doc(db, 'users', user.uid, 'cards', editingCard.id);
      await setDoc(docRef, dataToSave);
      setCards(cards.map(c => c.id === editingCard.id ? { ...cardData, id: editingCard.id } : c));
    } else {
      // Add new document for this user
      const docRef = await addDoc(collection(db, 'users', user.uid, 'cards'), dataToSave);
      setCards([...cards, { ...cardData, id: docRef.id }]);
    }
    setView('dashboard');
    setEditingCard(null);
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
                        className={`share-btn ${sharedCardId === card.id ? 'active' : ''}`}
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
