using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings.Payloads;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings.Payloads;

[Trait("Category", "Unit")]
public sealed class SecurityCoverageFindingPayloadDeserializationTests
{
    [Fact]
    public void Deserialize_null_unprotected_resources_yields_empty_list_not_null()
    {
        const string json = """
            {
              "securityNodeCount": 0,
              "protectedResourceCount": 0,
              "unprotectedResourceCount": 0,
              "unprotectedResources": null
            }
            """;

        SecurityCoverageFindingPayload? payload =
            JsonSerializer.Deserialize<SecurityCoverageFindingPayload>(json, ContractJson.CamelCaseCompact);

        payload.Should().NotBeNull();
        payload!.UnprotectedResources.Should().NotBeNull().And.BeEmpty();
    }
}
