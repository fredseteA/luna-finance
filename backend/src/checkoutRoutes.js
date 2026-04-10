const express = require("express");
const { createPreference } = require("./mercadoPagoCheckout");

const router = express.Router();

router.post("/mercadopago/preference", async (req, res) => {
  try {
    const uid = req.body?.uid;
    const pref = await createPreference({ uid });

    // Mercado Pago returns both sandbox_init_point and init_point.
    return res.status(200).json({
      id: pref.id,
      init_point: pref.init_point,
      sandbox_init_point: pref.sandbox_init_point,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[checkout:mercadopago] error", err);
    return res
      .status(err?.statusCode || 500)
      .json({ error: "Failed to create checkout preference" });
  }
});

module.exports = { checkoutRoutes: router };

