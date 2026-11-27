namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal sealed record VerifiedVendorRuntimeRelease(
    string AdvisoryId, string Product, string Vendor, string Distribution, string PackageVersion,
    VendorReleaseDisposition Disposition, string EvidenceId, DateTimeOffset VerifiedAt, DateTimeOffset ValidUntil);
