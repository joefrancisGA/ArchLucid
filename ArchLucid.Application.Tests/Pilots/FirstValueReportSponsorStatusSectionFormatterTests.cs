using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class FirstValueReportSponsorStatusSectionFormatterTests
{
    [Fact]
    public void AppendMarkdownSection_labels_missing_redaction_profile_and_finding_severity()
    {
        StringBuilder sb = new();
        ArchitectureRunDetail detail = new()
        {
            Results =
            [
                new AgentResult
                {
                    Findings =
                    [
                        new ArchitectureFinding
                        {
                            Message = "",
                            Category = "",
                            Severity = FindingSeverity.Info,
                        },
                    ],
                },
            ],
        };

        FirstValueReportSponsorStatusSectionFormatter.AppendMarkdownSection(
            sb,
            detail,
            SponsorSafeProofDisposition.NeedsOperatorReview,
            new ProofPackageCompletenessResponse
            {
                BuyerSafeRedactionProfile = "",
                AgentOutputPilotStrictEvidenceSatisfied = false,
            },
            new PilotRunDeltas(),
            new ArchitectureRun(),
            new SponsorRoiClaimDispositionResult(
                SponsorRoiClaimDisposition.Hold,
                PilotRoiEvidenceConfidence.Low,
                "",
                false,
                "Hold",
                "Hold narrative"));

        string markdown = sb.ToString();

        markdown.Should().Contain("redaction profile was not stored.");
        markdown.Should().Contain("Finding category was not stored.");
    }
}
