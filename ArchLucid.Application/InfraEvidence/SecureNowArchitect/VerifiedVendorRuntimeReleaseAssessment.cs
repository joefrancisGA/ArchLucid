namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

// Explicit vendor package status avoids unsafe ordering of distribution backport suffixes.
// Each record covers an exact executing package release, not merely an upstream version.
internal enum VendorReleaseDisposition { Unknown, Affected, Fixed, NotAffected }
internal sealed record VerifiedVendorRuntimeRelease(
    string AdvisoryId, string Product, string Vendor, string Distribution, string PackageVersion,
    VendorReleaseDisposition Disposition, string EvidenceId, DateTimeOffset VerifiedAt, DateTimeOffset ValidUntil);

internal static class VerifiedVendorRuntimeReleaseAssessment
{
    public static VendorReleaseDisposition Assess(RuntimeObservation observation, string advisoryId,
        IReadOnlyList<VerifiedVendorRuntimeRelease> releases, DateTimeOffset now, TimeSpan maximumAge)
    {
        if (observation.Kind != RuntimeEvidenceKind.Executing || maximumAge <= TimeSpan.Zero ||
            observation.ObservedAt > now || now - observation.ObservedAt > maximumAge ||
            string.IsNullOrWhiteSpace(observation.EvidenceId) || string.IsNullOrWhiteSpace(observation.ResourceId) ||
            string.IsNullOrWhiteSpace(advisoryId) || string.IsNullOrWhiteSpace(observation.Version) ||
            string.IsNullOrWhiteSpace(observation.Product) || string.IsNullOrWhiteSpace(observation.Vendor) ||
            string.IsNullOrWhiteSpace(observation.Distribution) || releases.Count > 10000)
            return VendorReleaseDisposition.Unknown;
        var matching = releases.Where(r => r is not null &&
            string.Equals(r.AdvisoryId, advisoryId, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(r.Product, observation.Product, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(r.Vendor, observation.Vendor, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(r.Distribution, observation.Distribution, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(r.PackageVersion, observation.Version, StringComparison.Ordinal)).ToArray();
        if (matching.Length != 1) return VendorReleaseDisposition.Unknown;
        var release = matching[0];
        return string.IsNullOrWhiteSpace(release.EvidenceId) || release.VerifiedAt > now ||
            release.ValidUntil <= now || release.ValidUntil <= release.VerifiedAt ||
            !Enum.IsDefined(release.Disposition) ? VendorReleaseDisposition.Unknown : release.Disposition;
    }
}
