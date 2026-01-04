import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import Stripe from 'stripe';

// Initialize Firebase Admin (only once)
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

        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        // Get user from Firestore
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        const stripeCustomerId = userData.stripeCustomerId;

        if (!stripeCustomerId) {
            return res.status(400).json({ error: 'No Stripe customer ID found for this user' });
        }

        // Create Stripe Portal Session
        const session = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: 'https://digitalqrcard.xyz', // Return to app after management
        });

        return res.status(200).json({ url: session.url });

    } catch (error) {
        console.error('Portal session error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
