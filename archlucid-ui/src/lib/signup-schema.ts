import { z } from "zod";

export const companySizeOptions = [
  "1-10",
  "11-50",
  "51-200",
  "201-1000",
  "1001-5000",
  "5001-50000",
  "50001+",
] as const;

export const industryVerticalOptions = [
  "Healthcare",
  "Financial Services",
  "Technology",
  "Government / Public Sector",
  "Manufacturing",
  "Retail",
  "Insurance",
  "Energy / Utilities",
  "Education",
  "Telecommunications",
  "Other",
] as const;

export const signupFormSchema = z
  .object({
    adminEmail: z.string().trim().email("Enter a valid email."),
    adminDisplayName: z
      .string()
      .trim()
      .min(1, "Full name is required.")
      .max(200, "Full name must be at most 200 characters."),
    organizationName: z
      .string()
      .trim()
      .min(1, "Organization name is required.")
      .max(200, "Organization name must be at most 200 characters."),
    companySize: z.enum(companySizeOptions).optional(),
    architectureTeamSize: z.string().optional(),
    industryVertical: z.enum(industryVerticalOptions).optional(),
    industryVerticalOther: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    const arch = v.architectureTeamSize?.trim() ?? "";

    if (arch.length > 0) {
      const n = Number(arch);

      if (!Number.isFinite(n)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid number for architecture team size.",
          path: ["architectureTeamSize"],
        });
      } else if (!Number.isInteger(n)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Architecture team size must be a whole number when provided.",
          path: ["architectureTeamSize"],
        });
      } else if (n <= 0 || n > 10_000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Architecture team size must be between 1 and 10,000 when provided.",
          path: ["architectureTeamSize"],
        });
      }
    }

    if (v.industryVertical === "Other") {
      const other = v.industryVerticalOther?.trim() ?? "";

      if (other.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please specify your industry when you select “Other.”",
          path: ["industryVerticalOther"],
        });
      } else if (other.length > 200) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At most 200 characters.",
          path: ["industryVerticalOther"],
        });
      }
    }
  });

export type SignupFormValues = z.infer<typeof signupFormSchema>;

/** TB-2010 readiness copy beside the signup CTA when hard client validation blocks submit. */
export function deriveSignupFormReadinessMessage(values: SignupFormValues): string | null {
  const parsed = signupFormSchema.safeParse(values);

  if (parsed.success) {
    return null;
  }

  const trimmedEmail = values.adminEmail?.trim() ?? "";
  const trimmedName = values.adminDisplayName?.trim() ?? "";
  const trimmedOrg = values.organizationName?.trim() ?? "";

  if (trimmedEmail.length === 0 || trimmedName.length === 0 || trimmedOrg.length === 0) {
    return "Enter work email, full name, and organization to continue.";
  }

  const issue = parsed.error.issues[0];
  const issuePath = issue?.path[0];
  const issueMessage = issue?.message;

  switch (issuePath) {
    case "adminEmail":
      return "Enter a valid work email to continue.";
    case "adminDisplayName":
      return "Enter a full name of at most 200 characters to continue.";
    case "organizationName":
      return "Enter an organization name of at most 200 characters to continue.";
    case "architectureTeamSize":
      return readinessMessageForArchitectureTeamSize(issueMessage);
    case "industryVerticalOther":
      return readinessMessageForIndustryVerticalOther(issueMessage);
    default:
      return "Complete the required fields to continue.";
  }
}

function readinessMessageForArchitectureTeamSize(message: string | undefined): string {
  if (message === "Architecture team size must be a whole number when provided.") {
    return "Enter a whole-number architecture team size to continue.";
  }

  if (message === "Enter a valid number for architecture team size.") {
    return "Enter a valid architecture team size to continue.";
  }

  return "Enter a valid architecture team size between 1 and 10,000 to continue.";
}

function readinessMessageForIndustryVerticalOther(message: string | undefined): string {
  if (message === "At most 200 characters.") {
    return "Enter an industry specification of at most 200 characters to continue.";
  }

  return "Specify your industry when you select Other to continue.";
}
