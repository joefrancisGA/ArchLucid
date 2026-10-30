using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackProofPackageContractMarkdownTests
{
    [Fact]
    public void Proof_package_section_when_sendability_contains_pipe_escapes_table_cell()
    {
        StringBuilder sb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            sb,
            new PilotRunDeltas(),
            new ProofPackageCompletenessResponse
            {
                ProofSendability = "Send|able",
                PublishingTier = "Partial",
                EvidenceCompleteness = "Strong",
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Proof sendability (API mirror) |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Be("| Proof sendability (API mirror) | `Send\\|able` · `Partial` · **Strong** |");
    }
}
