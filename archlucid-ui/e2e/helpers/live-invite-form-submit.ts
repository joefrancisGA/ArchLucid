import { expect, type Locator, type Page } from "@playwright/test";

import { dismissBlockingModalOverlays, clickThroughBlockingOverlays } from "./dismiss-blocking-modal-overlays";

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
    await invitePrimaryAction.click();
  } else if (await inviteStartHereAction.isVisible().catch(() => false)) {
    await inviteStartHereAction.click();
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
  const inviteResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/proxy/v1/admin/users/invite") &&
      response.request().method() === "POST",
    { timeout: 90_000 },
  );

  await clickThroughBlockingOverlays(page, submitButton, { force: true });

  let inviteResponseStatus: number | undefined;
  let inviteResponseBody = "";
  try {
    const inviteResponse = await inviteResponsePromise;
    inviteResponseStatus = inviteResponse.status();
    inviteResponseBody = await inviteResponse.text();
  } catch {
    // Fall through to UI assertions when the build surfaces only toast + seeded rows.
  }

  const pendingRow = page.locator("tr", { hasText: email });
  const conflictCopy = page.getByText(/Cannot invite this email|directory user already exists/i);

  try {
    await Promise.race([
      pendingRow.waitFor({ state: "visible", timeout: 90_000 }),
      conflictCopy.waitFor({ state: "visible", timeout: 90_000 }),
    ]);
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
