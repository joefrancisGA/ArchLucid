using System.Globalization;
using System.Text.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public static class DefenderFollowOnMaterializer
{
    public static IReadOnlyList<AzureInventoryDefenderGovernanceAssignmentWrite> MaterializeGovernance(IReadOnlyList<JsonElement> rows) =>
        Materialize(rows, TryReadGovernance);

    public static IReadOnlyList<AzureInventoryDefenderComplianceStandardWrite> MaterializeComplianceStandards(IReadOnlyList<JsonElement> rows) =>
        Materialize(rows, TryReadComplianceStandard);

    public static IReadOnlyList<AzureInventoryDefenderComplianceControlWrite> MaterializeComplianceControls(IReadOnlyList<JsonElement> rows) =>
        Materialize(rows, TryReadComplianceControl);

    public static IReadOnlyList<AzureInventoryDefenderAlertWrite> MaterializeAlerts(IReadOnlyList<JsonElement> rows) =>
        Materialize(rows, TryReadAlert);

    public static IReadOnlyList<AzureInventoryDefenderAttackPathWrite> MaterializeAttackPaths(IReadOnlyList<JsonElement> rows) =>
        Materialize(rows, TryReadAttackPath);

    public static IReadOnlyList<AzureInventoryDefenderVulnerabilityCountWrite> MaterializeVulnerabilityCounts(IReadOnlyList<JsonElement> rows) =>
        Materialize(rows, TryReadVulnerabilityCount);

    public static IReadOnlyList<AzureInventoryDefenderVulnerabilityFindingWrite> MaterializeVulnerabilityFindings(IReadOnlyList<JsonElement> rows) =>
        Materialize(rows, TryReadVulnerabilityFinding);

    private static IReadOnlyList<T> Materialize<T>(IReadOnlyList<JsonElement> rows, Func<JsonElement, T?> read)
        where T : class
    {
        ArgumentNullException.ThrowIfNull(rows);
        List<T> materialized = [];

        foreach (JsonElement element in rows)
        {
            if (element.ValueKind != JsonValueKind.Object)
            {
                continue;
            }

            T? row = read(element);

            if (row is not null)
            {
                materialized.Add(row);
            }
        }

        return materialized;
    }

    private static AzureInventoryDefenderGovernanceAssignmentWrite? TryReadGovernance(JsonElement element)
    {
        string subscriptionId = ReadString(element, "subscriptionId");
        string assessmentKey = ReadString(element, "assessmentKey");
        string resourceId = ReadString(element, "resourceId");

        if (subscriptionId.Length == 0 || assessmentKey.Length == 0 || resourceId.Length == 0)
        {
            return null;
        }

        string owner = ReadString(element, "owner");

        return new AzureInventoryDefenderGovernanceAssignmentWrite
        {
            SubscriptionId = subscriptionId,
            AssessmentKey = assessmentKey,
            ResourceId = ArmResourceIdNormalizer.Normalize(resourceId),
            Owner = owner.Length == 0 ? null : owner,
            RemediationDueUtc = ReadUtc(element, "remediationDueUtc"),
            IsGracePeriod = ReadBool(element, "isGracePeriod"),
            AssignmentStatus = ReadString(element, "assignmentStatus"),
            SourceEvidenceReference = AzureExtractorPackageZipEntryNames.DefenderGovernance,
        };
    }

    private static AzureInventoryDefenderComplianceStandardWrite? TryReadComplianceStandard(JsonElement element)
    {
        string subscriptionId = ReadString(element, "subscriptionId");
        string standardName = ReadString(element, "standardName");

        if (subscriptionId.Length == 0 || standardName.Length == 0)
        {
            return null;
        }

        return new AzureInventoryDefenderComplianceStandardWrite
        {
            SubscriptionId = subscriptionId,
            StandardName = standardName,
            State = ReadString(element, "state"),
            PassedControlCount = ReadInt(element, "passedControlCount"),
            FailedControlCount = ReadInt(element, "failedControlCount"),
            SkippedControlCount = ReadInt(element, "skippedControlCount"),
            SourceEvidenceReference = AzureExtractorPackageZipEntryNames.DefenderComplianceStandards,
        };
    }

    private static AzureInventoryDefenderComplianceControlWrite? TryReadComplianceControl(JsonElement element)
    {
        string subscriptionId = ReadString(element, "subscriptionId");
        string standardName = ReadString(element, "standardName");
        string controlName = ReadString(element, "controlName");

        if (subscriptionId.Length == 0 || standardName.Length == 0 || controlName.Length == 0)
        {
            return null;
        }

        return new AzureInventoryDefenderComplianceControlWrite
        {
            SubscriptionId = subscriptionId,
            StandardName = standardName,
            ControlName = controlName,
            State = "Failed",
            FailedAssessmentCount = ReadInt(element, "failedAssessmentCount"),
            SourceEvidenceReference = AzureExtractorPackageZipEntryNames.DefenderComplianceControls,
        };
    }

    private static AzureInventoryDefenderAlertWrite? TryReadAlert(JsonElement element)
    {
        string subscriptionId = ReadString(element, "subscriptionId");
        string alertId = ReadString(element, "alertId");

        if (subscriptionId.Length == 0 || alertId.Length == 0)
        {
            return null;
        }

        return new AzureInventoryDefenderAlertWrite
        {
            SubscriptionId = subscriptionId,
            AlertId = alertId,
            DisplayName = ReadString(element, "displayName"),
            Severity = ReadString(element, "severity"),
            Status = ReadString(element, "status"),
            Intent = ReadString(element, "intent"),
            AlertType = ReadString(element, "alertType"),
            StartTimeUtc = ReadUtc(element, "startTimeUtc"),
            ResourceId = NormalizeOptional(ReadString(element, "resourceId")),
            SourceEvidenceReference = AzureExtractorPackageZipEntryNames.DefenderAlerts,
        };
    }

    private static AzureInventoryDefenderAttackPathWrite? TryReadAttackPath(JsonElement element)
    {
        string subscriptionId = ReadString(element, "subscriptionId");
        string attackPathId = ReadString(element, "attackPathId");
        string entryResourceIds = ReadString(element, "entryResourceIds");
        string targetResourceIds = ReadString(element, "targetResourceIds");

        if (subscriptionId.Length == 0 || attackPathId.Length == 0 || (entryResourceIds.Length == 0 && targetResourceIds.Length == 0))
        {
            return null;
        }

        return new AzureInventoryDefenderAttackPathWrite
        {
            SubscriptionId = subscriptionId,
            AttackPathId = attackPathId,
            DisplayName = ReadString(element, "displayName"),
            RiskLevel = ReadString(element, "riskLevel"),
            EntryResourceIds = entryResourceIds,
            TargetResourceIds = targetResourceIds,
            SourceEvidenceReference = AzureExtractorPackageZipEntryNames.DefenderAttackPaths,
        };
    }

    private static AzureInventoryDefenderVulnerabilityCountWrite? TryReadVulnerabilityCount(JsonElement element)
    {
        string subscriptionId = ReadString(element, "subscriptionId");
        string resourceId = ReadString(element, "resourceId");

        if (subscriptionId.Length == 0 || resourceId.Length == 0)
        {
            return null;
        }

        return new AzureInventoryDefenderVulnerabilityCountWrite
        {
            SubscriptionId = subscriptionId,
            ResourceId = ArmResourceIdNormalizer.Normalize(resourceId),
            CriticalCount = ReadInt(element, "criticalCount"),
            HighCount = ReadInt(element, "highCount"),
            MediumCount = ReadInt(element, "mediumCount"),
            LowCount = ReadInt(element, "lowCount"),
            SourceEvidenceReference = AzureExtractorPackageZipEntryNames.DefenderVulnerabilityCounts,
        };
    }

    private static AzureInventoryDefenderVulnerabilityFindingWrite? TryReadVulnerabilityFinding(JsonElement element)
    {
        string subscriptionId = ReadString(element, "subscriptionId");
        string resourceId = ReadString(element, "resourceId");
        string findingId = ReadString(element, "findingId");

        if (subscriptionId.Length == 0 || resourceId.Length == 0 || findingId.Length == 0)
        {
            return null;
        }

        return new AzureInventoryDefenderVulnerabilityFindingWrite
        {
            SubscriptionId = subscriptionId,
            ResourceId = ArmResourceIdNormalizer.Normalize(resourceId),
            Severity = ReadString(element, "severity"),
            FindingId = findingId,
            DisplayName = ReadString(element, "displayName"),
            SourceEvidenceReference = AzureExtractorPackageZipEntryNames.DefenderVulnerabilityFindings,
        };
    }

    private static string NormalizeOptional(string resourceId) =>
        resourceId.Length == 0 ? string.Empty : ArmResourceIdNormalizer.Normalize(resourceId);

    private static string ReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement property) || property.ValueKind != JsonValueKind.String)
        {
            return string.Empty;
        }

        return property.GetString()?.Trim() ?? string.Empty;
    }

    private static int ReadInt(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement property) || property.ValueKind != JsonValueKind.Number || !property.TryGetInt32(out int numeric))
        {
            return 0;
        }

        return numeric;
    }

    private static bool ReadBool(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement property))
        {
            return false;
        }

        return property.ValueKind switch
        {
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.String => bool.TryParse(property.GetString(), out bool parsed) && parsed,
            _ => false,
        };
    }

    private static DateTime? ReadUtc(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement property) || property.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        if (!DateTimeOffset.TryParse(
                property.GetString(),
                CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                out DateTimeOffset parsed))
        {
            return null;
        }

        return parsed.UtcDateTime;
    }
}
