using System.Text.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public static class DefenderCompanionMaterializer
{
    public static IReadOnlyList<AzureInventoryDefenderPricingWrite> MaterializePricings(IReadOnlyList<JsonElement> rows) =>
        Materialize(rows, TryReadPricing);

    public static IReadOnlyList<AzureInventoryDefenderScoreControlWrite> MaterializeScoreControls(IReadOnlyList<JsonElement> rows) =>
        Materialize(rows, TryReadScoreControl);

    public static IReadOnlyList<AzureInventoryDefenderAssessmentWrite> MaterializeAssessments(IReadOnlyList<JsonElement> rows) =>
        Materialize(rows, TryReadAssessment);

    public static IReadOnlyList<AzureInventoryDefenderAssessmentCountWrite> MaterializeAssessmentCounts(IReadOnlyList<JsonElement> rows) =>
        Materialize(rows, TryReadAssessmentCount);

    public static IReadOnlyList<AzureInventoryDefenderSecurityContactWrite> MaterializeSecurityContacts(IReadOnlyList<JsonElement> rows) =>
        Materialize(rows, TryReadSecurityContact);

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

    private static AzureInventoryDefenderPricingWrite? TryReadPricing(JsonElement element)
    {
        string subscriptionId = ReadString(element, "subscriptionId");
        string pricingName = ReadString(element, "pricingName");
        string tier = ReadString(element, "tier");

        if (subscriptionId.Length == 0 || pricingName.Length == 0 || tier.Length == 0)
        {
            return null;
        }

        return new AzureInventoryDefenderPricingWrite
        {
            SubscriptionId = subscriptionId,
            PricingName = pricingName,
            Tier = tier,
            Extensions = ReadString(element, "extensions"),
            SourceEvidenceReference = AzureExtractorPackageZipEntryNames.DefenderPricings,
        };
    }

    private static AzureInventoryDefenderScoreControlWrite? TryReadScoreControl(JsonElement element)
    {
        string subscriptionId = ReadString(element, "subscriptionId");
        string controlName = ReadString(element, "controlName");

        if (subscriptionId.Length == 0 || controlName.Length == 0 || !TryReadInt(element, "current", out int current) || !TryReadInt(element, "max", out int max))
        {
            return null;
        }

        TryReadInt(element, "percentage", out int percentage);
        TryReadInt(element, "weight", out int weight);
        TryReadInt(element, "unhealthyResourceCount", out int unhealthy);
        TryReadInt(element, "healthyResourceCount", out int healthy);

        return new AzureInventoryDefenderScoreControlWrite
        {
            SubscriptionId = subscriptionId,
            ScoreName = ReadString(element, "scoreName"),
            ControlName = controlName,
            DisplayName = ReadString(element, "displayName"),
            CurrentScore = current,
            MaxScore = max,
            Percentage = percentage,
            Weight = weight,
            UnhealthyResourceCount = unhealthy,
            HealthyResourceCount = healthy,
            SourceEvidenceReference = AzureExtractorPackageZipEntryNames.DefenderScoreControls,
        };
    }

    private static AzureInventoryDefenderAssessmentWrite? TryReadAssessment(JsonElement element)
    {
        string resourceId = ReadString(element, "resourceId");
        string assessmentKey = ReadString(element, "assessmentKey");

        if (resourceId.Length == 0 || assessmentKey.Length == 0)
        {
            return null;
        }

        return new AzureInventoryDefenderAssessmentWrite
        {
            SubscriptionId = ReadString(element, "subscriptionId"),
            AssessmentKey = assessmentKey,
            DisplayName = ReadString(element, "displayName"),
            Severity = ReadString(element, "severity"),
            Status = ReadString(element, "status"),
            StatusCause = ReadString(element, "statusCause"),
            Category = ReadString(element, "category"),
            ResourceId = ArmResourceIdNormalizer.Normalize(resourceId),
            SourceEvidenceReference = AzureExtractorPackageZipEntryNames.DefenderAssessments,
        };
    }

    private static AzureInventoryDefenderAssessmentCountWrite? TryReadAssessmentCount(JsonElement element)
    {
        string assessmentKey = ReadString(element, "assessmentKey");

        if (assessmentKey.Length == 0)
        {
            return null;
        }

        TryReadInt(element, "healthyCount", out int healthy);
        TryReadInt(element, "unhealthyCount", out int unhealthy);
        TryReadInt(element, "notApplicableCount", out int notApplicable);

        return new AzureInventoryDefenderAssessmentCountWrite
        {
            SubscriptionId = ReadString(element, "subscriptionId"),
            AssessmentKey = assessmentKey,
            DisplayName = ReadString(element, "displayName"),
            Severity = ReadString(element, "severity"),
            HealthyCount = healthy,
            UnhealthyCount = unhealthy,
            NotApplicableCount = notApplicable,
            SourceEvidenceReference = AzureExtractorPackageZipEntryNames.DefenderAssessmentCounts,
        };
    }

    private static AzureInventoryDefenderSecurityContactWrite? TryReadSecurityContact(JsonElement element)
    {
        string subscriptionId = ReadString(element, "subscriptionId");
        string collectionStatus = ReadString(element, "collectionStatus");

        if (subscriptionId.Length == 0 || collectionStatus.Length == 0)
        {
            return null;
        }

        TryReadInt(element, "emailCount", out int emailCount);

        return new AzureInventoryDefenderSecurityContactWrite
        {
            SubscriptionId = subscriptionId,
            CollectionStatus = collectionStatus,
            EmailCount = emailCount,
            Emails = ReadString(element, "emails"),
            AlertsToAdmins = ReadBool(element, "alertsToAdmins"),
            MinimalSeverity = ReadString(element, "minimalSeverity"),
            NotificationRoles = ReadString(element, "notificationRoles"),
            SourceEvidenceReference = AzureExtractorPackageZipEntryNames.DefenderSecurityContacts,
        };
    }

    private static string ReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement property) || property.ValueKind != JsonValueKind.String)
        {
            return string.Empty;
        }

        return property.GetString()?.Trim() ?? string.Empty;
    }

    private static bool TryReadInt(JsonElement element, string propertyName, out int value)
    {
        value = 0;

        if (!element.TryGetProperty(propertyName, out JsonElement property) || property.ValueKind != JsonValueKind.Number || !property.TryGetInt32(out int numeric))
        {
            return false;
        }

        value = numeric;
        return true;
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
            _ => false,
        };
    }
}
