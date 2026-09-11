using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class DefenderSnapshotContextResolverTests
{
    [Fact]
    public void ResolveSubscriptionBand_matches_subscription_resource_id()
    {
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SubscriptionId = "11111111-1111-1111-1111-111111111111",
            },
            DefenderSummaries =
            [
                new AzureInventoryDefenderSummaryReadModel
                {
                    ResourceId = "/subscriptions/11111111-1111-1111-1111-111111111111",
                    SecureScore = 35,
                },
            ],
        };

        DefenderSnapshotContextResolver.ResolveSubscriptionBand(snapshot)
            .Should()
            .Be(DefenderSecureScoreOrdinalBand.Low);
    }

    [Fact]
    public void ResolveSubscriptionBand_returns_unknown_when_companion_missing()
    {
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SubscriptionId = "11111111-1111-1111-1111-111111111111",
            },
        };

        DefenderSnapshotContextResolver.ResolveSubscriptionBand(snapshot)
            .Should()
            .Be(DefenderSecureScoreOrdinalBand.Unknown);
    }
}
