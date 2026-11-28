import {
  SECURENOW_ACCELERATOR_TEMPLATE_RICHNESS_FIXTURE_LINE,
  SECURENOW_ACCELERATOR_TEMPLATE_RICHNESS_LEAD,
} from "@/lib/product-line/securenow-accelerator-template-richness-honesty-copy";

export type SecureNowAcceleratorTemplateRichnessHonesty = {
  readonly lead: string;
  readonly fixtureLine: string;
};

export function resolveSecureNowAcceleratorTemplateRichnessHonesty(): SecureNowAcceleratorTemplateRichnessHonesty {
  return { lead: SECURENOW_ACCELERATOR_TEMPLATE_RICHNESS_LEAD, fixtureLine: SECURENOW_ACCELERATOR_TEMPLATE_RICHNESS_FIXTURE_LINE };
}
