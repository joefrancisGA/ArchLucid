import { expect, type Locator, type Page } from "@playwright/test";

import { injectDefaultTenantOperatorScope } from "./demo-workspace-live-scope";
import { dismissBlockingModalOverlays, clickThroughBlockingOverlays } from "./dismiss-blocking-modal-overlays";
import { primePrivateBetaBrowserSessionIfJwtMode } from "./live-private-beta-access";

const LIVE_ADMIN_USERS_TAB_PATH = "/administration/users?tab=users";

async function gotoAdminUsersTabAndWaitForMe(page: Page): Promise<void> {
  const authMeSettled = page.waitForResponse(
    (response) =>
      response.url().includes("/api/proxy/api/auth/me") &&
      response.request().method() === "GET" &&
      response.ok(),
    { timeout: 90_000 },
  );

  await page.goto(LIVE_ADMIN_USERS_TAB_PATH, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await authMeSettled.catch(() => undefined);
}

/** JwtBearer admin users hub with default tenant scope and settled `/me` before assertions. */
export async function gotoLiveAdminUsersInvitePage(page: Page): Promise<void> {
  await primePrivateBetaBrowserSessionIfJwtMode(page);
  await injectDefaultTenantOperatorScope(page);

  await gotoAdminUsersTabAndWaitForMe(page);

  if ((await page.getByText(/Something went wrong/i).count()) > 0) {
    await primePrivateBetaBrowserSessionIfJwtMode(page);
    await injectDefaultTenantOperatorScope(page);
    await gotoAdminUsersTabAndWaitForMe(page);
  }

  await expect(page).toHaveURL(/\/administration\/users(?:[/?#]|$)/, { timeout: 90_000 });
  await expect(page.getByTestId("settings-roles-page")).toBeVisible({ timeout: 60_000 });
  await expect(async () => {
    await expect(page.getByTestId("settings-roles-forbidden")).toHaveCount(0, { timeout: 5_000 });
  }).toPass({ timeout: 90_000 });
  await expect(async () => {
    await expect(page.getByTestId("settings-roles-tabpanel-users")).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 90_000 });
}

async function openInviteForm(page: Page): Promise<Locator> {
  const inviteForm = page.getByTestId("settings-roles-invite-form");

  if (await inviteForm.isVisible().catch(() => false)) {
    return inviteForm;
  }

  const invitePrimaryRegion = page.getByTestId("settings-roles-invite-primary-region");
  const invitePrimaryAction = page.getByTestId("settings-roles-invite-primary-action");
  const inviteStartHereAction = page.getByTestId("settings-roles-start-here-invite");
  const inviteSection = page.getByTestId("settings-roles-invite-section");

  if (await invitePrimaryRegion.isVisible().catch(() => false)) {
    await invitePrimaryRegion.waitFor({ state: "visible", timeout: 60_000 });
  } else if (await invitePrimaryAction.isVisible().catch(() => false)) {
    await clickThroughBlockingOverlays(page, invitePrimaryAction);
  } else if (await inviteStartHereAction.isVisible().catch(() => false)) {
    await clickThroughBlockingOverlays(page, inviteStartHereAction);
  } else {
    await inviteSection.waitFor({ state: "visible", timeout: 60_000 });
    await inviteSection.locator("summary").click();
  }

  await inviteForm.waitFor({ state: "visible", timeout: 60_000 });
  return inviteForm;
}

async function selectInviteRole(page: Page, inviteForm: Locator, roleLabel: string): Promise<void> {
  const roleTrigger = inviteForm.getByTestId("settings-roles-invite-role");
  const hiddenRoleSelect = roleTrigger.locator("xpath=..//select");

  if ((await hiddenRoleSelect.count()) > 0) {
    await hiddenRoleSelect.selectOption({ label: roleLabel });
    return;
  }

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await roleTrigger.click();
    // Radix SelectContent is portaled outside the form; scope the trigger to the
    // form, but resolve its option from the page.
    const option = page.getByRole("option", { name: roleLabel, exact: true });

    if (await option.isVisible().catch(() => false)) {
      await option.click({ timeout: 15_000 });
      await page.keyboard.press("Escape").catch(() => undefined);
      await dismissBlockingModalOverlays(page);
      return;
    }

    await page.keyboard.press("Escape").catch(() => undefined);
    await dismissBlockingModalOverlays(page);
  }

  throw new Error(`Invite role option "${roleLabel}" was not visible after two selection attempts.`);
}

/** Submits the visible Users invite form and reports disabled-state diagnostics. */
export async function submitAdminInviteFromUsersUi(
  page: Page,
  email: string,
  roleLabel = "Reader",
): Promise<void> {
  const inviteForm = await openInviteForm(page);
  const emailInput = inviteForm.getByTestId("settings-roles-invite-email");

  // The settings surface can remount while its client state hydrates. Select the role
  // first, then fill the controlled email input and prove the value committed. The
  // post-role fill avoids a hydration/remount clearing email after it was entered.
  await expect(inviteForm).toBeVisible({ timeout: 15_000 });
  await expect(emailInput).toBeEditable({ timeout: 15_000 });
  await selectInviteRole(page, inviteForm, roleLabel);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await emailInput.fill(email);
      await expect(emailInput).toHaveValue(email, { timeout: 5_000 });
      break;
    } catch (error) {
      if (attempt === 3) {
        throw error;
      }

      // React controlled inputs can ignore Playwright's fill when the settings
      // surface remounts. Commit through the native setter so onChange runs.
      await emailInput.evaluate((element, value) => {
        const input = element as HTMLInputElement;
        const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
        descriptor?.set?.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }, email);
    }
  }

  const submitButton = inviteForm.getByTestId("settings-roles-invite-submit");
  await submitButton.waitFor({ state: "visible", timeout: 15_000 });

  if (!(await submitButton.isEnabled().catch(() => false))) {
    const emailValue = await emailInput.inputValue().catch(() => "");
    throw new Error(
      `Invite submit remained disabled for ${email}; emailValue=${JSON.stringify(emailValue)}, role=${roleLabel}.`,
    );
  }

  await expect(submitButton).toBeEnabled({ timeout: 15_000 });
  await dismissBlockingModalOverlays(page);
  await inviteForm.scrollIntoViewIfNeeded();
  await submitButton.scrollIntoViewIfNeeded();
  const inviteResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/proxy/v1/admin/users/invite") &&
      response.request().method() === "POST",
    { timeout: 90_000 },
  );

  await clickThroughBlockingOverlays(page, submitButton, { force: true });

  let inviteResponse = await inviteResponsePromise.catch(() => null);

  if (inviteResponse === null) {
    await inviteForm.evaluate((form: HTMLFormElement) => {
      form.requestSubmit();
    });
    inviteResponse = await page
      .waitForResponse(
        (response) =>
          response.url().includes("/api/proxy/v1/admin/users/invite") &&
          response.request().method() === "POST",
        { timeout: 45_000 },
      )
      .catch(() => null);
  }

  const invitationsTable = page.getByTestId("settings-roles-pending-invitations-table");
  const pendingRow = invitationsTable.locator("tr", { hasText: email });
  const conflictCopy = page
    .getByText(/Cannot invite this email|directory user already exists/i)
    .or(
      page
        .locator("[data-sonner-toast]")
        .filter({ hasText: /Cannot invite this email|directory user already exists/i }),
    );

  let inviteResponseStatus: number | undefined;
  let inviteResponseBody = "";
  if (inviteResponse !== null) {
    inviteResponseStatus = inviteResponse.status();
    inviteResponseBody = await inviteResponse.text();

    if (inviteResponseStatus === 409) {
      await expect(conflictCopy.first()).toBeVisible({ timeout: 30_000 });
      return;
    }
  } else {
    // Fall through to UI assertions when the build surfaces only toast + seeded rows.
  }

  try {
    await expect(async () => {
      await Promise.race([
        pendingRow.waitFor({ state: "visible", timeout: 5_000 }),
        conflictCopy.first().waitFor({ state: "visible", timeout: 5_000 }),
      ]);
    }).toPass({ timeout: 90_000 });
  } catch {
    const inviteHint =
      inviteResponseStatus !== undefined
        ? ` Invite POST status=${inviteResponseStatus} body=${inviteResponseBody.slice(0, 240)}.`
        : " Invite POST did not complete within 90s.";
    throw new Error(
      `Admin invite UI for ${email} did not show a pending row or conflict message within 90s after submit.${inviteHint}`,
    );
  }
}

