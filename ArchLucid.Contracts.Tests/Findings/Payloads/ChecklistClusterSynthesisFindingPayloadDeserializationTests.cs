using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings.Payloads;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings.Payloads;

[Trait("Category", "Unit")]
public sealed class ChecklistClusterSynthesisFindingPayloadDeserializationTests
{
    [Fact]
    public void Deserialize_null_member_finding_ids_yields_empty_list_not_null()
    {
        const string json = """
            {
              "memberFindingIds": null,
              "clusterKey": "k",
              "memberCount": 0
            }
            """;

        ChecklistClusterSynthesisFindingPayload? payload =
            JsonSerializer.Deserialize<ChecklistClusterSynthesisFindingPayload>(json, ContractJson.CamelCaseCompact);

        payload.Should().NotBeNull();
        payload!.MemberFindingIds.Should().NotBeNull().And.BeEmpty();
    }
}
