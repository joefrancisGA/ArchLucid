using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackSponsorFeasibilityHardCitationPlainTextTests
{
    [Fact]
    public void RenderPlainTextLines_when_hard_citation_reference_contains_pipe_quotes_reference()
    {
        FeasibilityVerdict verdict = new()
        {
            Kind = FeasibilityVerdictKind.HardInfeasible,
            Summary = "CAP theorem",
            HardCitations =
            [
                new FeasibilityHardCitation
                {
                    Kind = FeasibilityCitationKind.NamedLaw,
                    Reference = "Law|CAP",
                },
            ],
        };

        IReadOnlyList<string> lines = SponsorFeasibilityHardCitationHonestyFormatter.RenderPlainTextLines(verdict);

        lines.Should().Contain("- NamedLaw: 'Law|CAP'");
    }

    [Fact]
    public void RenderPlainTextLines_when_soft_envelope_description_contains_comma_quotes_description()
    {
        FeasibilityVerdict verdict = new()
        {
            Kind = FeasibilityVerdictKind.SoftInfeasible,
            SoftEnvelope = new SoftInfeasibilityEnvelope
            {
                EnvelopeDescription = "Holds below 500 users, single region only.",
            },
        };

        IReadOnlyList<string> lines = SponsorFeasibilityHardCitationHonestyFormatter.RenderPlainTextLines(verdict);

        lines.Should().Contain("Envelope: 'Holds below 500 users, single region only.'");
    }
}
