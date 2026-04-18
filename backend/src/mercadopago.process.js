
function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    const err = new Error(`${name} is not configured`);
    err.statusCode = 500;
    throw err;
  }
  return v;
}

async function processPayment({ formData, uid }) {
  if (!formData) {
    const err = new Error("formData is required");
    err.statusCode = 400;
    throw err;
  }
  if (!uid) {
    const err = new Error("uid is required");
    err.statusCode = 400;
    throw err;
  }

  const accessToken = requireEnv("MERCADOPAGO_ACCESS_TOKEN");
  const publicBaseUrl = requireEnv("PUBLIC_BASE_URL");
  const backendBaseUrl = requireEnv("BACKEND_BASE_URL");

  const payload = {
    ...formData,
    external_reference: String(uid),
    notification_url: `${backendBaseUrl}/webhook/mercadopago`,
    callback_url: `${publicBaseUrl}/payment/success`,
  };

  const resp = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `${uid}-${Date.now()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    const err = new Error(`Mercado Pago API error (${resp.status}) while processing payment`);
    err.statusCode = 502;
    err.details = text;
    throw err;
  }

  return resp.json();
}

async function handleProcessPayment(req, res) {
  const { formData, uid } = req.body ?? {};

  try {
    const payment = await processPayment({ formData, uid });

    // eslint-disable-next-line no-console
    console.log("[mercadopago:process] payment", {
      id: payment?.id,
      status: payment?.status,
      uid,
    });

    return res.status(200).json(payment);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[mercadopago:process] error", err);
    return res
      .status(err?.statusCode || 500)
      .json({ error: err.message || "Payment processing failed" });
  }
}

module.exports = { handleProcessPayment };
