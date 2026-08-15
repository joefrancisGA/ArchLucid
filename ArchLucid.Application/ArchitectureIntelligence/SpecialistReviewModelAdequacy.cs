using System.Text.RegularExpressions;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
/// TB-2328 — element presence is not review Pass; adequacy is checked against stated constraints.
/// </summary>
internal static partial class SpecialistReviewModelAdequacy
{
    internal enum RecoveryAdequacyOutcome
    {
        MissingObjective = 0,
        Adequate = 1,
        Inadequate = 2,
        CannotVerify = 3,
    }

    internal sealed record RecoveryAdequacyAssessment(
        RecoveryAdequacyOutcome Outcome,
        string Summary,
        int? StatedRtoMinutes,
        int? BackupIntervalMinutes);

    internal enum CostAdequacyOutcome
    {
        MissingDrivers = 0,
        Adequate = 1,
        CeilingNotAddressed = 2,
        CannotVerify = 3,
    }

    internal sealed record CostAdequacyAssessment(
        CostAdequacyOutcome Outcome,
        string Summary,
        decimal? StatedCeilingUsd);

    internal static RecoveryAdequacyAssessment AssessRecovery(ArchitectureKnowledgeModel model)
    {
        ArgumentNullException.ThrowIfNull(model);

        ArchitectureModelElement? recoveryObjective = model.Elements.FirstOrDefault(
            element => element.Kind == ArchitectureElementKind.RecoveryObjective);

        if (recoveryObjective is null)
        {
            return new RecoveryAdequacyAssessment(
                RecoveryAdequacyOutcome.MissingObjective,
                "No RecoveryObjective element was extracted from the available sources.",
                null,
                null);
        }

        string searchText = CollectModelSearchText(model);
        int? statedRtoMinutes = ArchitectureFramingConstraintReader.GetStatedRtoMinutes(model);
        int? backupIntervalMinutes = ParseBackupIntervalMinutes(searchText);

        if (statedRtoMinutes is null)
        {
            return new RecoveryAdequacyAssessment(
                RecoveryAdequacyOutcome.CannotVerify,
                "A recovery objective element exists, but no stated RTO/RPO target could be parsed for adequacy review.",
                null,
                backupIntervalMinutes);
        }

        if (backupIntervalMinutes is null)
        {
            return new RecoveryAdequacyAssessment(
                RecoveryAdequacyOutcome.CannotVerify,
                $"Stated RTO is {FormatDuration(statedRtoMinutes.Value)}, but no backup or replication interval was found to verify recovery adequacy.",
                statedRtoMinutes,
                null);
        }

        if (backupIntervalMinutes.Value > statedRtoMinutes.Value)
        {
            return new RecoveryAdequacyAssessment(
                RecoveryAdequacyOutcome.Inadequate,
                $"Stated RTO is {FormatDuration(statedRtoMinutes.Value)} but the documented backup interval is {FormatDuration(backupIntervalMinutes.Value)} — recovery may not meet the objective.",
                statedRtoMinutes,
                backupIntervalMinutes);
        }

        return new RecoveryAdequacyAssessment(
            RecoveryAdequacyOutcome.Adequate,
            $"Stated RTO ({FormatDuration(statedRtoMinutes.Value)}) is consistent with the documented backup interval ({FormatDuration(backupIntervalMinutes.Value)}).",
            statedRtoMinutes,
            backupIntervalMinutes);
    }

    internal static CostAdequacyAssessment AssessCost(ArchitectureKnowledgeModel model)
    {
        ArgumentNullException.ThrowIfNull(model);

        ArchitectureModelElement? costDriver = model.Elements.FirstOrDefault(
            element => element.Kind == ArchitectureElementKind.CostDriver);

        if (costDriver is null)
        {
            return new CostAdequacyAssessment(
                CostAdequacyOutcome.MissingDrivers,
                "No CostDriver element was extracted from the available sources.",
                null);
        }

        string searchText = CollectModelSearchText(model);
        decimal? statedCeilingUsd = ArchitectureFramingConstraintReader.GetStatedMonthlyCostCeilingUsd(model);

        if (statedCeilingUsd is null)
        {
            return new CostAdequacyAssessment(
                CostAdequacyOutcome.Adequate,
                "Cost drivers are documented and no stated monthly cost ceiling was found to contradict them.",
                null);
        }

        bool driverReferencesCeiling = ContainsCostCeilingSignal(costDriver.Name)
            || ContainsCostCeilingSignal(costDriver.Description)
            || costDriver.Properties.Values.Any(ContainsCostCeilingSignal);

        if (!driverReferencesCeiling)
        {
            return new CostAdequacyAssessment(
                CostAdequacyOutcome.CeilingNotAddressed,
                $"A monthly cost ceiling of ${statedCeilingUsd:0} is stated, but extracted cost drivers do not map spend to that ceiling.",
                statedCeilingUsd);
        }

        return new CostAdequacyAssessment(
            CostAdequacyOutcome.Adequate,
            $"Cost drivers reference the stated monthly ceiling (${statedCeilingUsd:0}).",
            statedCeilingUsd);
    }

