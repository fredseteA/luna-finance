function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    const err = new Error(`${name} is not configured`);
    err.statusCode = 500;
    throw err;
  }
  return v;
}

async function createPreference({ uid }) {
  if (!uid) {
    const err = new Error("uid is required");
    err.statusCode = 400;
    throw err;
  }

  const accessToken = requireEnv("MERCADOPAGO_ACCESS_TOKEN");
  const publicBaseUrl = requireEnv("PUBLIC_BASE_URL");
  const backendBaseUrl = requireEnv("BACKEND_BASE_URL");

  const payload = {
    items: [
      {
        title: "Luna Finance — Acesso vitalício",
        quantity: 1,
        currency_id: "BRL",
        unit_price: 19.99,
      },
    ],
    external_reference: String(uid),
    notification_url: `${backendBaseUrl}/webhook/mercadopago`,
    back_urls: {
      success: `${publicBaseUrl}/payment/success`,
      pending: `${publicBaseUrl}/payment/success`, 
      failure: `${publicBaseUrl}/paywall`,
    },
    auto_return: "approved",
  };

  const resp = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    const err = new Error(`Mercado Pago API error (${resp.status}) while creating preference`);
    err.statusCode = 502;
    err.details = text;
    throw err;
  }

  return resp.json();
}

module.exports = { createPreference };