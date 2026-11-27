namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

// Explicit vendor package status avoids unsafe ordering of distribution backport suffixes.
// Each record covers an exact executing package release, not merely an upstream version.
internal enum VendorReleaseDisposition { Unknown, Affected, Fixed, NotAffected }
