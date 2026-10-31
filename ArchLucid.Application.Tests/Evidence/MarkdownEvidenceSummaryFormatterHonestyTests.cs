using ArchLucid.Application.Evidence;
using ArchLucid.Contracts.Agents;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Evidence;

[Trait("Category", "Unit")]
public sealed class MarkdownEvidenceSummaryFormatterHonestyTests
{
    [Fact]
    public void FormatMarkdown_blank_request_identity_fields_use_not_stored_sentences()
    {
        MarkdownEvidenceSummaryFormatter sut = new();
        AgentEvidencePackage evidence = new()
        {
            SystemName = "  ",
            Environment = "",
            CloudProvider = "",
            Request = new RequestEvidence { Description = "\t" },
        };

        string markdown = sut.FormatMarkdown(evidence);

        markdown.Should().Contain($"System Name: {MarkdownEvidenceSummaryExportHonesty.SystemNameNotStored}");
        markdown.Should().Contain($"Environment: {MarkdownEvidenceSummaryExportHonesty.EnvironmentNotStored}");
        markdown.Should().Contain($"Cloud Provider: {MarkdownEvidenceSummaryExportHonesty.CloudProviderNotStored}");
        markdown.Should().Contain($"Description: {MarkdownEvidenceSummaryExportHonesty.DescriptionNotStored}");
    }

    [Fact]
    public void FormatMarkdown_nested_policy_and_pattern_fields_emit_not_stored_when_empty()
    {
        MarkdownEvidenceSummaryFormatter sut = new();
        AgentEvidencePackage evidence = new()
        {
            SystemName = "Sys",
            Environment = "prod",
            CloudProvider = "Azure",
            Request = new RequestEvidence { Description = "desc" },
            Policies =
            [
                new PolicyEvidence
                {
                    Title = "",
                    PolicyId = " ",
                    Summary = "",
                },
            ],
            Patterns =
            [
                new PatternEvidence
                {
                    Name = " ",
                    PatternId = "",
                    Summary = "",
                },
            ],
            Notes = [new EvidenceNote { NoteType = "", Message = "" }],
        };

        string markdown = sut.FormatMarkdown(evidence);

        markdown.Should().Contain(MarkdownEvidenceSummaryExportHonesty.PolicyTitleNotStored);
        markdown.Should().Contain(MarkdownEvidenceSummaryExportHonesty.RequiredControlsNotStored);
        markdown.Should().Contain(MarkdownEvidenceSummaryExportHonesty.ApplicableCapabilitiesNotStored);
        markdown.Should().Contain(MarkdownEvidenceSummaryExportHonesty.NoteMessageNotStored);
    }
}
