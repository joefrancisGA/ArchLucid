using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class FindingPinnedEvidencePackageReferenceResolverTests
{
    [Theory]
    [InlineData("evidencePackage")]
    [InlineData("EvidencePackage")]
    [InlineData("EVIDENCEPACKAGE")]
    public void ResolvesToPinnedPackageId_accepts_case_insensitive_anchor_keys(string anchorKey)
    {
        Guid packageId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Finding finding = new()
        {
            FindingId = "f-1",
            FindingType = "Evidence",
            Category = "Evidence",
            EngineType = "Test",
            Severity = FindingSeverity.Error,
            Title = "Evidence package reference",
            Rationale = $"{anchorKey}:{packageId:D}",
        };

        Assert.True(FindingPinnedEvidencePackageReferenceResolver.ResolvesToPinnedPackageId(
            finding, new HashSet<Guid> { packageId }));
    }
}
