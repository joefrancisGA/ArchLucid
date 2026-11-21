using ArchLucid.Application.Governance;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingEvidenceReferentialIntegrityValidatorTests
{
    [Fact]
    public void MissingPinJson_WithCommittedHash_BlocksValidation()
    {
        RunRecord header = new()
        {
            PinnedEvidencePackagePinsJson = null,
            PinnedEvidencePackagePinsHashSha256 = new byte[32],
        };

        IReadOnlyList<string> reasons = FindingEvidenceReferentialIntegrityValidator.GetBlockingReasons(
            header, []);

        Assert.Single(reasons);
        Assert.Contains("missing", reasons[0], StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void LegacyHeader_WithoutEvidencePinCommitment_DoesNotFailThisCheck()
    {
        RunRecord header = new()
        {
            PinnedEvidencePackagePinsJson = null,
            PinnedEvidencePackagePinsHashSha256 = null,
        };

        Assert.Empty(FindingEvidenceReferentialIntegrityValidator.GetBlockingReasons(header, []));
    }
}
