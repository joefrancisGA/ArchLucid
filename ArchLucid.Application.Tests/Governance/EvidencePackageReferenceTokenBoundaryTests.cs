using System.Text.Json;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class EvidencePackageReferenceTokenBoundaryTests
{
    [Theory]
    [InlineData("evidencePackage:{0}", true)]
    [InlineData("prefix evidencePackage:{0} suffix", true)]
    [InlineData("notEvidencePackage:{0}", false)]
    [InlineData("evidencePackage:{0}extra", false)]
    [InlineData("evidencePackage:{0}-suffix", false)]
    public void FreeTextReference_RequiresCompleteToken(string template, bool expectedValid)
    {
        Guid id = Guid.Parse("12345678-1234-1234-1234-123456789abc");
        RunRecord header = new()
        {
            PinnedEvidencePackagePinsJson = JsonSerializer.Serialize(new[]
            {
                new PinnedEvidencePackageRow("azure-extractor", id, null)
            })
        };
        Finding finding = new()
        {
            FindingId = "test",
            FindingType = "Test",
            Category = "Test",
            EngineType = "Test",
            Title = "Reference boundary",
            Rationale = string.Format(template, id.ToString("D")),
            Severity = FindingSeverity.Error
        };

        bool valid = FindingEvidenceReferentialIntegrityValidator.GetBlockingReasons(header, [finding]).Count == 0;
        Assert.Equal(expectedValid, valid);
    }
}
