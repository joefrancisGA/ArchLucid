import { z } from "zod";

const cloudInventoryManifestBaseSchema = z.object({
  schemaVersion: z.number().int().nonnegative(),
  scriptVersion: z.string().min(1),
  collectionTimestamp: z.string().min(1),
  cloudProvider: z.string().min(1).optional(),
  scope: z.string().min(1).optional(),
  switchesUsed: z.array(z.string()).optional(),
  collectorVersion: z.string().optional(),
});

export const archLucidAwsInventoryPackageManifestSchema = cloudInventoryManifestBaseSchema.extend({
  accountId: z.string().min(1),
});

export const archLucidGcpInventoryPackageManifestSchema = cloudInventoryManifestBaseSchema.extend({
  projectId: z.string().min(1),
});

export type ArchLucidAwsInventoryPackageManifest = z.infer<typeof archLucidAwsInventoryPackageManifestSchema>;

export type ArchLucidGcpInventoryPackageManifest = z.infer<typeof archLucidGcpInventoryPackageManifestSchema>;