/** Opens the revoke confirmation dialog via deep-link sync (stable under JwtBearer CI layout). */
export async function openPendingInvitationRevokeDialog(
  page: Page,
  pendingRow: Locator,
): Promise<void> {
  const revokeButton = pendingRow.getByTestId(/^settings-roles-revoke-invitation-/);
  await expect(revokeButton).toBeVisible({ timeout: 60_000 });
  const testId = await revokeButton.getAttribute("data-testid");
  const invitationId = (testId ?? "").replace("settings-roles-revoke-invitation-", "").trim();

  if (invitationId.length === 0) {
    throw new Error("Pending invitation row is missing settings-roles-revoke-invitation-* test id.");
  }

  await expect(async () => {
    await page.goto(
      `/administration/users?tab=users&revokeInviteId=${encodeURIComponent(invitationId)}`,
      { waitUntil: "domcontentloaded" },
    );
    await dismissBlockingModalOverlays(page);
    await expect(page.getByRole("alertdialog")).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 90_000 });
}

/** Revoked invitations live in the resolved list; expand it before asserting row status. */
export async function expectRevokedInvitationRowVisible(page: Page, inviteEmail: string): Promise<void> {
  await expect(async () => {
    await page.goto("/administration/users?tab=users", { waitUntil: "domcontentloaded" });
    await dismissBlockingModalOverlays(page);
    const showResolvedToggle = page.getByTestId("settings-roles-toggle-resolved-invitations");
    if (await showResolvedToggle.isVisible().catch(() => false)) {
      const toggleLabel = ((await showResolvedToggle.textContent()) ?? "").trim();
      if (/show resolved invitations/i.test(toggleLabel)) {
        await showResolvedToggle.click();
      }
    }
    const invitationsTable = page.getByTestId("settings-roles-pending-invitations-table");
    const revokedRow = invitationsTable.locator("tr", { hasText: inviteEmail });
    await expect(revokedRow).toContainText("Revoked", { timeout: 5_000 });
  }).toPass({ timeout: 90_000 });
}
