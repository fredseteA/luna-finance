const express = require("express");
const { setUserPremium } = require("./firebaseAdmin");

const router = express.Router();

function requireAdminKey(req, res, next) {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) {
    return res
      .status(500)
      .json({ error: "ADMIN_API_KEY is not configured on server" });
  }

  const provided = req.header("x-admin-key");
  if (!provided || provided !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return next();
}

router.post("/users/:uid/premium", requireAdminKey, async (req, res) => {
  try {
    const { uid } = req.params;
    const isPremium =
      typeof req.body?.isPremium === "boolean" ? req.body.isPremium : true;

    const result = await setUserPremium(uid, isPremium);
    return res.status(200).json(result);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[admin:setUserPremium] error", err);
    return res.status(500).json({ error: "Failed to update user" });
  }
});

module.exports = { adminRoutes: router };

