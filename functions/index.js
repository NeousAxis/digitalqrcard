const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

admin.initializeApp();

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
