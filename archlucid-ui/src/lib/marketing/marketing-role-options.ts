export type MarketingRoleOption = {
  readonly value: string;
  readonly label: string;
};

/** Shared role choices for marketing early-access capture surfaces. */
export const MARKETING_ROLE_OPTIONS: readonly MarketingRoleOption[] = [
  { value: "architect", label: "Architect / engineer" },
  { value: "engineering_lead", label: "Engineering lead" },
  { value: "product_program", label: "Product / program" },
  { value: "procurement_it", label: "Procurement / IT" },
  { value: "security_risk", label: "Security / risk" },
  { value: "other", label: "Other" },
];

export const MARKETING_ROLE_NONE_LABEL = "Role (optional)";

/** Sentinel for shadcn Select when role is unset (SelectItem values cannot be empty). */
export const MARKETING_ROLE_SELECT_NONE_VALUE = "__none__";
