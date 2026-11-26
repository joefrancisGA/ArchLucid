using ArchLucid.Application.InfraEvidence.SecureNowArchitect;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class VerifiedVendorRuntimeReleaseAssessmentTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 26, 12, 0, 0, TimeSpan.Zero);
    private static readonly RuntimeObservation Observation = new("resource", "php", "debian", "debian-12",
        "8.2.29-1~deb12u1", RuntimeEvidenceKind.Executing, "runtime-proof", Now.AddMinutes(-1),
        new Dictionary<string, RuntimePrerequisiteState>());
    private static readonly VerifiedVendorRuntimeRelease Release = new("CVE-test", "php", "debian", "debian-12",
        "8.2.29-1~deb12u1", VendorReleaseDisposition.Fixed, "vendor-proof", Now.AddDays(-1), Now.AddDays(1));

    [Fact]
    public void Exact_vendor_backport_is_recognized_without_upstream_version_inference()
    {
        Assert.Equal(VendorReleaseDisposition.Fixed, Assess(Observation, [Release]));
        Assert.Equal(VendorReleaseDisposition.Unknown, Assess(Observation with { Version = "8.2.29" }, [Release]));
        Assert.Equal(VendorReleaseDisposition.Unknown, Assess(Observation with { Distribution = "debian-13" }, [Release]));
        Assert.Equal(VendorReleaseDisposition.Unknown, Assess(Observation with { Kind = RuntimeEvidenceKind.Installed }, [Release]));
    }

    [Fact]
    public void Stale_conflicting_or_missing_vendor_proof_is_unknown()
    {
        Assert.Equal(VendorReleaseDisposition.Unknown, Assess(Observation, []));
        Assert.Equal(VendorReleaseDisposition.Unknown, Assess(Observation, [Release with { ValidUntil = Now }]));
        Assert.Equal(VendorReleaseDisposition.Unknown, Assess(Observation, [Release with { EvidenceId = "" }]));
        Assert.Equal(VendorReleaseDisposition.Unknown, Assess(Observation,
            [Release, Release with { Disposition = VendorReleaseDisposition.Affected }]));
    }

    private static VendorReleaseDisposition Assess(RuntimeObservation observation,
        IReadOnlyList<VerifiedVendorRuntimeRelease> releases) =>
        VerifiedVendorRuntimeReleaseAssessment.Assess(observation, "CVE-test", releases, Now, TimeSpan.FromMinutes(5));
}
