using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings.Payloads;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings.Payloads;

[Trait("Category", "Unit")]
public sealed class PolicyApplicabilityFindingPayloadDeserializationTests
{
    [Fact]
    public void Deserialize_null_applicable_topology_node_ids_yields_empty_list_not_null()
    {
        const string json = """
            {
              "policyName": "p",
              "applicableTopologyResourceCount": 0,
              "applicableTopologyNodeIds": null
            }
            """;

        PolicyApplicabilityFindingPayload? payload =
            JsonSerializer.Deserialize<PolicyApplicabilityFindingPayload>(json, ContractJson.CamelCaseCompact);

        payload.Should().NotBeNull();
        payload!.ApplicableTopologyNodeIds.Should().NotBeNull().And.BeEmpty();
    }
}
