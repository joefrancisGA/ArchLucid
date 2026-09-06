/**
 * Mock-backed handoff smoke for infrastructure evidence hub → drift workbench → Ask.
 */
import { expect, test } from "@playwright/test";

const releaseGateTag = "@release-gate";

const cloudResourceId = "11111111-1111-1111-1111-111111111111";
const snapshotId = "22222222-2222-2222-2222-222222222222";
const assessmentId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const auditSnapshotId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const controlId = "cccccccc-cccc-cccc-cccc-cccccccccccc";

const hubFixture = {
  cloudResourceId,
  externalResourceId:
    "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
  resourceType: "Microsoft.Network/publicIPAddresses",
  terraformAddress: "azurerm_public_ip.gateway",
  terraformGenerationMethod: "advisory",
  currentConfiguration: {
    snapshotId,
    azureResourceId:
      "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
    resourceType: "Microsoft.Network/publicIPAddresses",
    resourceGroup: "rg-net",
    region: "eastus",
    properties: {},
    tags: {},
  },
  operationalSecurityFindings: {
    streamKind: "OperationalSecurity",
    streamLabel: "Operational security",
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 25,
    hasMore: false,
  },
  architectureReviewFindings: {
    streamKind: "ArchitectureReview",
    streamLabel: "Architecture review",
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 25,
    hasMore: false,
  },
  remediationInstances: { items: [], totalCount: 0, page: 1, pageSize: 25, hasMore: false },
  recentChanges: [
    {
      changeId: "change-1",
      diffId: "diff-1",
      snapshotAId: snapshotId,
      snapshotBId: "33333333-3333-3333-3333-333333333333",
      property: "sku",
      changeType: "Modified",
      oldValue: "Basic",
      newValue: "Standard",
      riskClassification: "Medium",
    },
  ],
  auditLineageLink: {
    available: true,
    degradedReason: null,
    relativePath: "/v1/infra-evidence/audit-assessments/a/snapshots/s/controls/c/lineage",
    assessmentId,
    auditEvidenceSnapshotId: auditSnapshotId,
    controlId,
    controlNumber: "AC-2",
    controlTitle: "Account management",
    matches: [],
  },
  evidencePointers: [],
};

test.describe(`infra-evidence-hub-handoff (${releaseGateTag})`, { tag: [releaseGateTag] }, () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/proxy/v1/infra-evidence/cloud-resources/**", async (route) => {
      const url = route.request().url();

      if (url.includes("/hub")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(hubFixture),
        });

        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [],
          totalCount: 0,
          page: 1,
          pageSize: 50,
          hasMore: false,
        }),
      });
    });

    await page.route("**/api/proxy/v1/infra-evidence/snapshots**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [{ snapshotId, subscriptionName: "sub", capturedUtc: "2026-01-01T00:00:00Z", resourceCount: 1 }],
          totalCount: 1,
          page: 1,
          pageSize: 50,
          hasMore: false,
        }),
      });
    });

    await page.route("**/api/proxy/v1/infra-evidence/snapshots/*/diffs**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              diffId: "diff-1",
              snapshotAId: snapshotId,
              snapshotBId: "33333333-3333-3333-3333-333333333333",
              totalChanges: 1,
              createdUtc: "2026-01-01T00:00:00Z",
            },
          ],
          totalCount: 1,
          page: 1,
          pageSize: 50,
          hasMore: false,
        }),
      });
    });

    await page.route("**/api/proxy/v1/infra-evidence/diffs**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], totalCount: 0, page: 1, pageSize: 50, hasMore: false }),
      });
    });

    await page.route("**/api/proxy/v1/infra-evidence/diffs/*/changes**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], totalCount: 0, page: 1, pageSize: 100, hasMore: false }),
      });
    });
  });

  test("hub drift workbench link preserves snapshot and audit scope for Ask handoff", async ({ page }) => {
    const hubUrl =
      `/governance/infrastructure/resources/${cloudResourceId}?tab=drift&snapshotId=${snapshotId}&assessmentId=${assessmentId}&auditEvidenceSnapshotId=${auditSnapshotId}&controlId=${controlId}`;

    await page.goto(hubUrl);
    await expect(page.getByTestId("infra-resource-hub-open-drift-work")).toBeVisible({ timeout: 60_000 });

    await page.getByTestId("infra-resource-hub-open-drift-work").click();
    await expect(page).toHaveURL(/\/governance\/infrastructure\/drift\?/);
    await expect(page).toHaveURL(/cloudResourceId=11111111-1111-1111-1111-111111111111/);
    await expect(page).toHaveURL(/assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/);

    await page.getByTestId("infra-drift-diff-picker").selectOption("diff-1");
    await expect(page.getByTestId("infra-drift-open-ask")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("infra-drift-open-ask").click();
    await expect(page).toHaveURL(/\/governance\/infrastructure\/ask\?/);
    await expect(page).toHaveURL(/auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/);
    await expect(page).toHaveURL(/controlId=cccccccc-cccc-cccc-cccc-cccccccccccc/);
    await expect(page.getByTestId("infra-ask-open-scope-hub-tab")).toHaveAttribute(
      "href",
      /tab=audit/,
    );
  });
});
