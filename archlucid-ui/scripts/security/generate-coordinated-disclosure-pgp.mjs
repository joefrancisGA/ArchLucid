/**
 * Fallback when GnuPG is not installed: RSA-4096 OpenPGP key for coordinated disclosure
 * (UID `ArchLucid Security <security@archlucid.net>`). Preferred workflow remains
 * `docs/security/PGP_KEY_GENERATION_RECIPE.md` (GnuPG, ECC optional).
 *
 * Writes public armored key to `public/.well-known/pgp-key.txt`. Writes private key and
 * revocation certificate only under OS temp — never commit those files.
 *
 * Usage (from `archlucid-ui/`): `node scripts/security/generate-coordinated-disclosure-pgp.mjs [--force]`
 */

import * as openpgp from "openpgp";
import { randomBytes } from "crypto";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_UI_ROOT = join(__dirname, "..", "..");
const PUBLIC_PGP = join(REPO_UI_ROOT, "public", ".well-known", "pgp-key.txt");

const force = process.argv.includes("--force");


if (existsSync(PUBLIC_PGP) && !force) {
  console.error(`Refusing to overwrite ${PUBLIC_PGP}. Pass --force to replace.`);
  process.exit(1);
}

// Non-predictable passphrase binds the exported private key; custodian should re-wrap in their vault/keyring after import.
const passphrase = randomBytes(32).toString("base64url");

console.error("Generating RSA-4096 key (expect ~10–30s)...");

const generated = await openpgp.generateKey({
  type: "rsa",
  rsaBits: 4096,
  userIDs: [{ name: "ArchLucid Security", email: "security@archlucid.net" }],
  passphrase,
  format: "armored",
});

const privateKey = generated.privateKey;
const publicKey = generated.publicKey;
const revocationCertificate = generated.revocationCertificate;


if (revocationCertificate === undefined) {
  console.error("openpgp.generateKey did not return revocationCertificate; upgrade openpgp or use GnuPG recipe.");
  process.exit(1);
}

const pubKey = await openpgp.readKey({ armoredKey: publicKey });
const fpHex = pubKey.getFingerprint().toUpperCase();
const groups = fpHex.match(/.{1,4}/g);


if (groups === null) {
  console.error("Unexpected fingerprint format from OpenPGP.js.");
  process.exit(1);
}

const fpPretty = groups.join(" ");
const shortId = fpHex.slice(-16);

mkdirSync(dirname(PUBLIC_PGP), { recursive: true });
writeFileSync(PUBLIC_PGP, publicKey, "utf8");

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const base = join(tmpdir(), `archlucid-security-coordinated-disclosure-${stamp}`);

writeFileSync(`${base}-PRIVATE.asc`, privateKey, "utf8");
writeFileSync(`${base}-REVOCATION.asc`, revocationCertificate, "utf8");
writeFileSync(`${base}-PASSPHRASE.txt`, passphrase, "utf8");

console.error("");
console.error("PUBLIC key →", PUBLIC_PGP);
console.error("FULL fingerprint:", fpPretty);
console.error("SHORT Key ID (16 hex, SECURITY.md):", shortId);
console.error("PRIVATE armored + revocation + passphrase ONE-TIME files (custodian vault, then delete):");
console.error(`  ${base}-PRIVATE.asc`);
console.error(`  ${base}-REVOCATION.asc`);
console.error(`  ${base}-PASSPHRASE.txt`);
