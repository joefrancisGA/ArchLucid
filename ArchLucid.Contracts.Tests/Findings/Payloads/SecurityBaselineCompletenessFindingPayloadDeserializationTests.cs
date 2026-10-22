using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings.Payloads;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings.Payloads;

[Trait("Category", "Unit")]
public sealed class SecurityBaselineCompletenessFindingPayloadDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "topologyNodeCount": 1,
              "securityNodeCount": 1,
              "expectedControlFamilies": null,
              "presentControlFamilies": null,
              "missingControlFamilies": null,
              "completenessMatrix": null
            }
            """;

        SecurityBaselineCompletenessFindingPayload? payload =
            JsonSerializer.Deserialize<SecurityBaselineCompletenessFindingPayload>(json, ContractJson.CamelCaseCompact);

        payload.Should().NotBeNull();
        payload!.ExpectedControlFamilies.Should().NotBeNull().And.BeEmpty();
        payload.PresentControlFamilies.Should().NotBeNull().And.BeEmpty();
        payload.MissingControlFamilies.Should().NotBeNull().And.BeEmpty();
        payload.CompletenessMatrix.Should().NotBeNull().And.BeEmpty();
    }
}
