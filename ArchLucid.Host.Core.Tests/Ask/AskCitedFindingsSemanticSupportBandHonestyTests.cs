using ArchLucid.Application.Ask;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.Ask;

[Trait("Category", "Unit")]
public sealed class AskCitedFindingsSemanticSupportBandHonestyTests
{
    [Fact]
    public void ResolveWeakestBand_prefers_unsupported_over_supported_and_unchecked()
    {
        FindingSemanticSupportBand? weakest = AskCitedFindingsSemanticSupportBandHonesty.ResolveWeakestBand(
        [
            FindingSemanticSupportBand.Supported,
            FindingSemanticSupportBand.Unchecked,
            FindingSemanticSupportBand.Unsupported,
        ]);

        weakest.Should().Be(FindingSemanticSupportBand.Unsupported);
    }

    [Fact]
    public void ResolveWeakestBandForFindingIds_matches_ids_case_insensitively()
    {
        IReadOnlyList<AskCitedFindingsSemanticSupportBandHonesty.FindingBandIndexEntry> index =
        [
            new("f-1", "Ingress open", FindingSemanticSupportBand.Supported),
            new("F-2", "Weak quote overlap", FindingSemanticSupportBand.Unsupported),
        ];

        FindingSemanticSupportBand? weakest =
            AskCitedFindingsSemanticSupportBandHonesty.ResolveWeakestBandForFindingIds(index, ["f-2", "f-1"]);

        weakest.Should().Be(FindingSemanticSupportBand.Unsupported);
    }

    [Fact]
    public void BuildDecisionGradeFindingBandIndex_skips_muted_and_checklist_coverage()
    {
        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            Findings =
            [
                new Finding
                {
                    FindingId = "dg-1",
                    Title = "Decision-grade row",
                    Classification = FindingClassification.DecisionGradeFinding,
                    SemanticSupportBand = FindingSemanticSupportBand.Unchecked,
                },
                new Finding
                {
                    FindingId = "muted-1",
                    Title = "Muted row",
                    Classification = FindingClassification.DecisionGradeFinding,
                    IsMuted = true,
                    SemanticSupportBand = FindingSemanticSupportBand.Unsupported,
                },
                new Finding
                {
                    FindingId = "chk-1",
                    Title = "Checklist row",
                    Classification = FindingClassification.ChecklistCoverage,
                    SemanticSupportBand = FindingSemanticSupportBand.Unsupported,
                },
            ],
        };

        IReadOnlyList<AskCitedFindingsSemanticSupportBandHonesty.FindingBandIndexEntry> index =
            AskCitedFindingsSemanticSupportBandHonesty.BuildDecisionGradeFindingBandIndex(snapshot);

        index.Should().ContainSingle();
        index[0].FindingId.Should().Be("dg-1");
        index[0].Band.Should().Be(FindingSemanticSupportBand.Unchecked);
    }

    [Fact]
    public void BuildPromptConstraintSection_includes_honesty_copy_and_index_rows()
    {
        string section = AskCitedFindingsSemanticSupportBandHonesty.BuildPromptConstraintSection(
        [
            new("f-1", "Public database ingress", FindingSemanticSupportBand.Unsupported),
        ]);

        section.Should().Contain(AskCitedFindingsSemanticSupportBandHonesty.PromptConstraintPrefix);
        section.Should().Contain("f-1: Unsupported");
        section.Should().Contain("TB-1003");
        section.Should().Contain("must not sound more certain");
    }

    [Fact]
    public void FormatWeakestBandFootnote_returns_null_when_no_band()
    {
        AskCitedFindingsSemanticSupportBandHonesty.FormatWeakestBandFootnote(null).Should().BeNull();
    }

    [Fact]
    public void FormatWeakestBandFootnote_states_weakest_band_and_not_sealed_record()
    {
        string? footnote = AskCitedFindingsSemanticSupportBandHonesty.FormatWeakestBandFootnote(
            FindingSemanticSupportBand.Unsupported);

        footnote.Should().Contain("Unsupported");
        footnote.Should().Contain("TB-1003");
    }
}
