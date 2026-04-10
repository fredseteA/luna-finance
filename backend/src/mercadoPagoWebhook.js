const { setUserPremium } = require("./firebaseAdmin");

function getPaymentIdFromWebhook(req) {
  // Mercado Pago webhooks often come as:
  // { type: "payment", data: { id: "123" } }
  // or query params like ?data.id=123
  const fromBody = req?.body?.data?.id ?? req?.body?.id;
  if (fromBody) return String(fromBody);

  const fromQuery =
    req?.query?.["data.id"] ??
    req?.query?.["data[id]"] ??
    req?.query?.id ??
    req?.query?.payment_id;
  if (fromQuery) return String(fromQuery);

  return null;
}

async function fetchPayment(paymentId) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    const err = new Error("MERCADOPAGO_ACCESS_TOKEN is not configured");
    err.statusCode = 500;
    throw err;
  }

  const resp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    const err = new Error(
      `Mercado Pago API error (${resp.status}) while fetching payment ${paymentId}`
    );
    err.statusCode = 502;
    err.details = text;
    throw err;
  }

  return resp.json();
}

async function handleMercadoPagoWebhook(req, res) {
  const paymentId = getPaymentIdFromWebhook(req);
  if (!paymentId) {
    return res.status(400).json({ error: "Missing payment id" });
  }

  try {
    const payment = await fetchPayment(paymentId);

    const status = payment?.status;
    const externalReference = payment?.external_reference;

    // eslint-disable-next-line no-console
    console.log("[mercadopago:webhook] payment", {
      id: paymentId,
      status,
      external_reference: externalReference,
    });

    if (status !== "approved") {
      return res.status(200).json({ received: true, premiumUpdated: false });
    }

    if (!externalReference) {
      return res.status(200).json({
        received: true,
        premiumUpdated: false,
        reason: "missing external_reference",
      });
    }

    // Convention: external_reference == Firebase Auth uid
    await setUserPremium(String(externalReference), true);

    return res.status(200).json({ received: true, premiumUpdated: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[mercadopago:webhook] error", err);
    return res
      .status(err?.statusCode || 500)
      .json({ error: "Webhook handling failed" });
  }
}

module.exports = { handleMercadoPagoWebhook };

