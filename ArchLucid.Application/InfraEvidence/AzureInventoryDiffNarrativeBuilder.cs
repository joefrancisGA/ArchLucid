using System.Text.Json;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>Deterministic executive summary and simulator narrative templates for inventory diffs.</summary>
public static class AzureInventoryDiffNarrativeBuilder
{
    public const string SimulatorLabel = "SIMULATOR";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    public static AzureInventoryDiffExecutiveSummaryRecord BuildExecutiveSummary(
        AzureInventoryDiffSummaryRecord summary,
        IReadOnlyList<AzureInventoryClassifiedChangeRecord> classifiedChanges)
    {
        ArgumentNullException.ThrowIfNull(summary);
        ArgumentNullException.ThrowIfNull(classifiedChanges);

        int securityRelevantCount = classifiedChanges.Count(c =>
            c.Classification == AzureInventoryDriftClassification.SecurityRelevant
            || c.Classification == AzureInventoryDriftClassification.PotentiallyDangerous);

        int architectureRelevantCount = classifiedChanges.Count(c =>
            c.Classification == AzureInventoryDriftClassification.ArchitectureRelevant);

        int potentiallyDangerousCount = classifiedChanges.Count(c =>
            c.Classification == AzureInventoryDriftClassification.PotentiallyDangerous);

        int unapprovedCount = classifiedChanges.Count(c =>
            c.Classification == AzureInventoryDriftClassification.Unapproved);

        string headline = BuildHeadline(summary, potentiallyDangerousCount, securityRelevantCount, unapprovedCount);

        return new AzureInventoryDiffExecutiveSummaryRecord
        {
            DiffId = summary.DiffId,
            TotalChanges = summary.TotalChanges,
            SecurityRelevantCount = securityRelevantCount,
            ArchitectureRelevantCount = architectureRelevantCount,
            PotentiallyDangerousCount = potentiallyDangerousCount,
            UnapprovedCount = unapprovedCount,
            Headline = headline,
        };
    }

    public static string BuildSimulatorNarrative(
        AzureInventoryDiffNarrativeKind narrativeKind,
        AzureInventoryDiffSummaryRecord summary,
        IReadOnlyList<AzureInventoryClassifiedChangeRecord> classifiedChanges,
        IReadOnlyList<Guid> citedChangeIds)
    {
        ArgumentNullException.ThrowIfNull(summary);
        ArgumentNullException.ThrowIfNull(classifiedChanges);
        ArgumentNullException.ThrowIfNull(citedChangeIds);

        string focus = narrativeKind switch
        {
            AzureInventoryDiffNarrativeKind.Material => "material infrastructure changes",
            AzureInventoryDiffNarrativeKind.Security => "security-relevant changes",
            AzureInventoryDiffNarrativeKind.Architecture => "architecture-relevant changes",
            AzureInventoryDiffNarrativeKind.Accidental => "potentially accidental changes",
            AzureInventoryDiffNarrativeKind.Investigate => "changes requiring investigation",
            _ => "inventory changes",
        };

        return $"[SIMULATOR] This diff between snapshots contains {summary.TotalChanges} total changes with emphasis on {focus}. "
            + $"Cited change ids: {string.Join(", ", citedChangeIds.Select(id => id.ToString("D")))}. "
            + $"Classified rows referenced: {classifiedChanges.Count}.";
    }

    public static string BuildLlmUserPrompt(
        AzureInventoryDiffNarrativeKind narrativeKind,
        AzureInventoryDiffSummaryRecord summary,
        IReadOnlyList<AzureInventoryClassifiedChangeRecord> classifiedChanges)
    {
        ArgumentNullException.ThrowIfNull(summary);
        ArgumentNullException.ThrowIfNull(classifiedChanges);

        var payload = new
        {
            narrativeKind = narrativeKind.ToString(),
            summary = new
            {
                summary.DiffId,
                summary.TotalChanges,
                summary.NetworkExposureChangeCount,
                summary.PermissionChangeCount,
                summary.LoggingRegressionCount,
            },
            changes = classifiedChanges.Select(c => new
            {
                changeId = c.Change.ChangeId,
                changeType = c.Change.ChangeType.ToString(),
                azureResourceId = c.Change.AzureResourceId,
                property = c.Change.Property,
                classification = c.Classification.ToString(),
            }),
        };

        return "Structured Azure inventory diff JSON:\n" + JsonSerializer.Serialize(payload, JsonOptions);
    }

    public static IReadOnlyList<Guid> SelectCitedChangeIds(
        AzureInventoryDiffNarrativeKind narrativeKind,
        IReadOnlyList<AzureInventoryClassifiedChangeRecord> classifiedChanges)
    {
        ArgumentNullException.ThrowIfNull(classifiedChanges);

        IEnumerable<AzureInventoryClassifiedChangeRecord> filtered = narrativeKind switch
        {
            AzureInventoryDiffNarrativeKind.Security => classifiedChanges.Where(c =>
                c.Classification is AzureInventoryDriftClassification.SecurityRelevant
                    or AzureInventoryDriftClassification.PotentiallyDangerous),
            AzureInventoryDiffNarrativeKind.Architecture => classifiedChanges.Where(c =>
                c.Classification == AzureInventoryDriftClassification.ArchitectureRelevant),
            AzureInventoryDiffNarrativeKind.Accidental => classifiedChanges.Where(c =>
                c.Classification == AzureInventoryDriftClassification.PotentiallyDangerous),
            AzureInventoryDiffNarrativeKind.Investigate => classifiedChanges.Where(c =>
                c.Classification == AzureInventoryDriftClassification.Unapproved),
            _ => classifiedChanges,
        };

        return filtered.Select(c => c.Change.ChangeId).Distinct().ToList();
    }

    private static string BuildHeadline(
        AzureInventoryDiffSummaryRecord summary,
        int potentiallyDangerousCount,
        int securityRelevantCount,
        int unapprovedCount)
    {
        if (summary.TotalChanges == 0)
            return "No inventory changes detected between the selected snapshots.";

        if (potentiallyDangerousCount > 0)
            return $"{potentiallyDangerousCount} potentially dangerous change(s) require immediate review.";

        if (securityRelevantCount > 0)
            return $"{securityRelevantCount} security-relevant change(s) detected across {summary.TotalChanges} total changes.";

        if (unapprovedCount > 0)
            return $"{unapprovedCount} unapproved change(s) remain across {summary.TotalChanges} total changes.";

        return $"{summary.TotalChanges} inventory change(s) detected between the selected snapshots.";
    }
}
