namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal sealed record VerifiedRuntimeAdvisory(
    string AdvisoryId, string Product, string Vendor, string Distribution,
    string IntroducedInclusive, string FixedExclusive, string EvidenceId,
    DateTimeOffset VerifiedAt, DateTimeOffset ValidUntil,
    IReadOnlyList<string> RequiredPrerequisites)
{
    public IReadOnlyList<VerifiedVendorRuntimeRelease> VendorReleases { get; init; } = [];
}