    private static string CollectModelSearchText(ArchitectureKnowledgeModel model)
    {
        List<string> parts = [];

        foreach (ArchitectureModelElement element in model.Elements)
        {
            if (!string.IsNullOrWhiteSpace(element.Name))
            {
                parts.Add(element.Name);
            }

            if (!string.IsNullOrWhiteSpace(element.Description))
            {
                parts.Add(element.Description);
            }

            foreach (KeyValuePair<string, string> property in element.Properties)
            {
                if (!string.IsNullOrWhiteSpace(property.Value))
                {
                    parts.Add(property.Value);
                }
            }
        }

        foreach (KeyValuePair<string, string> answer in model.FramingAnswers)
        {
            if (!string.IsNullOrWhiteSpace(answer.Value))
            {
                parts.Add(answer.Value);
            }
        }

        return string.Join(' ', parts);
    }

    internal static int? TryParseBackupIntervalMinutes(string text) => ParseBackupIntervalMinutes(text);

    internal static int? TryParseRtoMinutes(string text) => ParseRtoMinutes(text);

    internal static decimal? TryParseMonthlyCostCeilingUsd(string text) => ParseMonthlyCostCeilingUsd(text);

    private static int? ParseRtoMinutes(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        Match match = RtoDurationPattern().Match(text);

        if (!match.Success)
        {
            return null;
        }

        return ParseDurationToMinutes(match.Groups["value"].Value, match.Groups["unit"].Value);
    }

    private static int? ParseBackupIntervalMinutes(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        Match match = BackupDurationPattern().Match(text);

        if (!match.Success)
        {
            return null;
        }

        return ParseDurationToMinutes(match.Groups["value"].Value, match.Groups["unit"].Value);
    }

    private static decimal? ParseMonthlyCostCeilingUsd(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        Match match = MonthlyCostCeilingPattern().Match(text);

        if (!match.Success)
        {
            return null;
        }

        if (!decimal.TryParse(match.Groups["amount"].Value, out decimal amount))
        {
            return null;
        }

        return amount;
    }

    private static bool ContainsCostCeilingSignal(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        return value.Contains("ceiling", StringComparison.OrdinalIgnoreCase)
            || value.Contains("budget", StringComparison.OrdinalIgnoreCase)
            || value.Contains("monthly", StringComparison.OrdinalIgnoreCase)
            || value.Contains("$", StringComparison.Ordinal);
    }

    private static int? ParseDurationToMinutes(string valueText, string unitText)
    {
        if (!int.TryParse(valueText, out int value))
        {
            return null;
        }

        string unit = unitText.ToLowerInvariant();

        if (unit is "m" or "min" or "minute" or "minutes")
        {
            return value;
        }

        if (unit is "h" or "hr" or "hour" or "hours")
        {
            return value * 60;
        }

        return null;
    }

    private static string FormatDuration(int minutes)
    {
        if (minutes % 60 == 0 && minutes >= 60)
        {
            int hours = minutes / 60;

            return hours == 1 ? "1 hour" : $"{hours} hours";
        }

        return minutes == 1 ? "1 minute" : $"{minutes} minutes";
    }

    [GeneratedRegex(
        @"(?i)\bRTO\b[^.\n]{0,40}?(?<value>\d+)\s*(?<unit>minutes?|mins?|m|hours?|hrs?|h)\b",
        RegexOptions.CultureInvariant)]
    private static partial Regex RtoDurationPattern();

    [GeneratedRegex(
        @"(?i)\bbackup\b[^.\n]{0,40}?(?<value>\d+)\s*(?<unit>minutes?|mins?|m|hours?|hrs?|h)\b",
        RegexOptions.CultureInvariant)]
    private static partial Regex BackupDurationPattern();

    [GeneratedRegex(
        @"(?i)(?:cost\s+ceiling|monthly\s+(?:cost\s+)?ceiling|budget)\s*(?:of\s*)?[:=\-]?\s*\$?\s*(?<amount>\d+(?:\.\d+)?)",
        RegexOptions.CultureInvariant)]
    private static partial Regex MonthlyCostCeilingPattern();
}
