# Implementation Plan - Restructure Subscription Levels

User wants to discard the "Kawaii" idea and reshape the subscription tiers (Free, Standard, Premium).

## Tier Definitions

| Feature | Free | Standard (Basic) | Premium (Pro) |
| :--- | :--- | :--- | :--- |
| **Card Limit** | 1 | 3 | 5 |
| **Identity** | Name | Name | Name |
| **Photo/Logo** | ❌ NO | ✅ YES | ✅ YES |
| **Basic Info** | Title, Phone, Email | Title, Phone, Email | Title, Phone, Email |
| **Company** | ❌ NO | ✅ YES | ✅ YES |
| **Location** | ❌ NO | ✅ YES | ✅ YES |
| **Socials** | ❌ NO | ✅ Facebook, LinkedIn, Instagram, Zalo, Website | ✅ ALL |
| **Custom Fields** | ❌ NO | ❌ NO | ✅ YES |

## Code Changes

### 1. `src/App.jsx`

-   **Update Constants**:
    -   `SUBSCRIPTION_LIMITS`: Update Standard/Basic to 3.
    -   `FIELD_TYPES`: Add specific social media types (`facebook`, `linkedin`, `instagram`, `zalo`).
    -   `PRICING`: Update limits description. Note: Keeping keys `basic` (for Standard) and `pro` (for Premium).

-   **Update `Editor` Component**:
    -   **Props**: Accept `subscription` prop.
    -   **Image Upload**: Wrap in a condition checking `subscription !== 'free'`. Show a "Premium/Standard Feature" lock placeholder if free.
    -   **Field Selection**:
        -   Filter `FIELD_TYPES` in the dropdown based on `subscription`.
        -   Logic:
            -   `free`: ['title', 'phone', 'email']
            -   `basic`: + ['company', 'location', 'website', 'facebook', 'linkedin', 'instagram', 'zalo']
            -   `pro`: + ['custom']

-   **Update `App` Component**:
    -   Pass `subscription` state to `Editor` component.

### 2. Icons
-   Import `Facebook`, `Linkedin`, `Instagram` from `lucide-react`.
-   Use generic `MessageCircle` for Zalo (or `Globe`).

## Verification
-   Check "Free" user: Cannot see Image upload, cannot add Company/Socials.
-   Check "Standard" user: Can add Image, Company, Socials. Cannot add Custom.
-   Check "Premium" user: Can add everything.
