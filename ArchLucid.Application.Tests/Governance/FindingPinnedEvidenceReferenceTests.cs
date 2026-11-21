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
    public void UnlabelledGuidInFindingText_DoesNotCountAsPinnedEvidence(bool useRelatedNodeId)
    {
        Guid id = Guid.NewGuid();
        RunRecord header = HeaderWithPinnedPackage(id);
        Finding finding = FindingWithReference(id.ToString("D"), useRelatedNodeId);

        IReadOnlyList<string> reasons = FindingEvidenceReferentialIntegrityValidator.GetBlockingReasons(
            header, [finding]);

        Assert.Single(reasons);
    }

    [Fact]
    public void ExplicitEvidencePackageReference_ResolvesPinnedPackage()
    {
        Guid id = Guid.NewGuid();
        Finding finding = FindingWithReference($"evidencePackage:{id:D}", false);

        Assert.Empty(FindingEvidenceReferentialIntegrityValidator.GetBlockingReasons(
            HeaderWithPinnedPackage(id), [finding]));
    }

    [Fact]
    public void TypedEvidencePackageId_ResolvesPinnedPackage()
    {
        Guid id = Guid.NewGuid();
        Finding finding = FindingWithReference("unrelated text", false);
        finding.EvidencePackageId = id;

        Assert.Empty(FindingEvidenceReferentialIntegrityValidator.GetBlockingReasons(
            HeaderWithPinnedPackage(id), [finding]));
    }

    private static RunRecord HeaderWithPinnedPackage(Guid id) => new()
    {
        PinnedEvidencePackagePinsJson = JsonSerializer.Serialize(new[]
        {
            new PinnedEvidencePackageRow("azure-extractor", id, null)
        }),
    };

    private static Finding FindingWithReference(string reference, bool useRelatedNodeId)
    {
        Finding finding = new()
        {
            FindingId = "test-finding",
            Severity = FindingSeverity.Error,
            FindingType = "Test",
            Category = "Test",
            EngineType = "Test",
            Title = "Evidence linkage regression",
            Rationale = useRelatedNodeId ? "unrelated" : reference,
        };
        if (useRelatedNodeId)
            finding.RelatedNodeIds.Add(reference);
        return finding;
    }
}
