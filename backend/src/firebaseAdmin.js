const admin = require("firebase-admin");

function initFirebaseAdmin() {
  if (admin.apps.length) return admin.app();

  // Recommended: set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON file path.
  // Alternative: provide raw JSON in FIREBASE_SERVICE_ACCOUNT_JSON (stringified).
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    let creds;
    try {
      creds = JSON.parse(serviceAccountJson);
    } catch (err) {
      const e = new Error(
        "Invalid FIREBASE_SERVICE_ACCOUNT_JSON: must be valid JSON string"
      );
      e.cause = err;
      throw e;
    }

    return admin.initializeApp({
      credential: admin.credential.cert(creds),
    });
  }

  // Falls back to ADC (GOOGLE_APPLICATION_CREDENTIALS, gcloud, etc.)
  return admin.initializeApp();
}

function getAdmin() {
  initFirebaseAdmin();
  return admin;
}

async function setUserPremium(uid, isPremium = true) {
  if (!uid) throw new Error("uid is required");
  const a = getAdmin();

  const user = await a.auth().getUser(uid);
  const currentClaims = user.customClaims || {};

  const nextClaims = {
    ...currentClaims,
    isPremium: Boolean(isPremium),
  };

  await a.auth().setCustomUserClaims(uid, nextClaims);

  return { uid, claims: nextClaims };
}

module.exports = {
  getAdmin,
  setUserPremium,
};

