using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Configuration;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Services.Findings;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.Decisioning.Services;

/// <summary>Composes <see cref="FindingsOrchestrator" /> stage handlers for tests and manual wiring.</summary>
internal static class FindingsOrchestratorComposer
{
    internal static FindingsOrchestrator Compose(
        IEnumerable<IFindingEngine> engines,
        IFindingPayloadValidator validator,
        IOptions<HumanReviewFindingOptions> humanReviewOptions,
        IInsightDensityGate insightDensityGate,
        TimeProvider? timeProvider = null,
        IEnumerable<IEffectfulFindingEngine>? effectfulEngines = null,
        IScopeContextProvider? scopeContextProvider = null,
        IEffectiveGovernanceLoader? effectiveGovernanceLoader = null,
        IPortfolioRecurrenceCurrentReviewIdentitySource? portfolioRecurrenceCurrentReviewIdentitySource = null)
    {
        ArgumentNullException.ThrowIfNull(engines);
        ArgumentNullException.ThrowIfNull(validator);
        ArgumentNullException.ThrowIfNull(humanReviewOptions);
        ArgumentNullException.ThrowIfNull(insightDensityGate);

        IFindingsPolicyStampStage policyStampStage = new FindingsPolicyStampStage(
            scopeContextProvider,
            effectiveGovernanceLoader,
            NullLogger<FindingsPolicyStampStage>.Instance);

        IFindingsEngineInvokeStage engineInvokeStage = new FindingsEngineInvokeStage(
            engines,
            validator,
            NullLogger<FindingsEngineInvokeStage>.Instance,
            timeProvider,
            effectfulEngines,
            portfolioRecurrenceCurrentReviewIdentitySource);

        IFindingsInsightGeneratorStage insightGeneratorStage = new FindingsInsightGeneratorStage(
            NoOpInsightFindingGenerator.Instance,
            NullLogger<FindingsInsightGeneratorStage>.Instance);

        IFindingsMergeAndGateStage mergeAndGateStage = new FindingsMergeAndGateStage(
            humanReviewOptions,
            insightDensityGate,
            timeProvider);

        IFindingsSnapshotEmitStage snapshotEmitStage = new FindingsSnapshotEmitStage(
            NullLogger<FindingsSnapshotEmitStage>.Instance);

        return new FindingsOrchestrator(
            policyStampStage,
            engineInvokeStage,
            insightGeneratorStage,
            mergeAndGateStage,
            snapshotEmitStage);
    }
}
