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

    public static DefenderHopPostureEvidence BuildHopPosture(
        AzureInventoryDefenderBandContextReadModel context,
        DefenderSecureScoreOrdinalBand subscriptionBand)
    {
        ArgumentNullException.ThrowIfNull(context);

        Dictionary<string, Guid> cloudResourceIdByArmId = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryDefenderResourceRefReadModel resource in context.Resources)
        {
            if (resource.CloudResourceId == Guid.Empty || string.IsNullOrWhiteSpace(resource.AzureResourceId))
            {
                continue;
            }

            cloudResourceIdByArmId[ArmResourceIdNormalizer.Normalize(resource.AzureResourceId)] = resource.CloudResourceId;
        }

        HashSet<Guid> highCloudResourceIds = [];
        HashSet<Guid> mediumCloudResourceIds = [];

        foreach (AzureInventoryDefenderAssessmentReadModel assessment in context.DefenderAssessments)
        {
            if (!string.Equals(assessment.Status, "Unhealthy", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!cloudResourceIdByArmId.TryGetValue(
                    ArmResourceIdNormalizer.Normalize(assessment.ResourceId),
                    out Guid cloudResourceId))
            {
                continue;
            }

            if (string.Equals(assessment.Severity, "High", StringComparison.OrdinalIgnoreCase))
            {
                highCloudResourceIds.Add(cloudResourceId);
            }
            else if (string.Equals(assessment.Severity, "Medium", StringComparison.OrdinalIgnoreCase))
            {
                mediumCloudResourceIds.Add(cloudResourceId);
            }
        }

        mediumCloudResourceIds.ExceptWith(highCloudResourceIds);

        IReadOnlyList<string> weakControlNames = [];

        if (subscriptionBand is DefenderSecureScoreOrdinalBand.Low or DefenderSecureScoreOrdinalBand.Medium)
        {
            weakControlNames = context.DefenderScoreControls
                .Where(control => control.MaxScore > 0)
                .OrderByDescending(control => control.MaxScore - control.CurrentScore)
                .ThenBy(control => control.ControlName, StringComparer.OrdinalIgnoreCase)
                .Take(3)
                .Select(control => control.ControlName)
                .ToArray();
        }

        return new DefenderHopPostureEvidence
        {
            HighAssessmentCloudResourceIds = highCloudResourceIds,
            MediumAssessmentCloudResourceIds = mediumCloudResourceIds,
            WeakControlNames = weakControlNames,
        };
    }
}
