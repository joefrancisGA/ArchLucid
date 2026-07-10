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
    industryVerticalOther: z.string().max(200, "At most 200 characters.").optional(),
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
      } else if (n <= 0 || n > 10_000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Architecture team size must be between 1 and 10,000 when provided.",
          path: ["architectureTeamSize"],
        });
      }
    }

    if (v.industryVertical === "Other" && (v.industryVerticalOther == null || v.industryVerticalOther.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please specify your industry when you select “Other.”",
        path: ["industryVerticalOther"],
      });
    }
  });

export type SignupFormValues = z.infer<typeof signupFormSchema>;
