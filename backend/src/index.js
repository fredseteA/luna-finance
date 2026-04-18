require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { adminRoutes } = require("./adminRoutes");
const { handleMercadoPagoWebhook } = require("./mercadoPagoWebhook");
const { checkoutRoutes } = require("./checkoutRoutes");

const app = express();
const { handleProcessPayment } = require("./mercadopago.process"); 


app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  })
);

// Capture raw body for potential signature verification (e.g., Mercado Pago webhooks)
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/admin", adminRoutes);
app.use("/checkout", checkoutRoutes);

app.post("/checkout/mercadopago/process", handleProcessPayment);

app.post("/webhook/mercadopago", (req, res) => {
  handleMercadoPagoWebhook(req, res);
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] listening on http://localhost:${port}`);
});

