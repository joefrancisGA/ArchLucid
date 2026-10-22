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

        HashSet<Guid> highAlertCloudResourceIds = [];

        foreach (AzureInventoryDefenderAlertReadModel alert in context.DefenderAlerts)
        {
            if (alert.Status is not ("Active" or "InProgress")
                || !string.Equals(alert.Severity, "High", StringComparison.OrdinalIgnoreCase)
                || !cloudResourceIdByArmId.TryGetValue(ArmResourceIdNormalizer.Normalize(alert.ResourceId), out Guid cloudResourceId))
            {
                continue;
            }

            highAlertCloudResourceIds.Add(cloudResourceId);
        }

        Dictionary<Guid, string> attackPathCitations = [];

        foreach (AzureInventoryDefenderAttackPathReadModel attackPath in context.DefenderAttackPaths)
        {
            string citation = string.Join(
                ' ',
                new[] { attackPath.AttackPathId, attackPath.RiskLevel }.Where(static part => !string.IsNullOrWhiteSpace(part)));

            if (citation.Length == 0)
            {
                continue;
            }

            foreach (string resourceId in SplitResourceIds(attackPath.EntryResourceIds).Concat(SplitResourceIds(attackPath.TargetResourceIds)))
            {
                if (!cloudResourceIdByArmId.TryGetValue(resourceId, out Guid cloudResourceId))
                {
                    continue;
                }

                if (attackPathCitations.TryGetValue(cloudResourceId, out string? existing)
                    && existing.Contains(citation, StringComparison.Ordinal))
                {
                    continue;
                }

                attackPathCitations[cloudResourceId] = existing is null ? citation : existing + "; " + citation;
            }
        }

        Dictionary<Guid, int> vulnerabilityCounts = [];

        foreach (AzureInventoryDefenderVulnerabilityCountReadModel count in context.DefenderVulnerabilityCounts)
        {
            int criticalOrHigh = count.CriticalCount + count.HighCount;

            if (criticalOrHigh <= 0
                || !cloudResourceIdByArmId.TryGetValue(ArmResourceIdNormalizer.Normalize(count.ResourceId), out Guid cloudResourceId))
            {
                continue;
            }

            vulnerabilityCounts[cloudResourceId] = vulnerabilityCounts.GetValueOrDefault(cloudResourceId) + criticalOrHigh;
        }

        Dictionary<Guid, string> governanceDue = [];
        DateTime dueCutoffUtc = TimeProvider.System.UtcNowDateTime().AddDays(30);
        HashSet<string> unhealthyAssessmentKeys = context.DefenderAssessments
            .Where(static assessment => string.Equals(assessment.Status, "Unhealthy", StringComparison.OrdinalIgnoreCase))
            .Select(static assessment => ArmResourceIdNormalizer.Normalize(assessment.ResourceId) + "|" + assessment.AssessmentKey.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryDefenderGovernanceAssignmentReadModel assignment in context.DefenderGovernanceAssignments)
        {
            if (assignment.RemediationDueUtc is not DateTime dueUtc || dueUtc > dueCutoffUtc)
            {
                continue;
            }

            string resourceId = ArmResourceIdNormalizer.Normalize(assignment.ResourceId);

            if (!unhealthyAssessmentKeys.Contains(resourceId + "|" + assignment.AssessmentKey.Trim())
                || !cloudResourceIdByArmId.TryGetValue(resourceId, out Guid cloudResourceId))
            {
                continue;
            }

            string note = assignment.AssessmentKey.Trim() + " " + DateTime.SpecifyKind(dueUtc, DateTimeKind.Utc).ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture);
            governanceDue[cloudResourceId] = governanceDue.TryGetValue(cloudResourceId, out string? existing)
                ? existing + "; " + note
                : note;
        }

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
            HighAlertCloudResourceIds = highAlertCloudResourceIds,
            WeakControlNames = weakControlNames,
            AttackPathCitationByCloudResourceId = attackPathCitations,
            CriticalOrHighVulnerabilityCountByCloudResourceId = vulnerabilityCounts,
            GovernanceDueByCloudResourceId = governanceDue,
        };
    }

    private static IEnumerable<string> SplitResourceIds(string? resourceIds) =>
        (resourceIds ?? string.Empty)
            .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(ArmResourceIdNormalizer.Normalize)
            .Where(static resourceId => resourceId.Length > 0);
}
