using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Integrations.Itsm;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ItsmInboundJiraStatusMapperTests
{
    [Fact]
    public void MapToHumanReview_returns_unmapped_when_configured_enum_value_is_whitespace_only()
    {
        ItsmInboundJiraStatusMapper sut = new();
        IntegrationsItsmInboundOptions options = new()
        {
            JiraStatusHumanReviewMap = new Dictionary<string, string>
            {
                ["Custom"] = "   ",
            },
        };

        (string humanReview, bool mapped) = sut.MapToHumanReview("Custom", options);

        mapped.Should().BeFalse();
        humanReview.Should().BeEmpty("whitespace-only configured enum values are filtered before mapping");
    }
}
