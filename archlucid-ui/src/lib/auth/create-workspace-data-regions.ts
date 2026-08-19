/** Mirrors `TenantDataRegions.PlatformDefaultSupportedRegions` for self-service workspace creation (TB-1467). */
export const createWorkspaceDataRegionValues = [
  "default",
  "eastus",
  "eastus2",
  "westus2",
  "centralus",
  "westeurope",
  "northeurope",
  "uksouth",
  "southeastasia",
  "australiaeast",
  "centralindia",
  "brazilsouth",
] as const;

export type CreateWorkspaceDataRegion = (typeof createWorkspaceDataRegionValues)[number];

export const CREATE_WORKSPACE_DATA_REGION_OPTIONS: ReadonlyArray<{
  readonly value: CreateWorkspaceDataRegion;
  readonly label: string;
}> = [
  { value: "default", label: "Deployment default (recommended)" },
  { value: "eastus", label: "United States — East (Virginia)" },
  { value: "eastus2", label: "United States — East 2" },
  { value: "westus2", label: "United States — West 2" },
  { value: "centralus", label: "United States — Central" },
  { value: "westeurope", label: "Europe — West" },
  { value: "northeurope", label: "Europe — North" },
  { value: "uksouth", label: "United Kingdom — South" },
  { value: "southeastasia", label: "Asia — Southeast" },
  { value: "australiaeast", label: "Australia — East" },
  { value: "centralindia", label: "India — Central" },
  { value: "brazilsouth", label: "Brazil — South" },
];
