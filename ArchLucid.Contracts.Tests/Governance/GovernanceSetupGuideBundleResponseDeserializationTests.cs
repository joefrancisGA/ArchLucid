using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class GovernanceSetupGuideBundleResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_alert_routing_subscriptions_yields_empty_list_not_null()
    {
        const string json = """
            {
              "effectivePolicyPacks": {},
              "alertRoutingSubscriptions": null
            }
            """;

        GovernanceSetupGuideBundleResponse response =
            JsonSerializer.Deserialize<GovernanceSetupGuideBundleResponse>(json, ContractJson.Default)!;

        response.AlertRoutingSubscriptions.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_effective_policy_packs_yields_non_null_set_not_null()
    {
        const string json = """
            {
              "effectivePolicyPacks": null
            }
            """;

        GovernanceSetupGuideBundleResponse? response =
            JsonSerializer.Deserialize<GovernanceSetupGuideBundleResponse>(json, ContractJson.Default);

        response.Should().NotBeNull();
        response!.EffectivePolicyPacks.Should().NotBeNull();
    }
}
