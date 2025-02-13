require("dotenv").config();
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(cors());
app.use(express.json());

// Middleware pour vérifier les produits envoyés
app.use((req, res, next) => {
  if (!req.body.products || !Array.isArray(req.body.products)) {
    return res.status(400).json({ error: "La liste des produits est invalide." });
  }
  next();
});

// Route de paiement Stripe
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { products } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({ error: "Votre panier est vide." });
    }

    const lineItems = products.map((product) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: product.name,
          images: product.image ? [product.image] : [],
        },
        unit_amount: product.price * 100, // Stripe accepte les prix en centimes
      },
      quantity: product.quantity || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    });

    console.log("✅ Session Stripe créée :", session); // Debugging

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("❌ Erreur Stripe :", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 7500;
app.listen(PORT, () => console.log(`🚀 Serveur Stripe en cours sur http://localhost:${PORT}`));