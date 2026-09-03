using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Decisioning.Services.Findings;

public sealed partial class FindingsEngineInvokeStage(
    IEnumerable<IFindingEngine> engines,
    IFindingPayloadValidator validator,
    ILogger<FindingsEngineInvokeStage> logger,
    TimeProvider? timeProvider = null,
    IEnumerable<IEffectfulFindingEngine>? effectfulEngines = null,
    IPortfolioRecurrenceCurrentReviewIdentitySource? portfolioRecurrenceCurrentReviewIdentitySource = null)
    : IFindingsEngineInvokeStage
{
    private const string PortfolioRecurrenceEngineType = "portfolio-recurrence";

    private readonly IEnumerable<IFindingEngine> _engines =
        engines ?? throw new ArgumentNullException(nameof(engines));

    private readonly IFindingPayloadValidator _validator =
        validator ?? throw new ArgumentNullException(nameof(validator));

    private readonly ILogger<FindingsEngineInvokeStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly TimeProvider _clock = timeProvider ?? TimeProvider.System;

    private readonly IEnumerable<IEffectfulFindingEngine>? _effectfulEngines = effectfulEngines;

    private readonly IPortfolioRecurrenceCurrentReviewIdentitySource? _portfolioRecurrenceCurrentReviewIdentitySource =
        portfolioRecurrenceCurrentReviewIdentitySource;

    public async Task ExecuteAsync(FindingsStageContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);

        IReadOnlyList<EngineAdapter> allAdapters = EngineAdapter.FromEngines(_engines, _effectfulEngines);
        bool deferPortfolioRecurrence = _portfolioRecurrenceCurrentReviewIdentitySource is not null;
        EngineAdapter[] primaryAdapters = allAdapters
            .Where(adapter =>
                !deferPortfolioRecurrence
                || !string.Equals(adapter.EngineType, PortfolioRecurrenceEngineType, StringComparison.OrdinalIgnoreCase))
            .ToArray();
        EngineAdapter? portfolioRecurrenceAdapter = deferPortfolioRecurrence
            ? allAdapters.FirstOrDefault(adapter =>
                string.Equals(adapter.EngineType, PortfolioRecurrenceEngineType, StringComparison.OrdinalIgnoreCase))
            : null;

        Task<EngineInvocationOutcome>[] invocationTasks = primaryAdapters
            .Select(adapter => InvokeEngineAsync(adapter, context.GraphSnapshot, context.AnalysisContext, cancellationToken))
            .ToArray();

        EngineInvocationOutcome[] outcomes = await AwaitEngineInvocationsAsync(invocationTasks);
        EngineInvocationOutcome[] orderedOutcomes = outcomes
            .OrderBy(static outcome => outcome.Engine.EngineType, StringComparer.Ordinal)
            .ToArray();

        foreach (EngineInvocationOutcome outcome in orderedOutcomes)
        {
            AppendEngineOutcome(context, outcome);
        }

        if (portfolioRecurrenceAdapter is not null && _portfolioRecurrenceCurrentReviewIdentitySource is not null)
        {
            _portfolioRecurrenceCurrentReviewIdentitySource.SetIdentities(
                CollectPortfolioRecurrenceIdentities(context.AllFindings));

            EngineInvocationOutcome portfolioOutcome =
                await InvokeEngineAsync(
                    portfolioRecurrenceAdapter,
                    context.GraphSnapshot,
                    context.AnalysisContext,
                    cancellationToken);

            AppendEngineOutcome(context, portfolioOutcome);
        }

        if (context.SuccessfulEngineInvocations == 0 && context.EngineExceptions.Count > 0)
            throw new AggregateException("All finding engines failed for this snapshot.", context.EngineExceptions);
    }
}
