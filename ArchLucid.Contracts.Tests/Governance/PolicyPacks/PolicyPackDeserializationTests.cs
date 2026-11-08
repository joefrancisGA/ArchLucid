using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance.PolicyPacks;

[Trait("Category", "Unit")]
public sealed class PolicyPackDeserializationTests
{
    [Fact]
    public void Deserialize_null_status_yields_draft_not_null()
    {
        const string json = """
            {
              "policyPackId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              "tenantId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              "workspaceId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
              "projectId": "dddddddd-dddd-dddd-dddd-dddddddddddd",
              "name": "n",
              "description": "d",
              "status": null
            }
            """;

        PolicyPack? pack = JsonSerializer.Deserialize<PolicyPack>(json, ContractJson.CamelCaseCompact);

        pack.Should().NotBeNull();
        pack!.Status.Should().Be(PolicyPackStatus.Draft);
    }
}
