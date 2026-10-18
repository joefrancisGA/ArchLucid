using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public static class DefenderBandContextResolver
{
    public static DefenderSecureScoreOrdinalBand ResolveSubscriptionBand(
        AzureInventoryDefenderBandContextReadModel context)
    {
        ArgumentNullException.ThrowIfNull(context);

        string? subscriptionId = context.SubscriptionId;

        if (string.IsNullOrWhiteSpace(subscriptionId))
        {
            return DefenderSecureScoreOrdinalBand.Unknown;
        }

        if (context.DefenderSummaries.Count == 0)
        {
            return DefenderSecureScoreOrdinalBand.Unknown;
        }

        string subscriptionResourceId = ArmResourceIdNormalizer.Normalize(
            $"/subscriptions/{subscriptionId.Trim()}");

        AzureInventoryDefenderSummaryReadModel? match = context.DefenderSummaries
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
