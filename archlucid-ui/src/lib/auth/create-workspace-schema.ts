import { z } from "zod";

import { createWorkspaceDataRegionValues } from "@/lib/auth/create-workspace-data-regions";
import { industryVerticalOptions } from "@/lib/signup-schema";

export const createWorkspaceFormSchema = z
  .object({
    workspaceName: z
      .string()
      .trim()
      .min(2, "Workspace name must be at least 2 characters.")
      .max(120, "Workspace name must be at most 120 characters."),
    organizationName: z.string().trim().max(200, "Organization name must be at most 200 characters."),
    dataRegion: z.enum(createWorkspaceDataRegionValues),
    industryVertical: z.enum(industryVerticalOptions).optional(),
    industryVerticalOther: z.string().max(200).optional(),
    termsAccepted: z.boolean().refine((value) => value, { message: "Accept the terms to continue." }),
    includeDemoSeed: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.industryVertical === "Other" && (values.industryVerticalOther?.trim().length ?? 0) === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please specify your industry when you select Other.",
        path: ["industryVerticalOther"],
      });
    }
  });

export type CreateWorkspaceFormValues = z.infer<typeof createWorkspaceFormSchema>;

export const CREATE_WORKSPACE_COPY = {
  title: "Create your workspace",
  lead: "Set up an ArchLucid workspace for your organization. You can rename the workspace later.",
  workspaceNameLabel: "Workspace name",
  organizationNameLabel: "Organization name (optional)",
  organizationHint: "Use a different name when your workspace label differs from your company name.",
  dataRegionLabel: "Country or region",
  dataRegionHint:
    "Select where this workspace's data is stored. Additional regions are added when demand warrants — this choice does not imply multi-region failover.",
  industryLabel: "Industry or evaluation focus (optional)",
  termsLabel: "I accept the ArchLucid terms and privacy policy for this workspace.",
  includeDemoSeedLabel: "Include sample architecture review data",
  submit: "Create workspace",
  submitting: "Creating workspace…",
  accessRequest: "Request access",
  selectWorkspaceTitle: "Choose a workspace",
  invitationTitle: "Join your organization",
  invitationLead: "You have a pending invitation to join an ArchLucid workspace.",
  noAccessTitle: "Access not available",
} as const;
