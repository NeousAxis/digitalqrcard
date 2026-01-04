import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

export default async function handler(req, res) {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const event = req.body;

        console.log('Stripe webhook received:', event.type);

        // Handle checkout.session.completed event
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;

            // Extract details
            const userId = session.client_reference_id; // Added by frontend
            const customerEmail = session.customer_email || session.customer_details?.email;
            const plan = session.metadata?.plan; // 'basic' or 'pro'

            console.log('Processing checkout:', { userId, email: customerEmail, plan });

            if (!plan) {
                console.error('Missing plan in session metadata');
                return res.status(400).json({ error: 'Missing plan metadata' });
            }

            let userDoc = null;

            // 1. Try to find user by ID (Most reliable)
            if (userId) {
                const docSnap = await db.collection('users').doc(userId).get();
                if (docSnap.exists) {
                    userDoc = docSnap;
                    console.log('User found by ID:', userId);
                }
            }

            // 2. Fallback: Find user by email
            if (!userDoc && customerEmail) {
                const usersRef = db.collection('users');
                const snapshot = await usersRef.where('email', '==', customerEmail).get();
                if (!snapshot.empty) {
                    userDoc = snapshot.docs[0];
                    console.log('User found by email:', customerEmail);
                }
            }

            if (!userDoc) {
                console.error('No user found for checkout.');
                return res.status(404).json({ error: 'User not found' });
            }

            // Update subscription for the user
            await userDoc.ref.update({
                subscription: plan,
                updatedAt: new Date().toISOString(),
                stripeCustomerId: session.customer,
                stripeSessionId: session.id,
            });

            console.log('Subscription updated successfully for user:', userDoc.id);

            return res.status(200).json({ success: true });
        }

        // For other event types, just acknowledge
        return res.status(200).json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).json({ error: 'Webhook handler failed' });
    }
}
