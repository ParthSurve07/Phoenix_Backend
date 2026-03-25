import axios from "axios";
import * as OTPAuth from "otpauth";
import logger from "../utils/logger.js";

const SMARTAPI_BASE = "https://apiconnect.angelone.in";

export const fetchAngelOneHoldings = async ({ clientId, password, totpSecret }) => {
  // Generate TOTP from user's secret
  const totpInstance = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(totpSecret),
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });
  const totp = totpInstance.generate();
  logger.info("TOTP generated successfully");

  // Step 1 — Login
  let loginRes;
  try {
    loginRes = await axios.post(
      `${SMARTAPI_BASE}/rest/auth/angelbroking/user/v1/loginByPassword`,
      { clientcode: clientId, password, totp },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-UserType": "USER",
          "X-SourceID": "WEB",
          "X-ClientLocalIP": "127.0.0.1",
          "X-ClientPublicIP": "127.0.0.1",
          "X-MACAddress": "00:00:00:00:00:00",
          "X-PrivateKey": process.env.ANGEL_ONE_API_KEY || "",
        },
      }
    );
  } catch (err) {
    logger.error({ angelOneError: err?.response?.data || err.message }, "Angel One login request failed");
    const error = new Error("Angel One login failed");
    error.status = 401;
    throw error;
  }

  const jwtToken = loginRes.data?.data?.jwtToken;
  if (!jwtToken) {
    logger.error({ angelOneResponse: loginRes.data }, "Angel One returned no jwtToken");
    const error = new Error("Angel One login failed");
    error.status = 401;
    throw error;
  }

  logger.info("Angel One login successful");

  // Step 2 — Fetch holdings
  let holdingsRes;
  try {
    holdingsRes = await axios.get(
      `${SMARTAPI_BASE}/rest/secure/angelbroking/portfolio/v1/getAllHolding`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          Accept: "application/json",
          "X-UserType": "USER",
          "X-SourceID": "WEB",
          "X-ClientLocalIP": "127.0.0.1",
          "X-ClientPublicIP": "127.0.0.1",
          "X-MACAddress": "00:00:00:00:00:00",
          "X-PrivateKey": process.env.ANGEL_ONE_API_KEY || "",
        },
      }
    );
  } catch (err) {
    logger.error({ angelOneError: err?.response?.data || err.message }, "Angel One holdings fetch failed");
    const error = new Error("Failed to fetch Angel One holdings");
    error.status = 502;
    throw error;
  }

  const holdings = holdingsRes.data?.data?.holdings || [];
  logger.info({ holdingsRaw: holdingsRes.data }, "Angel One holdings raw response");

  // Step 3 — Normalize
  return holdings
    .map((h) => {
      const quantity = parseFloat(h.quantity || 0);
      const avgPrice = parseFloat(h.averageprice || 0);
      const currentPrice = parseFloat(h.ltp || 0);
      const marketValue = quantity * currentPrice;
      const pnl = (currentPrice - avgPrice) * quantity;

      return {
        symbol: h.tradingsymbol || "",
        quantity,
        avgPrice,
        currentPrice,
        marketValue,
        pnl,
        source: "angelone",
      };
    })
    .filter((h) => h.symbol && h.quantity > 0);
};