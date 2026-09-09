using System.Text;

using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
public sealed class OpenQuestionsExportHonestyTests
{
    [Fact]
    public void SanitizeAssertedForCareerExport_moves_open_questions_to_working_document_bucket()
    {
        List<AssertedTrailEntry> asserted =
        [
            new AssertedTrailEntry { Key = "businessOutcome", Value = "Reduce triage time" },
            new AssertedTrailEntry { Key = "openQuestions", Value = "Who owns retention policy?" },
        ];

        (IReadOnlyList<AssertedTrailEntry> sealedAsserted, IReadOnlyList<OpenQuestionsWorkingDocumentExportEntry> workingDocumentOpenQuestions) =
            OpenQuestionsExportHonesty.SanitizeAssertedForCareerExport(asserted);

        sealedAsserted.Should().ContainSingle(entry => entry.Key == "businessOutcome");
        workingDocumentOpenQuestions.Should().ContainSingle(entry =>
            entry.Key == "openQuestions" && entry.Value == "Who owns retention policy?");
    }

    [Fact]
    public void AppendWorkingDocumentMarkdownSection_labels_open_questions_as_not_sealed()
    {
        StringBuilder sb = new();

        OpenQuestionsExportHonesty.AppendWorkingDocumentMarkdownSection(
            sb,
            [new OpenQuestionsWorkingDocumentExportEntry { Key = "openQuestions", Value = "Who owns retention policy?" }]);

        string markdown = sb.ToString();

        markdown.Should().Contain(OpenQuestionsExportHonesty.WorkingDocumentExportHeading);
        markdown.Should().Contain(OpenQuestionsExportHonesty.WorkingDocumentHonestyLabel);
        markdown.Should().Contain("Who owns retention policy?");
    }

    [Fact]
    public void TransparencyTrailMarkdownFormatter_routes_open_questions_out_of_asserted_section()
    {
        TransparencyTrail trail = new()
        {
            Asserted =
            [
                new AssertedTrailEntry { Key = "businessOutcome", Value = "Reduce triage time" },
                new AssertedTrailEntry { Key = "open-questions", Value = "Who owns failover approvals?" },
            ],
            Inferred = [],
            Skipped = [],
        };

        StringBuilder sb = new();
        TransparencyTrailMarkdownFormatter.AppendMarkdownSection(sb, trail);
        string markdown = sb.ToString();

        markdown.Should().Contain("### Asserted (1)");
        string assertedSection = markdown.Split("### Inferred", StringSplitOptions.None)[0];
        assertedSection.Should().NotContain("open-questions:");
        markdown.Should().Contain(OpenQuestionsExportHonesty.WorkingDocumentExportHeading);
        markdown.Should().Contain("open-questions: Who owns failover approvals?");
    }
}
