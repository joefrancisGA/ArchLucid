using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Application.Findings.PortfolioRecurrence;

public sealed class PortfolioRecurrenceFindingEmitter : IPortfolioRecurrenceFindingEmitter
{
    private const string Category = "Topology";
    private const string EngineType = "portfolio-recurrence";
    private const string FindingTitleNotStored = "Finding title was not stored.";

    public IReadOnlyList<Finding> EmitQualifyingFindings(
        RecurrenceMatchResult matchResult,
        IReadOnlySet<string> currentScopeIdentities,
        PortfolioRecurrenceFindingOptions options)
    {
        List<RecurrenceAccumulator> qualifying = matchResult.RecurrenceByIdentity
            .Where(pair => currentScopeIdentities.Contains(pair.Key))
            .Select(static pair => pair.Value)
            .Where(accumulator => accumulator.SystemNames.Count >= options.MinSystemCountToReport)
            .OrderByDescending(static accumulator => accumulator.SystemNames.Count)
            .ThenBy(static accumulator => FindingSnapshotMergeKey.FromFinding(accumulator.RepresentativeFinding), StringComparer.Ordinal)
            .Take(options.MaxFindings)
            .ToList();

        return qualifying
            .Select(accumulator => BuildFinding(accumulator, matchResult.ScannedSystemCount, options))
            .ToList();
    }

    private static Finding BuildFinding(
        RecurrenceAccumulator accumulator,
        int scannedSystemCount,
        PortfolioRecurrenceFindingOptions options)
    {
        Finding representative = accumulator.RepresentativeFinding;
        int systemCount = accumulator.SystemNames.Count;
        string identity = FindingSnapshotMergeKey.FromFinding(representative);
        List<string> orderedSystems = accumulator.SystemNames
            .OrderBy(static name => name, StringComparer.OrdinalIgnoreCase)
            .ToList();

        FindingSeverity severity = representative.Severity == FindingSeverity.Info
            && systemCount >= options.MinSystemCountToReport * 2
            ? FindingSeverity.Error
            : representative.Severity == FindingSeverity.Info
                ? FindingSeverity.Warning
                : systemCount >= options.MinSystemCountToReport * 2
                    ? FindingSeverity.Error
                    : FindingSeverity.Warning;

        PortfolioRecurrenceFindingPayload payload = new()
        {
            IdentityToken = identity,
            SystemCount = systemCount,
            ScannedSystemCount = scannedSystemCount,
        };

        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = "PortfolioRecurrenceFinding",
            Category = Category,
            EngineType = EngineType,
            Severity = severity,
            Title = $"Recurs across {systemCount} reviewed systems",
            Rationale = BuildRationale(representative, orderedSystems, systemCount),
            DecisionConsequence = BuildDecisionConsequence(representative, systemCount),
            Payload = payload,
            PayloadType = nameof(PortfolioRecurrenceFindingPayload),
            PolicyRuleId = representative.PolicyRuleId,
            Trace = new ExplainabilityTrace
            {
                RulesApplied = ["portfolio-recurrence", identity],
            },
        };
    }

    private static string FormatRepresentativeSubject(Finding representative)
    {
        if (!string.IsNullOrWhiteSpace(representative.PolicyRuleId))
        {
            return $"policy rule {representative.PolicyRuleId.Trim()} ({representative.Category})";
        }

        string title = representative.Title?.Trim() ?? string.Empty;

        return title.Length > 0
            ? $"'{title}' ({representative.Category})"
            : $"{FindingTitleNotStored} ({representative.Category})";
    }

    private static string BuildRationale(Finding representative, IReadOnlyList<string> systemNames, int systemCount)
    {
        string systemsList = string.Join(", ", systemNames);
        string subject = FormatRepresentativeSubject(representative);

        return $"The same finding ({subject}) is open in {systemCount} reviewed systems: {systemsList}.";
    }

    private static string BuildDecisionConsequence(Finding representative, int systemCount)
    {
        string subject = !string.IsNullOrWhiteSpace(representative.PolicyRuleId)
            ? representative.PolicyRuleId.Trim()
            : representative.Title?.Trim().Length > 0
                ? representative.Title.Trim()
                : FindingTitleNotStored;

        return $"This issue recurs in {systemCount} systems ({subject}). Prefer a platform guardrail or policy-pack rule over a one-off per-system fix.";
    }
}
