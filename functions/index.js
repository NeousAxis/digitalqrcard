const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

admin.initializeApp();

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

/**
 * Stripe Webhook Handler
 * Listens for Stripe checkout.session.completed events
 * and updates user subscription in Firestore
 */
exports.stripeWebhook = onRequest(async (req, res) => {
    // Only accept POST requests
    if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
    }

    try {
        const event = req.body;

        logger.info("Stripe webhook received:", { type: event.type });

        // Handle checkout.session.completed event
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;

            // Extract customer email and metadata
            const customerEmail = session.customer_email || session.customer_details?.email;
            const plan = session.metadata?.plan; // 'basic' or 'pro'

            logger.info("Processing checkout:", { email: customerEmail, plan });

            if (!customerEmail || !plan) {
                logger.error("Missing email or plan in session");
                return res.status(400).send("Missing required data");
            }

            // Find user by email in Firestore
            const usersRef = admin.firestore().collection("users");
            const snapshot = await usersRef.where("email", "==", customerEmail).get();

            if (snapshot.empty) {
                logger.error("No user found with email:", customerEmail);
                return res.status(404).send("User not found");
            }

            // Update subscription for the user
            const userDoc = snapshot.docs[0];
            await userDoc.ref.update({
                subscription: plan,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                stripeCustomerId: session.customer,
                stripeSessionId: session.id,
            });

            logger.info("Subscription updated successfully:", {
                userId: userDoc.id,
                plan,
            });

            return res.status(200).send({ success: true });
        }

        // For other event types, just acknowledge
        return res.status(200).send({ received: true });
    } catch (error) {
        logger.error("Webhook error:", error);
        return res.status(500).send("Webhook handler failed");
    }
});

/**
 * Delete User Account
 * Callable function that deletes all user data and their Firebase Auth account.
 * Required by Apple App Store guideline 5.1.1(v).
 */
exports.deleteUserAccount = onCall({ secrets: [stripeSecretKey] }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError("unauthenticated", "User must be authenticated to delete their account.");
    }

    logger.info("deleteUserAccount called for uid:", uid);
    const db = admin.firestore();

    try {
        // 1. Get user document
        const userRef = db.collection("users").doc(uid);
        const userDoc = await userRef.get();

        // 2. Cancel Stripe subscriptions if applicable
        if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData.stripeCustomerId) {
                try {
                    const stripe = require("stripe")(stripeSecretKey.value());
                    const subscriptions = await stripe.subscriptions.list({
                        customer: userData.stripeCustomerId,
                        status: "active",
                    });
                    for (const sub of subscriptions.data) {
                        await stripe.subscriptions.cancel(sub.id);
                        logger.info("Cancelled Stripe subscription:", sub.id);
                    }
                } catch (stripeError) {
                    logger.error("Stripe cancellation error (continuing deletion):", stripeError);
                }
            }
        }

        // 3. Delete all cards in subcollection users/{uid}/cards
        const cardsRef = userRef.collection("cards");
        const cardsSnapshot = await cardsRef.get();
        const batch = db.batch();
        cardsSnapshot.docs.forEach((cardDoc) => {
            batch.delete(cardDoc.ref);
        });

        // 4. Delete user document
        batch.delete(userRef);
        await batch.commit();
        logger.info("Firestore data deleted for uid:", uid);

        // 5. Delete Firebase Auth account
        await admin.auth().deleteUser(uid);
        logger.info("Firebase Auth account deleted for uid:", uid);

        return { success: true };
    } catch (error) {
        logger.error("deleteUserAccount error:", error);
        throw new HttpsError("internal", "Failed to delete account. Please try again or contact support.");
    }
});
