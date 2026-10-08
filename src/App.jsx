
import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Phone, X, Check, Lock, Wallet
} from 'lucide-react';
// Backend API client (Cloudflare Worker + Better Auth + D1)
import {
  signOut, getCurrentUser, deleteAccount,
  listCards, createCard, updateCard, deleteCard,
  getProfile, updateProfile,
} from './apiClient';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import {
  AirHome, AirEditor, AirSettings, AirTabBar, ShareSheet, LinksSheet, AuthSheet, AirToast, AIR_ROTATION, S,
} from './AirUI';

// Apple Wallet pass endpoint (Vercel serverless)
const WALLET_PASS_ENDPOINT = 'https://www.digitalqrcard.xyz/api/wallet-pass';

// Downscale the card photo to a small JPEG for the Wallet pass thumbnail. It
// travels in the pass URL (the endpoint converts it to PNG), so cap the base64
// well under Vercel's ~24KB URL limit. Returns bare base64 (no data: prefix).
const makePassThumb = (dataUrl) => new Promise((resolve) => {
  if (!dataUrl) { resolve(''); return; }
  const img = new Image();
  img.onload = () => {
    const BUDGET = 18000; // base64 chars
    const render = (dim, q) => {
      let w = img.width, h = img.height;
      if (w > h) { if (w > dim) { h *= dim / w; w = dim; } }
      else { if (h > dim) { w *= dim / h; h = dim; } }
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      return c.toDataURL('image/jpeg', q);
    };
    const steps = [[200, 0.7], [180, 0.65], [160, 0.6], [140, 0.55], [120, 0.5]];
    let out = '';
    for (const [dim, q] of steps) { out = render(dim, q); if (out.length <= BUDGET) break; }
    resolve((out.split(',')[1]) || '');
  };
  img.onerror = () => resolve('');
  img.src = dataUrl;
});

// Local design check only: `VITE_MOCK=1 npm run build` shows the three cards of the
// Air mock-up without any network call. Never set for App Store or Vercel builds.
const MOCK = import.meta.env.VITE_MOCK === '1';
const MOCK_FR = typeof navigator !== 'undefined' && /^fr/i.test(navigator.language || '');
const MOCK_CARDS = [
  { id: 'm1', name: 'Marie Dupont', theme: 'air-navy', image: '', fields: [
    { type: 'title', value: MOCK_FR ? 'Directrice marketing' : 'Marketing Director' }, { type: 'company', value: 'BrightLabs' },
    { type: 'phone', value: '+33612345678' }, { type: 'email', value: 'marie.dupont@brightlabs.fr' },
    { type: 'website', value: 'brightlabs.fr' }, { type: 'location', value: 'Paris' },
    { type: 'linkedin', value: 'marie-dupont' }, { type: 'instagram', value: '@marie.dpt' },
    { type: 'whatsapp', value: '+33612345678' }, { type: 'telegram', value: '@mariedupont' },
    { type: 'snapchat', value: 'marie.dpt' }, { type: 'tiktok', value: '@brightmarie' }] },
  { id: 'm2', name: 'Jean Martin', theme: 'air-white', image: '', fields: [
    { type: 'title', value: MOCK_FR ? 'Ingénieur logiciel' : 'Software Engineer' }, { type: 'company', value: 'Northbound Studio' },
    { type: 'phone', value: '+41795550122' }, { type: 'email', value: 'jean@northbound.studio' },
    { type: 'website', value: 'northbound.studio' }, { type: 'github', value: 'jmartin' }] },
  { id: 'm3', name: 'Sophie Laurent', theme: 'air-sky', image: '', fields: [
    { type: 'title', value: MOCK_FR ? 'Architecte' : 'Architect' }, { type: 'company', value: 'Atelier Laurent' },
    { type: 'phone', value: '+32470123456' }, { type: 'email', value: 'sophie@atelier-laurent.be' },
    { type: 'website', value: 'atelier-laurent.be' }] },
];

