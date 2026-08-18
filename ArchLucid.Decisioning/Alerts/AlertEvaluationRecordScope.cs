using ArchLucid.Contracts.Advisory.Workflow;

namespace ArchLucid.Decisioning.Alerts;

/// <summary>
///     Defense-in-depth scoping for recommendation rows passed into alert evaluation.
/// </summary>
internal static class AlertEvaluationRecordScope
{
    internal static IEnumerable<RecommendationRecord> ForRun(AlertEvaluationContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        if (context.RunId is null)
            return context.RecommendationRecords;

        Guid runId = context.RunId.Value;

        return context.RecommendationRecords.Where(record => record.RunId == runId);
    }
}
