# Implementation Plan - Update Pricing Modal UI Text

The user wants the "Upgrading" screen (Pricing Modal) to accurately reflect the new plan limitations/features derived from their instructions.

## UI Updates Required in `PricingModal` component:

### **Free Plan**
- **Cards**: 1
- **Features**:
  - Name, Title, Email, Phone only.
  - **No Photo/Logo** (Explicitly mention this limitation if needed, or just list what IS included).
  - Unlimited Sharing, Universal QR (Keep generic features).

### **Standard/Basic Plan**
- **Cards**: 3
- **Features**:
  - **Everything in Free** +
  - Company & Location
  - Social Networks (Facebook, LinkedIn, etc.)
  - **Add Photo/Logo**

### **Premium/Pro Plan**
- **Cards**: 5
- **Features**:
  - **Everything in Standard** +
  - **Custom Fields** (Unlimited flexibility)
  - All Music & Messenger Platforms

## Code Changes in `src/App.jsx`

Locate `PricingModal` (~line 830).
Update the `<ul>` features list for each card.

```jsx
// Free
<ul>
  <li>1 Digital Card</li>
  <li>Basic Info (Name, Phone, Email)</li>
  <li style={{color: '#94a3b8', textDecoration: 'line-through'}}>No Photo/Logo</li>
  <li style={{color: '#94a3b8', textDecoration: 'line-through'}}>No Social Links</li>
</ul>

// Standard
<ul>
  <li>3 Digital Cards</li>
  <li>Add Photo/Logo</li>
  <li>Company & Location</li>
  <li>Social Networks (FB, Insta +)</li>
</ul>

// Premium
<ul>
  <li>5 Digital Cards</li>
  <li>All Socials & Music Platforms</li>
  <li>Unlimited Custom Fields</li>
  <li>Priority Support</li>
</ul>
```

I'll use the translation keys if possible or hardcode for now as the user gave specific French text, but the app seems to use English keys mostly. I will try to update the Text directly for clarity or add new keys if I was editing the translations object, but editing the component directly is faster and safer given the user's urgency. Actually, looking at the code, it uses `t.unlimitedShare` etc. I should probably just replace the list items with direct text or new logic to match the request exactly.

**Wait**, the user IS French. The app has `TRANSLATIONS['en']`. There is no French translation visible in the snippets I saw (it was just `t = TRANSLATIONS['en']`).
However, the user's prompt is in French.
I will update the **English** text in `TRANSLATIONS` to match the *logic* of the request (since the app seems to be running in English mode `const t = TRANSLATIONS['en']`), OR I can just hardcode the features in the modal for now to get it right.
Given the user's frustration, I will update the `PricingModal` JSX directly to show accurate feature lists.

**Plan**:
1.  Update `PricingModal` in `src/App.jsx`.
2.  Change the `<ul>` content for Free, Basic, Pro.
