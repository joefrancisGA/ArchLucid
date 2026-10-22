using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings.Payloads;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings.Payloads;

[Trait("Category", "Unit")]
public sealed class DecisionGradeFusionFindingPayloadDeserializationTests
{
    [Fact]
    public void Deserialize_null_member_lists_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "constituentFindingIds": null,
              "sharedNodeIds": null,
              "sourceEngineTypes": null
            }
            """;

        DecisionGradeFusionFindingPayload? payload =
            JsonSerializer.Deserialize<DecisionGradeFusionFindingPayload>(json, ContractJson.CamelCaseCompact);

        payload.Should().NotBeNull();
        payload!.ConstituentFindingIds.Should().NotBeNull().And.BeEmpty();
        payload.SharedNodeIds.Should().NotBeNull().And.BeEmpty();
        payload.SourceEngineTypes.Should().NotBeNull().And.BeEmpty();
    }
}
