/**
 * LHCI puppeteerScript (GTM M-99): apply Playwright storageState cookies before each URL collect.
 * Set ACCEPTANCE_STORAGE_STATE to a Playwright storageState JSON path (never commit).
 */
const fs = require("node:fs");

/**
 * @param {import('puppeteer').Browser} browser
 */
module.exports = async (browser) => {
  const storagePath = process.env.ACCEPTANCE_STORAGE_STATE?.trim();

  if (!storagePath) {
    return;
  }

  if (!fs.existsSync(storagePath)) {
    throw new Error(`ACCEPTANCE_STORAGE_STATE file not found: ${storagePath}`);
  }

  /** @type {{ cookies?: Array<Record<string, unknown>> }} */
  const state = JSON.parse(fs.readFileSync(storagePath, "utf8"));
  const cookies = Array.isArray(state.cookies) ? state.cookies : [];

  if (cookies.length === 0) {
    return;
  }

  const page = await browser.newPage();

  try {
    const puppeteerCookies = cookies.map((cookie) => {
      /** @type {Record<string, unknown>} */
      const mapped = {
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path ?? "/",
        httpOnly: Boolean(cookie.httpOnly),
        secure: Boolean(cookie.secure),
      };

      if (typeof cookie.expires === "number" && cookie.expires > 0) {
        mapped.expires = cookie.expires;
      }

      if (typeof cookie.sameSite === "string" && cookie.sameSite.length > 0) {
        mapped.sameSite = cookie.sameSite;
      }

      return mapped;
    });

    await page.setCookie(...puppeteerCookies);
  } finally {
    await page.close();
  }
};
