import "server-only";

import { EmailClient } from "@azure/communication-email";

import { productLineDisplayName } from "@/lib/product-line/product-line-display-name";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";
import type { AccessRequestPayload } from "@/lib/server/access-request-validation";
import {
  resolveAccessRequestEmailConfig,
  type AccessRequestEmailConfig,
} from "@/lib/server/access-request-config";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildAccessRequestEmailBodies(payload: AccessRequestPayload): { readonly subject: string; readonly html: string; readonly text: string } {
  const productName = productLineDisplayName(resolveProductLineIdFromEnv());
  const safeName = escapeHtml(payload.name);
  const safeEmail = escapeHtml(payload.workEmail);
  const safeCompany = escapeHtml(payload.company);
  const safeRole = escapeHtml(payload.roleTitle);
  const safeCloud = payload.cloudPlatformFocus === null ? " — " : escapeHtml(payload.cloudPlatformFocus);
  const safeNote = payload.note === null ? " — " : escapeHtml(payload.note);
  const subject = `${productName}: private beta access request`;

  const html =
    "<p>A new <strong>private beta access</strong> request was submitted from the sign-in callback screen.</p>" +
    `<p><strong>Name:</strong> ${safeName}</p>` +
    `<p><strong>Work email:</strong> ${safeEmail}</p>` +
    `<p><strong>Company:</strong> ${safeCompany}</p>` +
    `<p><strong>Role/title:</strong> ${safeRole}</p>` +
    `<p><strong>Cloud/platform focus:</strong> ${safeCloud}</p>` +
    `<p><strong>Note:</strong> ${safeNote}</p>`;

  const text =
    `${productName} private beta access request\n` +
    `Name: ${payload.name}\n` +
    `Work email: ${payload.workEmail}\n` +
    `Company: ${payload.company}\n` +
    `Role/title: ${payload.roleTitle}\n` +
    `Cloud/platform focus: ${payload.cloudPlatformFocus ?? " — "}\n` +
    `Note: ${payload.note ?? " — "}\n`;

  return { subject, html, text };
}

async function sendViaAcs(config: AccessRequestEmailConfig, payload: AccessRequestPayload): Promise<void> {
  const { subject, html, text } = buildAccessRequestEmailBodies(payload);
  const client = new EmailClient(config.acsConnectionString);
  const poller = await client.beginSend({
    senderAddress: config.senderEmail,
    content: {
      subject,
      html,
      plainText: text,
    },
    recipients: {
      to: [{ address: config.recipientEmail }],
    },
  });

  await poller.pollUntilDone();
}

export async function sendAccessRequestNotification(payload: AccessRequestPayload): Promise<void> {
  const config = resolveAccessRequestEmailConfig();

  if (config === null) {
    throw new Error("Access request email is not configured.");
  }

  if (config.dryRun) {
    const { subject, text } = buildAccessRequestEmailBodies(payload);
    console.info("[access-request-email-dry-run]", JSON.stringify({ subject, textLength: text.length }));
    return;
  }

  await sendViaAcs(config, payload);
}
