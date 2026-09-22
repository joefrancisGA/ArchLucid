using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public static class DefenderSnapshotContextResolver
{
    public static DefenderSecureScoreOrdinalBand ResolveSubscriptionBand(
        AzureInventorySnapshotDetailReadModel snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        string? subscriptionId = snapshot.Header.SubscriptionId;

        if (string.IsNullOrWhiteSpace(subscriptionId))
        {
            return DefenderSecureScoreOrdinalBand.Unknown;
        }

        if (snapshot.DefenderSummaries.Count == 0)
        {
            return DefenderSecureScoreOrdinalBand.Unknown;
        }

        string subscriptionResourceId = ArmResourceIdNormalizer.Normalize(
            $"/subscriptions/{subscriptionId.Trim()}");

        AzureInventoryDefenderSummaryReadModel? match = snapshot.DefenderSummaries
            .FirstOrDefault(row =>
                ArmResourceIdNormalizer.Normalize(row.ResourceId)
                    .Equals(subscriptionResourceId, StringComparison.OrdinalIgnoreCase));

        if (match is null)
        {
            return DefenderSecureScoreOrdinalBand.Unknown;
        }

        return DefenderSecureScoreOrdinalBandMapper.FromSecureScorePercent(match.SecureScore);
    }
}
