import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import Stripe from 'stripe';

// Initialize Firebase Admin
if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: process.env.VITE_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

const db = getFirestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'User ID required' });

        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

        const userData = userDoc.data();
        const stripeCustomerId = userData.stripeCustomerId;

        if (!stripeCustomerId) {
            return res.status(400).json({ error: 'No active Stripe subscription found.' });
        }

        // Get active subscription
        const subscriptions = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            status: 'active',
            limit: 1,
        });

        if (subscriptions.data.length === 0) {
            return res.status(400).json({ error: 'No active subscription found to cancel.' });
        }

        const sub = subscriptions.data[0];

        // Cancel at period end
        const updatedSub = await stripe.subscriptions.update(sub.id, {
            cancel_at_period_end: true,
        });

        return res.status(200).json({
            success: true,
            cancelAt: updatedSub.cancel_at
        });

    } catch (error) {
        console.error('Cancel error:', error);
        return res.status(500).json({ error: error.message });
    }
}
