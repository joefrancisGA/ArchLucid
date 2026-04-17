import { z } from "zod";

export const companySizeOptions = ["1-10", "11-50", "51-500", "501+"] as const;

export const signupFormSchema = z.object({
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
});

export type SignupFormValues = z.infer<typeof signupFormSchema>;
