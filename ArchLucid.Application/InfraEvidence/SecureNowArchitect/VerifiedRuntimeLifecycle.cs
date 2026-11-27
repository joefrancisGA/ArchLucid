namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal sealed record VerifiedRuntimeLifecycle(string Product, string Vendor, string Distribution,
    string ReleaseLine, DateTimeOffset StandardSupportEnds, DateTimeOffset? ExtendedSupportEnds,
    DateTimeOffset VerifiedAt, DateTimeOffset ValidUntil, string EvidenceId);
