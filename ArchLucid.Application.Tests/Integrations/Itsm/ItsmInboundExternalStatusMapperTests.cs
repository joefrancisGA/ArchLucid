using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Integrations.Itsm;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ItsmInboundExternalStatusMapperTests
{
    [Fact]
    public void TryMapJiraStatusToDisposition_uses_configured_map_case_insensitively()
    {
        IntegrationsItsmInboundOptions options = new()
        {
            JiraStatusDispositionMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["done"] = nameof(FindingDisposition.Remediated)
            }
        };

        FindingDisposition? disposition = ItsmInboundExternalStatusMapper.TryMapJiraStatusToDisposition("Done", options);

        disposition.Should().Be(FindingDisposition.Remediated);
    }

    [Fact]
    public void TryMapJiraStatusToDisposition_returns_null_when_unmapped()
    {
        IntegrationsItsmInboundOptions options = new();

        FindingDisposition? disposition = ItsmInboundExternalStatusMapper.TryMapJiraStatusToDisposition("Done", options);

        disposition.Should().BeNull();
    }

    [Fact]
    public void TryMapServiceNowStateToDisposition_ignores_invalid_enum_values()
    {
        IntegrationsItsmInboundOptions options = new()
        {
            ServiceNowStateDispositionMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["6"] = "NotARealDisposition"
            }
        };

        FindingDisposition? disposition = ItsmInboundExternalStatusMapper.TryMapServiceNowStateToDisposition("6", options);

        disposition.Should().BeNull();
    }
}
