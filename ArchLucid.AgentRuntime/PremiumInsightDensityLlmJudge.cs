using System.Diagnostics;

using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Premium-tier TB-382 Phase 2 judge — enriches promoted findings and demotes template-y output (TB-383).
/// </summary>
public sealed partial class PremiumInsightDensityLlmJudge(
    IAgentTierCompletionRouter tierCompletionRouter,
    IOptionsMonitor<AgentModelTierOptions> tierOptions,
    IInsightDensityGateOptionsResolver gateOptionsResolver,
    IConfiguration configuration,
    IFindingInsightSignalRepository? insightSignalRepository,
    IAppendOnlyFindingVerificationReportRepository? verificationReportRepository,
    IScopeContextProvider? scopeContextProvider,
    ITenantAiBudgetPolicyResolver? budgetPolicyResolver,
    ILlmCostEstimator? costEstimator,
    TimeProvider timeProvider,
    ILogger<PremiumInsightDensityLlmJudge> logger) : IInsightDensityLlmJudge
{
    private const string JudgePathEngine = "engine";
    private const string JudgePathArchitecture = "architecture";

    private readonly IAgentTierCompletionRouter _tierCompletionRouter =
        tierCompletionRouter ?? throw new ArgumentNullException(nameof(tierCompletionRouter));

    private readonly IInsightDensityGateOptionsResolver _gateOptionsResolver =
        gateOptionsResolver ?? throw new ArgumentNullException(nameof(gateOptionsResolver));

    private readonly IOptionsMonitor<AgentModelTierOptions> _tierOptions =
        tierOptions ?? throw new ArgumentNullException(nameof(tierOptions));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly IFindingInsightSignalRepository? _insightSignalRepository = insightSignalRepository;

    private readonly IAppendOnlyFindingVerificationReportRepository? _verificationReportRepository =
        verificationReportRepository;

    private readonly IScopeContextProvider? _scopeContextProvider = scopeContextProvider;

    private readonly ITenantAiBudgetPolicyResolver? _budgetPolicyResolver = budgetPolicyResolver;

    private readonly ILlmCostEstimator? _costEstimator = costEstimator;

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly ILogger<PremiumInsightDensityLlmJudge> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<InsightDensityLlmJudgeApplyResult> ApplyToFindingsAsync(
        IReadOnlyList<Finding> findings,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(findings);

        InsightDensityGateOptions options = _gateOptionsResolver.Resolve(cancellationToken);

        if (!IsLlmJudgeOperational() || !options.EnableLlmJudgeForEngineFindings)
        {
            return InsightDensityLlmJudgeApplyResult.None;
        }

        List<Finding> candidates = findings
            .Where(IsEngineJudgeCandidate)
            .ToList();

        if (candidates.Count == 0)
        {
            return InsightDensityLlmJudgeApplyResult.None;
        }

        InsightDensityJudgeEffectiveCapResolution capResolution = await InsightDensityJudgeEffectiveCapResolver
            .ResolveAsync(
                options.MaxJudgedFindingsPerSnapshot,
                _budgetPolicyResolver,
                _costEstimator,
                ResolvePremiumDeploymentName(),
                _scopeContextProvider,
                cancellationToken)
            .ConfigureAwait(false);

        if (capResolution.EffectiveCap <= 0)
        {
            int skippedByBudget = candidates.Count;

            if (skippedByBudget > 0)
            {
                RecordSkippedByCap(JudgePathEngine, skippedByBudget);
            }

            return new InsightDensityLlmJudgeApplyResult(
                skippedByBudget,
                capResolution.ReportConfiguredCap,
                capResolution.ReportEffectiveCap);
        }

        (IReadOnlyList<Finding> judgedFindings, int skippedByCap) =
            await InsightDensityJudgeCandidateSelector.SelectEngineJudgedCandidatesAsync(
                candidates,
                options,
                capResolution.EffectiveCap,
                _insightSignalRepository,
                _verificationReportRepository,
                _scopeContextProvider,
                _timeProvider,
                _logger,
                cancellationToken);

        if (skippedByCap > 0)
        {
            RecordSkippedByCap(JudgePathEngine, skippedByCap);
        }

        if (judgedFindings.Count == 0)
        {
            return new InsightDensityLlmJudgeApplyResult(
                skippedByCap,
                capResolution.ReportConfiguredCap,
                capResolution.ReportEffectiveCap);
        }

        (IAgentCompletionClient completionClient, _) = _tierCompletionRouter.ResolveForAgentTypeName(
            InsightDensityJudgeAgentTypeNames.Judge,
            taskTierOverride: null);

        string systemPrompt = InsightDensityJudgeSystemPromptTemplate.GetText();

        foreach (Finding finding in judgedFindings)
        {
            cancellationToken.ThrowIfCancellationRequested();

            await JudgeOneEngineFindingAsync(
                finding,
                completionClient,
                systemPrompt,
                cancellationToken);

            RecordJudgeCompletion(JudgePathEngine);
        }

        return new InsightDensityLlmJudgeApplyResult(
            skippedByCap,
            capResolution.ReportConfiguredCap,
            capResolution.ReportEffectiveCap);
    }

    /// <inheritdoc />
    public async Task<InsightDensityLlmJudgeApplyResult> ApplyToArchitectureFindingsAsync(
        IReadOnlyList<ArchitectureFinding> findings,
        AgentEvidencePackage evidence,
        ArchitectureRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(findings);
        ArgumentNullException.ThrowIfNull(evidence);
        ArgumentNullException.ThrowIfNull(request);

        if (!IsLlmJudgeOperational())
        {
            return InsightDensityLlmJudgeApplyResult.None;
        }

        InsightDensityGateOptions options = _gateOptionsResolver.Resolve(cancellationToken);

        List<ArchitectureFinding> candidates = findings
            .Where(static finding => finding.Treatment == FindingTreatment.Promote)
            .ToList();

        if (candidates.Count == 0)
        {
            return InsightDensityLlmJudgeApplyResult.None;
        }

        InsightDensityJudgeEffectiveCapResolution capResolution = await InsightDensityJudgeEffectiveCapResolver
            .ResolveAsync(
                options.MaxJudgedFindingsPerSnapshot,
                _budgetPolicyResolver,
                _costEstimator,
                ResolvePremiumDeploymentName(),
                _scopeContextProvider,
                cancellationToken)
            .ConfigureAwait(false);

        if (capResolution.EffectiveCap <= 0)
        {
            int skippedByBudget = candidates.Count;

            if (skippedByBudget > 0)
            {
                RecordSkippedByCap(JudgePathArchitecture, skippedByBudget);
            }

            return new InsightDensityLlmJudgeApplyResult(
                skippedByBudget,
                capResolution.ReportConfiguredCap,
                capResolution.ReportEffectiveCap);
        }

        (IReadOnlyList<ArchitectureFinding> judgedFindings, int skippedByCap) = SelectJudgedArchitectureCandidates(
            candidates,
            capResolution.EffectiveCap);

        if (skippedByCap > 0)
        {
            RecordSkippedByCap(JudgePathArchitecture, skippedByCap);
        }

        if (judgedFindings.Count == 0)
        {
            return new InsightDensityLlmJudgeApplyResult(
                skippedByCap,
                capResolution.ReportConfiguredCap,
                capResolution.ReportEffectiveCap);
        }

        (IAgentCompletionClient completionClient, _) = _tierCompletionRouter.ResolveForAgentTypeName(
            InsightDensityJudgeAgentTypeNames.Judge,
            taskTierOverride: null);

        string systemPrompt = InsightDensityJudgeSystemPromptTemplate.GetText();

        foreach (ArchitectureFinding finding in judgedFindings)
        {
            cancellationToken.ThrowIfCancellationRequested();

            await JudgeOneFindingAsync(
                finding,
                evidence,
                request,
                completionClient,
                systemPrompt,
                cancellationToken);

            RecordJudgeCompletion(JudgePathArchitecture);
        }

        return new InsightDensityLlmJudgeApplyResult(
            skippedByCap,
            capResolution.ReportConfiguredCap,
            capResolution.ReportEffectiveCap);
    }

    private static void RecordJudgeCompletion(string path)
    {
        TagList tags = new() { { "path", path } };
        ArchLucidInstrumentation.InsightDensityJudgeCompletionsTotal.Add(1, tags);
    }

    private static void RecordSkippedByCap(string path, int skippedCount)
    {
        TagList tags = new() { { "path", path } };
        ArchLucidInstrumentation.InsightDensityJudgeSkippedByCapTotal.Add(skippedCount, tags);
    }

    private string? ResolvePremiumDeploymentName()
    {
        AgentModelTierOptions tiers = _tierOptions.CurrentValue;

        return tiers.PremiumDeploymentName ?? _configuration["Llm:Deployments:Reasoning"];
    }
}
