using System.Text;

using ArchLucid.Application.Runs;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Persistence.DecisionTraces;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class FirstValueReportMissingValueFormatterTests
{
    [Fact]
    public void AppendComputedDeltasSection_labels_missing_commit_duration_as_not_stored()
    {
        StringBuilder markdown = new();
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(
            markdown,
            new PilotRunDeltas
            {
                TimeToCommittedManifest = null,
                FindingsBySeverity = [],
            });

        markdown.ToString().Should().Contain("Time to committed manifest was not stored.");
        markdown.ToString().Should().NotContain("pending");
    }

    [Fact]
    public void AppendEvidenceChainSection_labels_missing_severity_and_manifest_version()
    {
        StringBuilder markdown = new();
        FirstValueReportTraceSectionFormatter.AppendEvidenceChainSection(
            markdown,
            new PilotRunDeltas
            {
                TopFindingId = "f-1",
                TopFindingSeverity = null,
                TopFindingEvidenceChain = new FindingEvidenceChainResponse
                {
                    ManifestVersion = null,
                },
            });

        string text = markdown.ToString();
        text.Should().Contain("Severity was not stored.");
        text.Should().NotContain("`Unknown`");
        text.Should().Contain("Manifest version was not stored.");
        text.Should().NotContain("(none)");
    }

    [Fact]
    public void AppendComputedDeltasSection_labels_unresolved_audit_row_count_as_not_attested()
    {
        StringBuilder markdown = new();
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(
            markdown,
            new PilotRunDeltas
            {
                AuditRowCount = 0,
                AuditRowCountResolved = false,
                FindingsBySeverity = [],
            });

        markdown.ToString().Should().Contain("Audit row count was not attested.");
    }

    [Fact]
    public void AppendDecisionTraceSection_labels_missing_rule_audit_fields()
    {
        StringBuilder markdown = new();
        FirstValueReportTraceSectionFormatter.AppendDecisionTraceSection(
            markdown,
            new ArchitectureRunDetail
            {
                Run = new ArchitectureRun { RunId = "run-1" },
                DecisionTraces =
                [
                    new RuleAuditTraceDto
                    {
                        RuleAudit = new RuleAuditTracePayload
                        {
                            RuleSetId = string.Empty,
                            RuleSetVersion = " ",
                        },
                    },
                ],
            },
            "run-1",
            "https://app.example");

        string text = markdown.ToString();
        text.Should().Contain("Rule set id was not stored.");
        text.Should().Contain("Rule set version was not stored.");
    }

    [Fact]
    public void AppendMarkdownSection_labels_missing_manifest_as_not_stored()
    {
        StringBuilder markdown = new();
        FirstValueReportRunSectionFormatter.AppendMarkdownSection(
            markdown,
            new ArchitectureRun
            {
                RunId = "run-1",
                Status = ArchitectureRunStatus.Created,
                RequestId = "request-1",
                CreatedUtc = DateTime.UtcNow,
            },
            null,
            "https://app.example");

        markdown.ToString().Should().Contain("Committed manifest was not stored.");
    }
}