const SUBSCRIPTION_LIMITS = {
  free: 1,
  basic: 3,
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
  basic: { price: '2 CHF', limit: 3, key: 'standardPack', productId: 'Standard_898' },
  pro: { price: '4 CHF', limit: 5, key: 'premiumPack', productId: 'Premium_898' }
};

// FEATURE FLAG — set to true to re-enable in-app purchases (V2).
// v1.0 ships without paid offers: no IAP UI, no StoreKit init, all features unlocked.
const IAP_ENABLED = false;

// Intermediate Modal to explain why login is needed
const PlanAuthModal = ({ onClose, onLogin }) => {
  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={onClose}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '450px', width: '90%', padding: '2.5rem', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(236, 107, 62, 0.1)', padding: '1rem', borderRadius: '50%' }}>
            <Lock size={48} className="text-primary" />
          </div>
        </div>
        <h2 className="section-title" style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Account Required</h2>
        <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: '1.6', fontSize: '1.1rem' }}>
          To confirm your subscription and manage your professional digital cards, you need to be logged in to your account.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            onClick={onLogin}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1.1rem' }}
          >
            Log in / Sign up
          </button>
          <button
            onClick={onClose}
            style={{ padding: '0.8rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const PricingModal = ({ currentPlan, onUpgrade, onClose, t, user, onOpenAuth, onNativePurchase }) => {
  const [showAuthRequired, setShowAuthRequired] = useState(false);

  const handlePlanSelection = async (planKey, stripeLink) => {
    if (Capacitor.isNativePlatform()) {
      // Native IAP — no login required (Apple Guideline 5.1.1v)
      onNativePurchase(planKey);
    } else {
      // Web Stripe — login needed for account-based billing
      if (!user) {
        setShowAuthRequired(true);
        return;
      }
      localStorage.setItem('pendingPlan', planKey);
      window.location.href = stripeLink;
    }
  };

  if (showAuthRequired) {
    return (
      <PlanAuthModal
        onClose={() => setShowAuthRequired(false)}
        onLogin={() => {
          setShowAuthRequired(false);
          onClose(); // Close pricing modal
          onOpenAuth(); // Open main auth modal
        }}
      />
    );
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="glass-panel pricing-modal animate-fade-in">
        <div className="pricing-header">
          <div>
            <h2 className="section-title" style={{ fontSize: '2rem', margin: 0 }}>{t.choosePlan}</h2>
            <p style={{ color: '#94a3b8' }}>{t.moreCards}</p>
          </div>
          <button type="button" onClick={onClose} className="icon-btn"><X size={24} /></button>
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
              type="button"
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

              <li><strong>✅ Add Photo / Logo</strong></li>
              <li>✅ Company & Location</li>
              <li>✅ Social Networks (FB, Insta, Linked...)</li>
            </ul>
            <button
              type="button"
              onClick={() => handlePlanSelection('basic', 'https://buy.stripe.com/test_5kQ5kx2b91Sx1Vicha73G01')}
              disabled={currentPlan === 'basic'}
              className={`btn-full ${currentPlan === 'basic' ? 'btn-secondary' : 'btn-primary'}`}
            >
              {currentPlan === 'basic' ? t.currentPlan : (currentPlan === 'free' ? t.chooseThis : 'Switch to Standard')}
            </button>
          </div>

          {/* Pro Plan */}
          <div className={`pricing-card ${currentPlan === 'pro' ? 'highlight' : ''}`}>
            <h3>{t[PRICING.pro.key]}</h3>
            <div className="price">{PRICING.pro.price}<span>{t.month}</span></div>
            <ul className="features-list">
              <li><strong>{PRICING.pro.limit}</strong> Digital Cards</li>

              <li><strong>✅ Add Photo / Logo</strong></li>
              <li>✅ Company & Location</li>
              <li>✅ All Social Networks</li>
              <li><strong>✅ Unlimited Custom Fields</strong></li>
            </ul>
            <button
              type="button"
              onClick={() => handlePlanSelection('pro', 'https://buy.stripe.com/test_cNicMZ7vt8gVgQc4OI73G00')}
              disabled={currentPlan === 'pro'}
              className={`btn-full ${currentPlan === 'pro' ? 'btn-secondary' : 'btn-primary'}`}
              style={currentPlan !== 'pro' ? { boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)' } : {}}
            >
              {currentPlan === 'pro' ? t.currentPlan : (currentPlan === 'free' ? t.chooseThis : 'Switch to Pro')}
            </button>
          </div>
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

  // Subscription always starts as 'free' and is loaded from Firestore
  const [subscription, setSubscription] = useState('free');
  const [subscriptionDate, setSubscriptionDate] = useState(null);
  const [storeReady, setStoreReady] = useState(false);
  const storeReadyRef = useRef(false);

  // When IAP is disabled, every user gets full access (v1.0 ships with no paywall).
  const effectivePlan = IAP_ENABLED ? subscription : 'pro';

  const [activeCardIndex, setActiveCardIndex] = useState(0); // Lifted state for Carousel
  const [view, setView] = useState('dashboard'); // dashboard, editor
  const [editingCard, setEditingCard] = useState(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false); // New State for Auth Modal
  const [shareCard, setShareCard] = useState(null);
  const [linksCard, setLinksCard] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const [user, setUser] = useState(null); // Firebase Auth user



  const t = TRANSLATIONS['en'];




  // Check auth state on mount (token-based session, not realtime listeners)
  useEffect(() => {
    const checkAuth = async () => {
      if (MOCK) { setUser({ id: 'mock', email: 'marie.dupont@brightlabs.fr' }); return; }
      const resetLoggedOut = () => {
        setUser(null);
        setCards([]);
        setSubscription('free');
        setSubscriptionDate(null);
        localStorage.removeItem('subscription');
      };
      try {
        const u = await getCurrentUser();
        if (u) setUser(u);
        else resetLoggedOut();
      } catch {
        resetLoggedOut();
      }
    };
    checkAuth();
  }, []);

  // --- IAP LOGIC ---
  // --- IAP LOGIC ---
  useEffect(() => {
    if (!IAP_ENABLED) return;
    if (!Capacitor.isNativePlatform()) return;

    const initStore = () => {
      if (!window.CdvPurchase?.store) {
        console.error('Store plugin not available');
        return;
      }
      const store = window.CdvPurchase.store;

      // Check if already registered to avoid duplicates (though register is idempotent usually)
      if (store.get('Standard_898')) {
        console.log("Store products already registered");
        // Ensure refresh
        store.update();
        return;
      }

      console.log("Registering Store Products...");

      // Register Products — use exact product IDs from App Store Connect
      const APPLE = window.CdvPurchase.Platform.APPLE_APPSTORE;
      const SUB = window.CdvPurchase.ProductType.PAID_SUBSCRIPTION;
      store.register([
        { id: 'Standard_898', type: SUB, platform: APPLE },
        { id: 'Premium_898', type: SUB, platform: APPLE },
      ]);

      // Purchase flow: approved → verify → verified → finish (v13 required flow)
      store.when()
        .approved(transaction => {
          console.log('[IAP] Transaction approved, verifying receipt...');
          transaction.verify();
        })
        .verified(receipt => {
          const transaction = receipt.sourceReceipt?.transactions?.[0];
          const productId = transaction?.products?.[0]?.id || '';
          let newPlan = 'free';
          if (productId.includes('Standard_898')) newPlan = 'basic';
          if (productId.includes('Premium_898')) newPlan = 'pro';

          console.log(`[IAP] Verified: ${productId} -> ${newPlan}`);

          // Try to save to the backend if user is logged in
          const saveToCloud = async () => {
            try {
              const currentUser = await getCurrentUser();
              if (!currentUser) throw new Error('not logged in');
              await updateProfile({
                subscription: newPlan,
                updated_at: new Date().toISOString(),
                iap_transaction_id: transaction?.transactionId || ''
              });
              receipt.finish();
              setSubscription(newPlan);
              setStatusMessage({ type: 'success', text: `Abonnement ${newPlan.toUpperCase()} activé !` });
            } catch {
              // User not logged in or save failed — save locally and activate immediately
              localStorage.setItem('pending_subscription', newPlan);
              receipt.finish();
              setSubscription(newPlan);
              setStatusMessage({ type: 'success', text: `Abonnement ${newPlan.toUpperCase()} activé ! Connectez-vous pour synchroniser sur vos appareils.` });
            }
          };
          saveToCloud();
        })
        .unverified(receipt => {
          console.error('[IAP] Receipt unverified:', receipt);
        });

      store.error((err) => {
        console.error('[IAP] Store error:', err.code, err.message);
      });

      store.initialize([{
        platform: window.CdvPurchase.Platform.APPLE_APPSTORE,
        options: { needAppReceipt: true },
      }]);

      store.ready(() => {
        console.log("Store Ready");
        store.update(); // Refresh prices/validity on ready
        storeReadyRef.current = true;
        setStoreReady(true);
      });
    };

    document.addEventListener('deviceready', initStore);
    if (window.CdvPurchase) initStore();

    return () => document.removeEventListener('deviceready', initStore);
  }, []); // Run ONCE on mount, independent of user state

  // Native Purchase Trigger
  const handleNativePurchase = async (planKey) => {
    if (!IAP_ENABLED) return;
    if (!Capacitor.isNativePlatform()) return;

    if (!window.CdvPurchase?.store) {
      setStatusMessage({ type: 'error', text: "Le service d'achat n'est pas initialisé. Veuillez redémarrer l'app." });
      return;
    }

    const store = window.CdvPurchase.store;
    const productId = PRICING[planKey].productId;

    setStatusMessage({ type: 'info', text: 'Connecting to App Store...' });

    // Wait up to 8s for store to be ready if not yet
    if (!storeReadyRef.current) {
      let waited = 0;
      while (!storeReadyRef.current && waited < 8000) {
        await new Promise(r => setTimeout(r, 500));
        waited += 500;
      }
    }

    // Ensure store is refreshed
    try { await store.update(); } catch(e) { console.warn('store.update:', e); }

    const product = store.get(productId);

    if (!product) {
      console.error(`IAP: Product ${productId} not found in store`);
      setStatusMessage({ type: 'error', text: 'Product not available. Please restart the app and try again.' });
      return;
    }

    if (!product.canPurchase) {
      // Try one more update before giving up
      try { await store.update(); } catch(e) { /* ignore */ }
      await new Promise(r => setTimeout(r, 1500));
      if (!product.canPurchase) {
        setStatusMessage({ type: 'error', text: 'Product temporarily unavailable. Please try again in a moment.' });
        return;
      }
    }

    setStatusMessage({ type: 'info', text: 'Starting purchase...' });
    try {
      const offer = product.getOffer();
      if (offer) {
        await offer.order();
      } else {
        setStatusMessage({ type: 'error', text: 'No offer available for this product.' });
      }
    } catch (e) {
      console.error('IAP order error:', e);
      setStatusMessage({ type: 'error', text: 'Purchase failed: ' + (e.message || 'Unknown error') });
    }
  };

  // Fetch Subscription Status from the backend when User Logs In
  useEffect(() => {
    if (!user) return;

    const fetchSubscription = async () => {
      try {
        const profile = await getProfile();
        const newSubscription = profile.subscription || 'free';
        const newDate = profile.updated_at || null;

        setSubscription(newSubscription);
        setSubscriptionDate(newDate);
        localStorage.setItem('subscription', newSubscription);

        // Handle Pending Plan (from IAP purchased while not logged in)
        const pendingPlan = localStorage.getItem('pendingPlan') || localStorage.getItem('pending_subscription');
        if (IAP_ENABLED && pendingPlan && ['basic', 'pro'].includes(pendingPlan)) {
          if (newSubscription !== pendingPlan) {
            await updateProfile({
              subscription: pendingPlan,
              updated_at: new Date().toISOString()
            });
            setSubscription(pendingPlan);
            localStorage.setItem('subscription', pendingPlan);
            setStatusMessage({ type: 'success', text: `Plan updated to ${pendingPlan.toUpperCase()}` });
            setTimeout(() => setStatusMessage(null), 5000);
          }
          localStorage.removeItem('pendingPlan');
          localStorage.removeItem('pending_subscription');
        }
      } catch (err) {
        console.error("Error fetching subscription:", err);
      }
    };

    fetchSubscription();
  }, [user]);

  // Check for updates when tab becomes visible (returning from Stripe)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        console.log("App visible, refreshing subscription status...");
        try {
          const profile = await getProfile();
          const freshSubscription = profile.subscription || 'free';

          if (freshSubscription !== subscription) {
            setSubscription(freshSubscription);
            localStorage.setItem('subscription', freshSubscription);
            setStatusMessage({
              type: 'success',
              text: `Plan updated to ${freshSubscription.toUpperCase()}`
            });
            setTimeout(() => setStatusMessage(null), 5000);
          }
          if (localStorage.getItem('pendingPlan')) localStorage.removeItem('pendingPlan');
        } catch (e) { console.error("Refresh error:", e); }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user, subscription]);



  // Detect Stripe return with plan parameter and update subscription
  useEffect(() => {
    const updateSubscriptionFromURL = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const planFromURL = urlParams.get('plan');

      if (planFromURL && ['basic', 'pro'].includes(planFromURL)) {
        if (!user) {
          console.log('Waiting for user authentication...');
          return;
        }

        try {
          await updateProfile({
            subscription: planFromURL,
            updated_at: new Date().toISOString()
          });

          setSubscription(planFromURL);
          localStorage.setItem('subscription', planFromURL);
          window.history.replaceState({}, document.title, window.location.pathname);

          setStatusMessage({
            type: 'success',
            text: `Subscription upgraded to ${planFromURL === 'basic' ? 'Standard' : 'Premium'} Pack!`
          });
          setTimeout(() => setStatusMessage(null), 5000);
        } catch (error) {
          console.error("Error updating subscription from URL:", error);
          setStatusMessage({
            type: 'error',
            text: 'Error updating subscription. Please contact support.'
          });
        }
      }
    };

    updateSubscriptionFromURL();
  }, [user]);

  const handleLogin = async () => {
    // Google Sign-In is not available; users authenticate via Email/Password.
    setStatusMessage({ type: 'error', text: 'Veuillez utiliser Email/Mot de passe.' });
  };

  const performDelete = async () => {
    try {
      // Server-side cascade: deletes the user's cards, profile, sessions and account.
      await deleteAccount();
      setUser(null);
      setCards([]);
      setSubscription('free');
      setSubscriptionDate(null);
      localStorage.removeItem('subscription');
      setStatusMessage({ type: 'success', text: 'Compte supprimé avec succès.' });
    } catch (error) {
      console.error('Delete account error:', error);
      setStatusMessage({ type: 'error', text: 'Erreur lors de la suppression. Reconnectez-vous et réessayez.' });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error('Logout error:', e);
    }
    setUser(null);
    setCards([]);
    setSubscription('free');
    setSubscriptionDate(null);
    localStorage.removeItem('subscription');
  };

  // Fetch cards from the backend when user logs in
  useEffect(() => {
    if (!user?.id) {
      setCards([]);
      return;
    }

    const fetchCards = async () => {
      if (MOCK) { setCards(MOCK_CARDS); return; }
      try {
        const docs = await listCards();
        const loaded = docs.map(doc => {
          let parsedFields = [];
          try { parsedFields = doc.fields ? JSON.parse(doc.fields) : []; } catch { parsedFields = []; }
          const photo = parsedFields.find(f => f && f.type === '__photo');
          return {
            id: doc.id,
            name: doc.name || '',
            image: photo ? photo.value : '',
            title: doc.title || '',
            company: doc.company || '',
            phone: doc.phone || '',
            email: doc.email || '',
            website: doc.website || '',
            address: doc.address || '',
            location: doc.location || '',
            theme: doc.theme || 'pantone-classic-blue',
            fields: parsedFields.filter(f => f && f.type !== '__photo'),
            avatar_emoji: doc.avatar_emoji || '',
            avatar_color: doc.avatar_color || '',
            background_color: doc.background_color || '',
            card_order: doc.cardOrder || 0,
            updatedAt: doc.updated_at || ''
          };
        });
        setCards(loaded);
      } catch (error) {
        console.error("Error fetching cards:", error);
      }
    };

    fetchCards();
  }, [user?.id]);


  const handleSaveCard = async (cardData) => {
    if (MOCK) {
      const saved = { ...cardData, id: cardData.id || `m${Date.now()}` };
      setCards(prev => (cardData.id ? prev.map(c => (c.id === cardData.id ? { ...c, ...saved } : c)) : [...prev, saved]));
      setView('dashboard'); setEditingCard(null);
      return;
    }
    setIsSaving(true);
    setStatusMessage({ type: 'info', text: S.saving });

    if (!navigator.onLine) {
      alert('Erreur: Pas de connexion internet.');
      setIsSaving(false);
      return;
    }

    let currentUser;
    try {
      currentUser = await getCurrentUser();
      if (!currentUser) throw new Error('not authenticated');
    } catch {
      alert("Erreur: Vous n'êtes pas connecté. Veuillez vous reconnecter.");
      setIsSaving(false);
      return;
    }

    try {
      // 1. Prepare Data
      // eslint-disable-next-line no-unused-vars
      const { id, ...rawData } = cardData;
      // The photo (compressed) is persisted inside the `fields` JSON as a reserved
      // __photo entry so it survives reloads (kept from the previous storage model).
      const persistFields = [...(rawData.fields || [])];
      if (rawData.image) persistFields.push({ type: '__photo', value: rawData.image });
      const cardOrder = rawData.card_order || rawData.cardOrder || 0;
      const dataToSave = {
        cardOrder,
        name: rawData.name || '',
        title: rawData.title || '',
        company: rawData.company || '',
        phone: rawData.phone || '',
        email: rawData.email || '',
        website: rawData.website || '',
        address: rawData.address || '',
        location: rawData.location || '',
        theme: rawData.theme || 'pantone-classic-blue',
        fields: JSON.stringify(persistFields),
        avatar_emoji: rawData.avatar_emoji || rawData.avatarEmoji || '',
        avatar_color: rawData.avatar_color || rawData.avatarColor || '',
        background_color: rawData.background_color || rawData.backgroundColor || '',
        updated_at: new Date().toISOString()
      };

      let savedId;

      // 2. Write to backend
      if (editingCard && !editingCard.id.startsWith('temp_')) {
        // Update existing
        savedId = editingCard.id;
        await updateCard(savedId, dataToSave);

        // Manual State Update
        const localCard = { ...rawData, ...dataToSave, card_order: cardOrder, id: savedId, fields: rawData.fields || [] };
        setCards(prev => prev.map(c => c.id === savedId ? localCard : c));
      } else {
        // Create new
        dataToSave.created_at = new Date().toISOString();
        const doc = await createCard(dataToSave);
        savedId = doc.id;

        const localCard = { ...rawData, ...dataToSave, card_order: cardOrder, id: savedId, fields: rawData.fields || [] };
        setCards(prev => [...prev, localCard]);
      }

      // 3. Success feedback
      setStatusMessage({ type: 'success', text: S.ok === 'OK' ? 'Carte enregistrée' : 'Card saved' });

      setTimeout(() => {
        setView('dashboard');
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

  const handleAddToWallet = async (card) => {
    try {
      // Card data lives in card.fields[] ({type,value}); the flat props are legacy/empty.
      const byType = {};
      (card.fields || []).forEach(f => {
        if (f && f.type && f.value && byType[f.type] === undefined) byType[f.type] = f.value;
      });
      const payload = {
        id: card.id,
        name: card.name || '',
        title: byType.title || card.title || '',
        company: byType.company || card.company || '',
        phone: byType.phone || card.phone || '',
        email: byType.email || card.email || '',
        website: byType.website || card.website || '',
        location: byType.location || card.location || card.address || '',
        num: cards.findIndex(c => c.id === card.id) + 1 || undefined,
      };
      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      const photo = await makePassThumb(card.image);
      const url = `${WALLET_PASS_ENDPOINT}?d=${encodeURIComponent(b64)}`
        + (photo ? `&p=${encodeURIComponent(photo)}` : '');
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url });
      } else {
        window.open(url, '_blank');
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: 'Apple Wallet: ' + (e.message || e) });
    }
  };

  const handleUpgrade = async (plan) => {
    if (!user?.id) return;

    try {
      await updateProfile({
        subscription: plan,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.error("Error upgrading:", e);
    }

    setSubscription(plan);
    setShowPricing(false);
    alert(`${t.upgraded} ${plan === 'basic' ? t.standard : t.premium} plan.`);
  };







  const cardLimit = effectivePlan === 'pro' ? PRICING.pro.limit : (effectivePlan === 'basic' ? PRICING.basic.limit : 1);
  const canWallet = effectivePlan !== 'free';

  const openEditor = (card) => {
    setShareCard(null);
    setLinksCard(null);
    setEditingCard(card);
    setView('editor');
  };

  // Card deletion is confirmed inside the editor (no window.confirm in WKWebView).
  const handleDeleteCard = async (id) => {
    try {
      if (!MOCK) await deleteCard(id);
      setCards(prev => prev.filter(c => c.id !== id));
      setActiveCardIndex(0);
      setEditingCard(null);
      setView('dashboard');
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Error' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  return (
    <ErrorBoundary>
      <div className="air-app">
        {view === 'editor' ? (
          <AirEditor
            key={editingCard?.id || 'new'}
            card={editingCard}
            defaultTheme={AIR_ROTATION[cards.length % AIR_ROTATION.length]}
            isSaving={isSaving}
            onSave={handleSaveCard}
            onCancel={() => { setView('dashboard'); setEditingCard(null); }}
            onDelete={handleDeleteCard}
          />
        ) : view === 'settings' ? (
          <AirSettings
            user={user}
            cardsCount={cards.length}
            limit={cardLimit}
            onSignIn={() => setShowAuthModal(true)}
            onSignOut={handleLogout}
            onDeleteAccount={performDelete}
          />
        ) : (
          <AirHome
            user={user}
            cards={cards}
            activeIndex={Math.min(activeCardIndex, Math.max(cards.length - 1, 0))}
            onIndexChange={setActiveCardIndex}
            canAdd={cards.length < cardLimit}
            canWallet={canWallet}
            onNew={() => openEditor(null)}
            onEdit={openEditor}
            onShare={setShareCard}
            onLinks={setLinksCard}
            onWallet={handleAddToWallet}
            onSignIn={() => setShowAuthModal(true)}
            logo={<img src="/logo-icon.png" alt="" style={{ width: '100%', height: '100%', display: 'block' }} />}
          />
        )}

        {view !== 'editor' && <AirTabBar view={view} onChange={setView} />}

        {shareCard && (
          <ShareSheet card={shareCard} canWallet={canWallet} onWallet={handleAddToWallet} onClose={() => setShareCard(null)} />
        )}
        {linksCard && <LinksSheet card={linksCard} onClose={() => setLinksCard(null)} />}
        {showAuthModal && !user && (
          <AuthSheet onClose={() => setShowAuthModal(false)} onLoginSuccess={(u) => setUser(u)} />
        )}

        {/* Pricing Modal (gated, kept for the V2 subscriptions) */}
        {IAP_ENABLED && showPricing && (
          <PricingModal
            currentPlan={subscription}
            onUpgrade={handleUpgrade}
            onClose={() => setShowPricing(false)}
            t={t}
            user={user}
            onOpenAuth={() => setShowAuthModal(true)}
            onNativePurchase={handleNativePurchase}
          />
        )}

        <AirToast message={statusMessage} />
      </div>
    </ErrorBoundary>
  );
}

export default App;
