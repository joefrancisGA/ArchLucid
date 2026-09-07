/**
 * Mock-backed handoff smoke for infrastructure evidence hub → workbench → Ask.
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
  diagramCorrespondence: {
    correspondenceId: "corr-1",
    diagramNodeId: "node-1",
    diagramNodeLabel: "Gateway",
    cloudResourceId,
    azureResourceId:
      "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
    resourceType: "Microsoft.Network/publicIPAddresses",
    resourceGroup: "rg-net",
    terraformAddress: "azurerm_public_ip.gateway",
    matchKind: "Conflict",
    confidenceBand: "Likely",
    explainText: "Diagram node conflicts with inventory public IP configuration.",
    aiRationale: null,
    securityDiscrepancy: true,
  },
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
    items: [
      {
        id: "finding-1",
        title: "Public endpoint",
        severity: "High",
        status: "Open",
        streamKind: "OperationalSecurity",
        streamLabel: "Operational security",
      },
    ],
    totalCount: 1,
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
  remediationInstances: {
    items: [{ instanceId: "instance-1", patternKey: "public-ip-restrict", status: "Draft" }],
    totalCount: 1,
    page: 1,
    pageSize: 25,
    hasMore: false,
  },
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
    matches: [
      {
        assessmentId,
        auditEvidenceSnapshotId: auditSnapshotId,
        controlId,
        controlNumber: "AC-2",
        controlTitle: "Account management",
        snapshotCreatedUtc: "2026-01-01T00:00:00Z",
      },
    ],
  },
  evidencePointers: [],
};

const explorerRowsFixture = {
  items: [
    {
      cloudResourceId,
      externalResourceId:
        "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
      displayName: "gateway",
      resourceType: "Microsoft.Network/publicIPAddresses",
      resourceGroup: "rg-net",
      region: "eastus",
      lastSeenUtc: "2026-01-01T00:00:00Z",
      workCounts: {
        openOperationalFindingsCount: 1,
        openRemediationInstancesCount: 1,
        inventoryDriftChangeCount: 1,
      },
    },
  ],
  totalCount: 1,
  page: 1,
  pageSize: 50,
  hasMore: false,
};

test.describe(`infra-evidence-hub-handoff (${releaseGateTag})`, { tag: [releaseGateTag] }, () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await page.route("**/api/proxy/v1/infra-evidence/cloud-resources**", async (route) => {
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
        body: JSON.stringify(explorerRowsFixture),
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
        body: JSON.stringify([
          {
            diffId: "diff-1",
            snapshotAId: snapshotId,
            snapshotBId: "33333333-3333-3333-3333-333333333333",
            totalChanges: 1,
            createdUtc: "2026-01-01T00:00:00Z",
          },
        ]),
      });
    });

    await page.route("**/api/proxy/v1/infra-evidence/diffs/*/changes**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              changeId: "change-1",
              diffId: "diff-1",
              cloudResourceId,
              azureResourceId:
                "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
              changeType: "Modified",
              property: "sku",
              oldValue: "Basic",
              newValue: "Standard",
              riskClassification: "Medium",
              evidenceReference: "snapshot-diff",
            },
          ],
          totalCount: 1,
          page: 1,
          pageSize: 100,
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
  });

  test("hub drift workbench link preserves snapshot and audit scope for Ask handoff", async ({ page }) => {
    const hubUrl =
      `/governance/infrastructure/resources/${cloudResourceId}?tab=drift&snapshotId=${snapshotId}&assessmentId=${assessmentId}&auditEvidenceSnapshotId=${auditSnapshotId}&controlId=${controlId}`;

    await page.goto(hubUrl);
    await expect(page.getByTestId("infra-resource-hub-open-drift")).toBeVisible({ timeout: 60_000 });

    await page.getByTestId("infra-resource-hub-open-drift").click();
    await expect(page).toHaveURL(/\/governance\/infrastructure\/drift\?/);
    await expect(page).toHaveURL(/cloudResourceId=11111111-1111-1111-1111-111111111111/);
    await expect(page).toHaveURL(/assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/);
    await expect(page).toHaveURL(/auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/);
    await expect(page).toHaveURL(/controlId=cccccccc-cccc-cccc-cccc-cccccccccccc/);

    await page.getByTestId("infra-drift-diff-picker").selectOption("diff-1");
    await expect(page.getByTestId("infra-drift-open-ask")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("infra-drift-open-ask").click();
    await expect(page).toHaveURL(/\/governance\/infrastructure\/ask\?/);
    await expect(page.getByTestId("infra-ask-open-scope-hub-tab")).toHaveAttribute("href", /tab=drift/);
    await expect(page.getByTestId("infra-ask-open-audit-hub-tab")).toHaveAttribute("href", /tab=audit/);
  });

  test("hub diagram workbench preserves audit scope", async ({ page }) => {
    const hubUrl =
      `/governance/infrastructure/resources/${cloudResourceId}?tab=diagram&snapshotId=${snapshotId}&assessmentId=${assessmentId}&auditEvidenceSnapshotId=${auditSnapshotId}&controlId=${controlId}`;

    await page.goto(hubUrl);
    await expect(page.getByTestId("infra-resource-hub-diagrams-workbench")).toBeVisible({ timeout: 60_000 });
    await page.getByTestId("infra-resource-hub-diagrams-workbench").click();
    await expect(page).toHaveURL(/\/governance\/infrastructure\/diagrams\?/);
    await expect(page).toHaveURL(/assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/);
  });

  test("hub remediation factory preserves audit scope", async ({ page }) => {
    const hubUrl =
      `/governance/infrastructure/resources/${cloudResourceId}?tab=remediation&snapshotId=${snapshotId}&assessmentId=${assessmentId}&auditEvidenceSnapshotId=${auditSnapshotId}&controlId=${controlId}`;

    await page.goto(hubUrl);
    await expect(page.getByTestId("infra-resource-hub-remediation-factory-instance-1")).toBeVisible({
      timeout: 60_000,
    });
    await page.getByTestId("infra-resource-hub-remediation-factory-instance-1").click();
    await expect(page).toHaveURL(/\/governance\/infrastructure\/remediation\?/);
    await expect(page).toHaveURL(/instanceId=instance-1/);
    await expect(page).toHaveURL(/controlId=cccccccc-cccc-cccc-cccc-cccccccccccc/);
  });

  test("explorer snapshot context forwards into hub links", async ({ page }) => {
    const explorerUrl =
      `/governance/infrastructure/resources?snapshotId=${snapshotId}`;

    await page.goto(explorerUrl);
    await expect(page.getByTestId(`infra-resource-explorer-hub-${cloudResourceId}`)).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId(`infra-resource-explorer-hub-${cloudResourceId}`)).toHaveAttribute(
      "href",
      new RegExp(`snapshotId=${snapshotId}`),
    );
  });

  test("explorer cloudResourceId redirect preserves work queue and snapshot", async ({ page }) => {
    const explorerUrl =
      `/governance/infrastructure/resources?cloudResourceId=${cloudResourceId}&workQueue=open-findings&snapshotId=${snapshotId}`;

    await page.goto(explorerUrl);
    await expect(page).toHaveURL(
      new RegExp(
        `/governance/infrastructure/resources/${cloudResourceId}\\?tab=findings&snapshotId=${snapshotId}`,
      ),
      { timeout: 60_000 },
    );
  });

  test("hub tab switch preserves audit scope on sibling links", async ({ page }) => {
    const hubUrl =
      `/governance/infrastructure/resources/${cloudResourceId}?tab=drift&snapshotId=${snapshotId}&assessmentId=${assessmentId}&auditEvidenceSnapshotId=${auditSnapshotId}&controlId=${controlId}`;

    await page.goto(hubUrl);
    await expect(page.getByTestId("infra-resource-hub-drift-open-findings-tab")).toBeVisible({ timeout: 60_000 });
    await page.getByTestId("infra-resource-hub-drift-open-findings-tab").click();
    await expect(page).toHaveURL(/tab=findings/);
    await expect(page).toHaveURL(/assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/);
    await expect(page).toHaveURL(/auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/);
    await expect(page).toHaveURL(/controlId=cccccccc-cccc-cccc-cccc-cccccccccccc/);
  });

  test("terraform hub workbench Ask handoff preserves terraform back link", async ({ page }) => {
    const hubUrl =
      `/governance/infrastructure/resources/${cloudResourceId}?tab=terraform&snapshotId=${snapshotId}&assessmentId=${assessmentId}&auditEvidenceSnapshotId=${auditSnapshotId}&controlId=${controlId}`;

    await page.goto(hubUrl);
    await expect(page.getByTestId("infra-resource-hub-terraform-open-workbench")).toBeVisible({ timeout: 60_000 });
    await page.getByTestId("infra-resource-hub-terraform-open-workbench").click();
    await expect(page).toHaveURL(/\/governance\/infrastructure\/terraform\?/);
    await expect(page).toHaveURL(/controlId=cccccccc-cccc-cccc-cccc-cccccccccccc/);

    await expect(page.getByTestId("infra-terraform-open-ask")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("infra-terraform-open-ask").click();
    await expect(page).toHaveURL(/\/governance\/infrastructure\/ask\?/);
    await expect(page).toHaveURL(/tab=terraform/);
    await expect(page.getByTestId("infra-ask-terraform-back-link")).toHaveAttribute(
      "href",
      /\/governance\/infrastructure\/terraform\?/,
    );
    await expect(page.getByTestId("infra-ask-open-scope-hub-tab")).toHaveAttribute("href", /tab=terraform/);
  });

  test("remediation workbench Ask handoff preserves remediation hub tab", async ({ page }) => {
    const hubUrl =
      `/governance/infrastructure/resources/${cloudResourceId}?tab=remediation&snapshotId=${snapshotId}&assessmentId=${assessmentId}&auditEvidenceSnapshotId=${auditSnapshotId}&controlId=${controlId}`;

    await page.goto(hubUrl);
    await expect(page.getByTestId("infra-resource-hub-remediation-factory-instance-1")).toBeVisible({
      timeout: 60_000,
    });
    await page.getByTestId("infra-resource-hub-remediation-factory-instance-1").click();
    await expect(page).toHaveURL(/\/governance\/infrastructure\/remediation\?/);
    await expect(page.getByTestId("infra-remediation-open-ask")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("infra-remediation-open-ask").click();
    await expect(page).toHaveURL(/\/governance\/infrastructure\/ask\?/);
    await expect(page).toHaveURL(/tab=remediation/);
    await expect(page.getByTestId("infra-ask-open-scope-hub-tab")).toHaveAttribute("href", /tab=remediation/);
  });

  test("diagram reconcile Ask handoff preserves audit scope", async ({ page }) => {
    const hubUrl =
      `/governance/infrastructure/resources/${cloudResourceId}?tab=diagram&runId=run-1&snapshotId=${snapshotId}&assessmentId=${assessmentId}&auditEvidenceSnapshotId=${auditSnapshotId}&controlId=${controlId}`;

    await page.goto(hubUrl);
    await expect(page.getByTestId("infra-resource-hub-diagram-ask")).toBeVisible({ timeout: 60_000 });
    await page.getByTestId("infra-resource-hub-diagram-ask").click();
    await expect(page).toHaveURL(/\/governance\/infrastructure\/ask\?/);
    await expect(page).toHaveURL(/tab=diagram/);
    await expect(page).toHaveURL(/controlId=cccccccc-cccc-cccc-cccc-cccccccccccc/);
    await expect(page.getByTestId("infra-ask-open-scope-hub-tab")).toHaveAttribute("href", /tab=diagram/);
    await expect(page.getByTestId("infra-ask-open-audit-hub-tab")).toHaveAttribute("href", /tab=audit/);
  });

  test("drift workbench syncs diff selection into the URL", async ({ page }) => {
    const driftUrl =
      `/governance/infrastructure/drift?snapshotId=${snapshotId}&cloudResourceId=${cloudResourceId}`;

    await page.goto(driftUrl);
    await expect(page.getByTestId("infra-drift-diff-picker")).toBeVisible({ timeout: 60_000 });
    await page.getByTestId("infra-drift-diff-picker").selectOption("diff-1");
    await expect(page).toHaveURL(/diffId=diff-1/);

    await page.reload();
    await expect(page.getByTestId("infra-drift-diff-picker")).toHaveValue("diff-1", { timeout: 60_000 });
  });

  test("degraded audit lineage shows recovery actions on drift workbench", async ({ page }) => {
    await page.route("**/api/proxy/v1/infra-evidence/cloud-resources**", async (route) => {
      const url = route.request().url();

      if (url.includes("/hub")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ...hubFixture,
            auditLineageLink: {
              available: false,
              degradedReason: "No matching audit control for this resource.",
              relativePath: null,
              assessmentId: null,
              auditEvidenceSnapshotId: null,
              controlId: null,
              controlNumber: null,
              controlTitle: null,
              matches: [],
            },
          }),
        });

        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(explorerRowsFixture),
      });
    });

    const driftUrl =
      `/governance/infrastructure/drift?snapshotId=${snapshotId}&cloudResourceId=${cloudResourceId}`;

    await page.goto(driftUrl);
    await expect(page.getByTestId("infra-drift-audit-unavailable")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("infra-drift-audit-unavailable-open-audit-tab")).toBeVisible();
  });
});
