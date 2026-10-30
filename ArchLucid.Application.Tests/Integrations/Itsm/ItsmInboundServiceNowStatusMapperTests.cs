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

    [Fact]
    public void MapToHumanReview_treats_whole_number_float_string_states_like_integer_choice_list()
    {
        (string humanReview, bool mapped) = new ItsmInboundServiceNowStatusMapper()
            .MapToHumanReview("6.0", new IntegrationsItsmInboundOptions());

        mapped.Should().BeTrue();
        humanReview.Should().Be(nameof(FindingHumanReviewStatus.Approved));
    }

    [Fact]
    public void TryMapToDisposition_maps_whole_number_float_string_via_configured_state_key()
    {
        IntegrationsItsmInboundOptions options = new()
        {
            ServiceNowStateDispositionMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["6"] = nameof(FindingDisposition.Remediated),
            },
        };

        FindingDisposition? disposition = new ItsmInboundServiceNowStatusMapper()
            .TryMapToDisposition("6.0", options);

        disposition.Should().Be(FindingDisposition.Remediated);
    }
}
