namespace ArchLucid.Cli.Commands;

internal static class ReturnTriggerTelemetryAggregator
{
    internal static ReturnTriggerTelemetryCohortMetrics BuildMetrics(
        IReadOnlyList<ReturnTriggerTelemetrySessionRecord> records,
        ReturnTriggerTelemetryRules rules)
    {
        ArgumentNullException.ThrowIfNull(records);
        ArgumentNullException.ThrowIfNull(rules);

        HashSet<string> positiveIntents = rules.PositiveReuseIntents
            .Select(static intent => intent.ToLowerInvariant())
            .ToHashSet(StringComparer.Ordinal);

        int positiveReuse = records.Count(record =>
            !string.IsNullOrWhiteSpace(record.ReuseIntent)
            && positiveIntents.Contains(record.ReuseIntent.Trim().ToLowerInvariant()));

        int dismissalObserved = records.Count(static record => record.DismissalObserved);
        Dictionary<string, int> returnCounts = CountCodes(records.Select(static record => record.ReturnTriggerCode));
        Dictionary<string, int> dismissalCounts = CountCodes(records.Select(static record => record.DismissalTriggerCode));
        int sessionCount = records.Count;
        double positiveFraction = sessionCount <= 0 ? 0 : (double)positiveReuse / sessionCount;

        return new ReturnTriggerTelemetryCohortMetrics
        {
            SessionCount = sessionCount,
            PositiveReuseIntentCount = positiveReuse,
            DismissalObservedCount = dismissalObserved,
            ExplicitReturnTriggerCount = returnCounts.Values.Sum(),
            PositiveReuseFraction = positiveFraction,
            TopReturnTriggerCode = TopCode(returnCounts),
            TopDismissalTriggerCode = TopCode(dismissalCounts),
            MessagingReady = sessionCount >= rules.MinSessionsForMessaging,
        };
    }

    internal static ReturnTriggerTelemetryVerdict EvaluateGuardrails(
        ReturnTriggerTelemetryCohortMetrics metrics,
        ReturnTriggerTelemetryRules rules)
    {
        if (metrics.SessionCount == 0)
            return ReturnTriggerTelemetryVerdict.Warn;

        if (metrics.MessagingReady
            && metrics.PositiveReuseFraction < rules.Guardrails.MinPositiveReuseFraction)
        {
            return ReturnTriggerTelemetryVerdict.Fail;
        }

        if (metrics.MessagingReady)
        {
            double dismissalFraction = (double)metrics.DismissalObservedCount / metrics.SessionCount;

            if (dismissalFraction > rules.Guardrails.MaxDismissalWithoutReturnFraction
                && metrics.PositiveReuseFraction < rules.Guardrails.MinPositiveReuseFraction)
            {
                return ReturnTriggerTelemetryVerdict.Fail;
            }
        }

        if (metrics.SessionCount < rules.MinSessionsForMessaging)
            return ReturnTriggerTelemetryVerdict.Warn;

        return ReturnTriggerTelemetryVerdict.Pass;
    }

    private static Dictionary<string, int> CountCodes(IEnumerable<string?> codes)
    {
        Dictionary<string, int> counts = new(StringComparer.OrdinalIgnoreCase);

        foreach (string? code in codes)
        {
            if (string.IsNullOrWhiteSpace(code))
                continue;

            counts.TryGetValue(code, out int current);
            counts[code] = current + 1;
        }

        return counts;
    }

    private static string TopCode(IReadOnlyDictionary<string, int> counts)
    {
        if (counts.Count == 0)
            return "none";

        return counts
            .OrderByDescending(static pair => pair.Value)
            .ThenBy(static pair => pair.Key, StringComparer.OrdinalIgnoreCase)
            .Select(static pair => pair.Key)
            .First();
    }
}
