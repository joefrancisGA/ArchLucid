using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SponsorFeasibilityHardCitationHonestyFormatterTests
{
    [Fact]
    public void RenderPlainTextLines_omits_uncited_hard_label()
    {
        FeasibilityVerdict verdict = new()
        {
            Kind = FeasibilityVerdictKind.HardInfeasible,
            Summary = "Cannot scale linearly",
            HardCitations = [],
        };

        IReadOnlyList<string> lines = SponsorFeasibilityHardCitationHonestyFormatter.RenderPlainTextLines(verdict);

        lines.Should().ContainSingle(line => line.Contains("withheld", StringComparison.OrdinalIgnoreCase));
        lines.Should().NotContain(line => line.Equals("Hard infeasible", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void RenderPlainTextLines_lists_cited_hard_references()
    {
        FeasibilityVerdict verdict = new()
        {
            Kind = FeasibilityVerdictKind.HardInfeasible,
            Summary = "CAP theorem",
            HardCitations =
            [
                new FeasibilityHardCitation { Kind = FeasibilityCitationKind.NamedLaw, Reference = "CAP partition tolerance" },
            ],
        };

        IReadOnlyList<string> lines = SponsorFeasibilityHardCitationHonestyFormatter.RenderPlainTextLines(verdict);

        lines.Should().Contain(line => line.Contains("CAP partition tolerance", StringComparison.Ordinal));
    }

    [Fact]
    public void FormatVerdictKindLabelForSponsor_demotes_uncited_hard()
    {
        FeasibilityVerdict verdict = new()
        {
            Kind = FeasibilityVerdictKind.HardInfeasible,
            Summary = "Missing citation",
        };

        string label = SponsorFeasibilityHardCitationHonestyFormatter.FormatVerdictKindLabelForSponsor(verdict);

        label.Should().Be("Infeasibility verdict needs citation");
    }
}
