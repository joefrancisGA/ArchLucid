using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class FirstValueReportProofPackageSectionFormatterTests
{
    [Fact]
    public void AppendMarkdownSection_when_redaction_profile_contains_pipe_escapes_table_cell()
    {
        StringBuilder sb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            sb,
            new PilotRunDeltas(),
            new ProofPackageCompletenessResponse
            {
                BuyerSafeRedactionProfile = "tenant|segmented",
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("Buyer-safe redaction profile", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Be("| Buyer-safe redaction profile | tenant\\|segmented |");
    }
}
