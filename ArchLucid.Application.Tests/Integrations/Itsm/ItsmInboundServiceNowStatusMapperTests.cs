using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Integrations.Itsm;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ItsmInboundServiceNowStatusMapperTests
{
    [Fact]
    public void MapToHumanReview_treats_leading_zero_numeric_states_via_integer_parse()
    {
        (string humanReview, bool mapped) = new ItsmInboundServiceNowStatusMapper()
            .MapToHumanReview("06", new IntegrationsItsmInboundOptions());

        mapped.Should().BeTrue();
        humanReview.Should().Be(nameof(FindingHumanReviewStatus.Approved));
    }
}
