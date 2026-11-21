using System.Text.Json;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingPinnedEvidenceReferenceTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void IncidentalGuid_DoesNotCountAsPinnedEvidenceReference(bool explicitReference)
    {
        Guid packageId = Guid.NewGuid();
        RunRecord header = new()
        {
            PinnedEvidencePackagePinsJson = JsonSerializer.Serialize(new[]
            {
                new PinnedEvidencePackageRow("azure-extractor", packageId, null)
            }),
        };
        Finding finding = new()
        {
            FindingId = "f1",
            Severity = FindingSeverity.Error,
            FindingType = "Test",
            Category = "Test",
            EngineType = "Test",
            Title = "Finding",
            Rationale = explicitReference
                ? $"evidencePackage:{packageId:D}"
                : $"Unrelated request id: {packageId:D}",
        };

        IReadOnlyList<string> reasons =
            FindingEvidenceReferentialIntegrityValidator.GetBlockingReasons(header, [finding]);

        if (explicitReference)
            Assert.Empty(reasons);
        else
            Assert.Single(reasons);
    }
}
