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
  Languages
} from 'lucide-react';

// --- Utils ---
const generateVCard = (card) => {
  const nameParts = card.name ? card.name.trim().split(/\s+/) : [];
  const lastName = nameParts.length > 1 ? nameParts.pop() : '';
  const firstName = nameParts.join(' ') || (card.name || '');

  return `BEGIN:VCARD
VERSION:3.0
N:${lastName};${firstName};;;
FN:${firstName} ${lastName}
ORG:${card.company};
TITLE:${card.title}
TEL;TYPE=CELL,VOICE:${card.phone}
EMAIL;TYPE=WORK,INTERNET:${card.email}
URL:${card.website}
END:VCARD`;
};

const SUBSCRIPTION_LIMITS = {
  free: 1,
  basic: 3,
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
    yourCompany: 'Votre Entreprise',
    placeholderName: 'Jean Dupont',
    placeholderTitle: 'Directeur Marketing',
    placeholderCompany: 'Ma Société SA'
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
    yourCompany: 'Your Company',
    placeholderName: 'John Doe',
    placeholderTitle: 'Marketing Director',
    placeholderCompany: 'My Company Inc'
  }
};

const PRICING = {
  basic: { price: '4 CHF', limit: 3, key: 'standardPack' },
  pro: { price: '7 CHF', limit: 5, key: 'premiumPack' }
};

// --- Components ---

const CardPreview = ({ card, showQR = false, onClick, t }) => {
  const vCardData = generateVCard(card);

  return (
    <div
      onClick={onClick}
      className={`card-preview ${card.theme || 'card-bg-1'}`}
      style={{ cursor: 'pointer' }}
    >
      <div className="card-content">
        <div className="card-info">
          <h3>{card.name || t.yourName}</h3>
          <p>{card.title || t.yourTitle}</p>
          <p className="card-details">{card.company || t.yourCompany}</p>
        </div>

        <div className="card-details">
          {card.phone && (
            <div className="detail-row">
              <Phone size={14} /> <span>{card.phone}</span>
            </div>
          )}
          {card.email && (
            <div className="detail-row">
              <Mail size={14} /> <span>{card.email}</span>
            </div>
          )}
        </div>
      </div>

      {showQR && (
        <div className="qr-overlay">
          <div className="qr-box animate-fade-in">
            <QRCodeSVG
              value={vCardData}
              size={128}
              level="M"
              fgColor="#0284c7"
              includeMargin={true}
            />
            <div className="qr-text">{t.scanToAdd}</div>
          </div>
        </div>
      )}

      {/* Decorative circles */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-black opacity-10 rounded-full blur-xl"></div>
    </div>
  );
};

const Editor = ({ card, onSave, onCancel, t }) => {
  const [formData, setFormData] = useState(card || {
    id: Date.now(),
    name: '',
    title: '',
    company: '',
    phone: '',
    email: '',
    website: '',
    theme: 'card-bg-1'
  });

  const themes = ['card-bg-1', 'card-bg-2', 'card-bg-3', 'card-bg-4', 'card-bg-5'];

  return (
    <div className="glass-panel editor-container animate-fade-in">
      <h2 className="editor-title">
        <Edit2 size={24} className="text-primary" />
        {card ? t.editCard : t.createNewCard}
      </h2>

      <div className="form-grid">
        <div className="form-column">
          <div className="form-group">
            <label>{t.fullName}</label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                className="input-field"
                placeholder={t.placeholderName}
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t.title}</label>
            <div className="input-wrapper">
              <Briefcase size={18} className="input-icon" />
              <input
                className="input-field"
                placeholder={t.placeholderTitle}
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t.company}</label>
            <div className="input-wrapper">
              <CreditCard size={18} className="input-icon" />
              <input
                className="input-field"
                placeholder={t.placeholderCompany}
                value={formData.company}
                onChange={e => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="form-column">
          <div className="form-group">
            <label>{t.phone}</label>
            <div className="input-wrapper">
              <Phone size={18} className="input-icon" />
              <input
                className="input-field"
                placeholder="+41 79 123 45 67"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t.email}</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                className="input-field"
                placeholder="jean@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t.website}</label>
            <div className="input-wrapper">
              <Globe size={18} className="input-icon" />
              <input
                className="input-field"
                placeholder="www.monsite.ch"
                value={formData.website}
                onChange={e => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>{t.cardStyle}</label>
        <div className="theme-selector">
          {themes.map(theme => (
            <button
              key={theme}
              onClick={() => setFormData({ ...formData, theme })}
              className={`theme-btn ${theme} ${formData.theme === theme ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="editor-actions">
        <button onClick={onCancel} className="btn-secondary">{t.cancel}</button>
        <button onClick={() => onSave(formData)} className="btn-primary">{t.save}</button>
      </div>
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
  const [cards, setCards] = useState(() => {
    const saved = localStorage.getItem('cards');
    return saved ? JSON.parse(saved) : [];
  });

  const [subscription, setSubscription] = useState(() => {
    return localStorage.getItem('subscription') || 'free';
  });

  const [lang, setLang] = useState('fr');

  const [view, setView] = useState('dashboard'); // dashboard, editor
  const [editingCard, setEditingCard] = useState(null);
  const [showPricing, setShowPricing] = useState(false);
  const [sharedCardId, setSharedCardId] = useState(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    localStorage.setItem('cards', JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem('subscription', subscription);
  }, [subscription]);

  const limit = SUBSCRIPTION_LIMITS[subscription];
  const canAddCard = cards.length < limit;

  const handleSaveCard = (cardData) => {
    if (editingCard) {
      setCards(cards.map(c => c.id === cardData.id ? cardData : c));
    } else {
      setCards([...cards, cardData]);
    }
    setView('dashboard');
    setEditingCard(null);
  };

  const handleDelete = (id) => {
    if (confirm(t.confirmDelete)) {
      setCards(cards.filter(c => c.id !== id));
    }
  };

  const handleUpgrade = (plan) => {
    setSubscription(plan);
    setShowPricing(false);
    alert(`${t.upgraded} ${plan === 'basic' ? t.standard : t.premium} plan.`);
  };

  const toggleLang = () => {
    setLang(l => l === 'fr' ? 'en' : 'fr');
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
          >
            <Languages size={20} />
            <span>{lang}</span>
          </button>

          <div className="plan-info">
            {t.plan}: <span className="plan-badge">{subscription}</span> ({cards.length}/{limit})
          </div>
          <button
            onClick={() => setShowPricing(true)}
            className="btn-secondary"
          >
            {t.manageSub}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {view === 'dashboard' && (
          <>
            <div className="dashboard-header">
              <div className="section-title">
                <h2>{t.yourCards}</h2>
                <p>{t.manageCards}</p>
              </div>

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
            </div>

            {cards.length === 0 ? (
              <div className="glass-panel empty-state">
                <div className="empty-icon">
                  <CreditCard size={40} className="text-gray-500" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{t.noCards}</h3>
                <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>{t.startCreating}</p>
                <button
                  onClick={() => {
                    setEditingCard(null);
                    setView('editor');
                  }}
                  className="btn-primary"
                >
                  {t.createFirst}
                </button>
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
        )}

        {view === 'editor' && (
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
