
namespace ArchLucid.Persistence.Alerts.Simulation;

public sealed partial class RuleSimulationService
{
    /// <inheritdoc />
    public async Task<RuleSimulationResult> SimulateAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        RuleSimulationRequest request,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request is { UseHistoricalWindow: false, RunId: null })

            return new RuleSimulationResult
            {
                RuleKind = request.RuleKind,
                SimulatedUtc = TimeProvider.System.UtcNowDateTime(),
                EvaluatedRunCount = 0,
                SummaryNotes = { "UseHistoricalWindow is false and no RunId was provided; nothing evaluated." },
            };


        IReadOnlyList<AlertEvaluationContext> contexts = await contextProvider
            .GetContextsAsync(
                tenantId,
                workspaceId,
                projectId,
                request.RunId,
                request.ComparedToRunId,
                request.RecentRunCount,
                request.RunProjectSlug,
                ct)
            ;

        RuleSimulationResult result = new()
        {
            RuleKind = request.RuleKind,
            SimulatedUtc = TimeProvider.System.UtcNowDateTime(),
            EvaluatedRunCount = contexts.Count,
        };

        if (contexts.Count == 0)
        {
            result.SummaryNotes.Add("No evaluation contexts were built (no runs or missing golden manifests).");
            return result;
        }

        foreach (AlertEvaluationContext context in contexts)

            if (string.Equals(request.RuleKind, RuleKindSimple, StringComparison.OrdinalIgnoreCase) &&
                request.SimpleRule is not null)
            {
                AlertRule rule = CloneSimpleForSimulation(request.SimpleRule);
                IReadOnlyList<AlertRecord> generated = alertEvaluator.Evaluate([rule], context);

                if (generated.Count > 0)

                    foreach (AlertRecord alert in generated)

                        result.Outcomes.Add(
                            new SimulatedAlertOutcome
                            {
                                RunId = context.RunId,
                                ComparedToRunId = context.ComparedToRunId,
                                RuleMatched = true,
                                WouldCreateAlert = true,
                                WouldBeSuppressed = false,
                                Title = alert.Title,
                                Severity = alert.Severity,
                                Description = alert.Description,
                                DeduplicationKey = alert.DeduplicationKey,
                                SuppressionReason = "No suppression logic applied for simple rule dry-run.",
                                EvaluationMode = RuleKindSimple,
                                Notes = ["Simple rule matched (production evaluator; no persistence or delivery)."],
                            });


                else

                    result.Outcomes.Add(
                        new SimulatedAlertOutcome
                        {
                            RunId = context.RunId,
                            ComparedToRunId = context.ComparedToRunId,
                            RuleMatched = false,
                            WouldCreateAlert = false,
                            WouldBeSuppressed = false,
                            Title = request.SimpleRule.Name,
                            Severity = request.SimpleRule.Severity,
                            Description = "Rule did not match.",
                            DeduplicationKey = string.Empty,
                            SuppressionReason = string.Empty,
                            EvaluationMode = RuleKindSimple,
                            Notes = ["Simple rule did not match."],
                        });

            }
            else if (string.Equals(request.RuleKind, RuleKindComposite, StringComparison.OrdinalIgnoreCase) &&
                     request.CompositeRule is not null)
            {
                CompositeAlertRule compositeRule = CloneCompositeForSimulation(request.CompositeRule);
                AlertMetricSnapshot snapshot = metricSnapshotBuilder.Build(context);
                bool matched = compositeEvaluator.Evaluate(compositeRule, snapshot);

                if (!matched)
                {
                    result.Outcomes.Add(
                        new SimulatedAlertOutcome
                        {
                            RunId = context.RunId,
                            ComparedToRunId = context.ComparedToRunId,
                            RuleMatched = false,
                            WouldCreateAlert = false,
                            WouldBeSuppressed = false,
                            Title = request.CompositeRule.Name,
                            Severity = request.CompositeRule.Severity,
                            Description = "Composite rule did not match.",
                            DeduplicationKey = string.Empty,
                            SuppressionReason = string.Empty,
                            EvaluationMode = RuleKindComposite,
                            Notes = ["Composite rule did not match current metric snapshot."],
                        });
                    continue;
                }

                AlertSuppressionDecision suppression = await suppressionPolicy
                    .DecideAsync(compositeRule, context, snapshot, ct)
                    ;

                result.Outcomes.Add(
                    new SimulatedAlertOutcome
                    {
                        RunId = context.RunId,
                        ComparedToRunId = context.ComparedToRunId,
                        RuleMatched = true,
                        WouldCreateAlert = suppression.ShouldCreateAlert,
                        WouldBeSuppressed = !suppression.ShouldCreateAlert,
                        Title = $"Composite alert: {request.CompositeRule.Name}",
                        Severity = request.CompositeRule.Severity,
                        Description = suppression.Reason,
                        DeduplicationKey = suppression.DeduplicationKey,
                        SuppressionReason = suppression.Reason,
                        EvaluationMode = RuleKindComposite,
                        Notes =
                        [
                            "Composite rule matched; suppression uses live alert store (read-only for simulation).",
                        ],
                    });
            }


        result.MatchedCount = result.Outcomes.Count(x => x.RuleMatched);
        result.WouldCreateCount = result.Outcomes.Count(x => x.WouldCreateAlert);
        result.WouldSuppressCount = result.Outcomes.Count(x => x.WouldBeSuppressed);

        result.SummaryNotes.Add($"Evaluated {result.EvaluatedRunCount} run context(s).");
        result.SummaryNotes.Add($"{result.MatchedCount} outcome(s) matched.");
        result.SummaryNotes.Add($"{result.WouldCreateCount} would create alert(s).");
        result.SummaryNotes.Add($"{result.WouldSuppressCount} would be suppressed.");

        return result;
    }
}
