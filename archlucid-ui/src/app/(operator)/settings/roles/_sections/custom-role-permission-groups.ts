export type PermissionGroup = {
  readonly area: string;
  readonly permissions: readonly { readonly id: string; readonly label: string }[];
};

export const CUSTOM_ROLE_PERMISSION_GROUPS: readonly PermissionGroup[] = [
  {
    area: "Runs",
    permissions: [
      { id: "Runs.Read", label: "Read runs" },
      { id: "Runs.Create", label: "Create runs" },
      { id: "Runs.Commit", label: "Commit runs" },
      { id: "Runs.Delete", label: "Delete runs" },
    ],
  },
  {
    area: "Findings",
    permissions: [
      { id: "Findings.Read", label: "Read findings" },
      { id: "Findings.Feedback", label: "Submit finding feedback" },
    ],
  },
  {
    area: "Governance",
    permissions: [
      { id: "Governance.Read", label: "Read governance" },
      { id: "Governance.SimulatePolicy", label: "Simulate policies" },
      { id: "Governance.ActivatePolicy", label: "Activate policies" },
    ],
  },
  {
    area: "Policy packs",
    permissions: [{ id: "PolicyPacks.Author", label: "Author policy packs" }],
  },
  {
    area: "Audit",
    permissions: [
      { id: "Audit.Read", label: "Read audit" },
      { id: "Audit.Export", label: "Export audit" },
    ],
  },
  {
    area: "Tenants",
    permissions: [
      { id: "Tenants.ReadOwn", label: "Read own tenant" },
      { id: "Tenants.ManageOwn", label: "Manage own tenant" },
      { id: "Tenants.ManageAny", label: "Manage any tenant" },
    ],
  },
  {
    area: "Billing",
    permissions: [
      { id: "Billing.Read", label: "Read billing" },
      { id: "Billing.Manage", label: "Manage billing" },
    ],
  },
  {
    area: "Identity",
    permissions: [{ id: "Identity.ManageProviders", label: "Manage identity providers" }],
  },
  {
    area: "Integrations",
    permissions: [{ id: "Integrations.Configure", label: "Configure integrations" }],
  },
  {
    area: "Support",
    permissions: [{ id: "Support.GenerateBundle", label: "Generate support bundles" }],
  },
  {
    area: "Admin Console",
    permissions: [{ id: "AdminConsole.Access", label: "Access admin console" }],
  },
];

export const ALL_MATRIX_PERMISSION_IDS: readonly string[] = CUSTOM_ROLE_PERMISSION_GROUPS.flatMap((group) =>
  group.permissions.map((permission) => permission.id),
);
