using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Retrieval;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>Premium-tier insight generator that proposes package-grounded findings in Real mode (DX-10).</summary>
public sealed class PremiumInsightFindingGenerator(
    IAgentTierCompletionRouter tierCompletionRouter,
    IOptionsMonitor<AgentModelTierOptions> tierOptions,
    IInsightDensityGateOptionsResolver gateOptionsResolver,
    IEffectiveAgentExecutionModeAccessor executionModeAccessor,
    IGraphCommunitySummaryLookup communitySummaryLookup,
    IOptionsMonitor<AdvancedRetrievalOptions> advancedRetrievalOptions,
    IConfiguration configuration,
    ILogger<PremiumInsightFindingGenerator> logger) : IInsightFindingGenerator
{
    private readonly IAgentTierCompletionRouter _tierCompletionRouter =
        tierCompletionRouter ?? throw new ArgumentNullException(nameof(tierCompletionRouter));

    private readonly IOptionsMonitor<AgentModelTierOptions> _tierOptions =
        tierOptions ?? throw new ArgumentNullException(nameof(tierOptions));

    private readonly IInsightDensityGateOptionsResolver _gateOptionsResolver =
        gateOptionsResolver ?? throw new ArgumentNullException(nameof(gateOptionsResolver));

    private readonly IEffectiveAgentExecutionModeAccessor _executionModeAccessor =
        executionModeAccessor ?? throw new ArgumentNullException(nameof(executionModeAccessor));

    private readonly IGraphCommunitySummaryLookup _communitySummaryLookup =
        communitySummaryLookup ?? throw new ArgumentNullException(nameof(communitySummaryLookup));

    private readonly IOptionsMonitor<AdvancedRetrievalOptions> _advancedRetrievalOptions =
        advancedRetrievalOptions ?? throw new ArgumentNullException(nameof(advancedRetrievalOptions));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly ILogger<PremiumInsightFindingGenerator> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<IReadOnlyList<Finding>> GenerateAsync(
        IReadOnlyList<Finding> engineFindings,
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(engineFindings);
        ArgumentNullException.ThrowIfNull(graphSnapshot);
        _ = analysisContext;

        if (!IsRealExecutionMode())
        {
            return [];
        }

        InsightDensityGateOptions options = _gateOptionsResolver.Resolve(cancellationToken);

        if (!options.EnableInsightGenerator || !IsPremiumDeploymentConfigured())
        {
            return [];
        }

        IReadOnlyList<InsightGeneratorCommunitySummary> communitySummaries =
            await ResolveCommunitySummariesAsync(graphSnapshot, cancellationToken).ConfigureAwait(false);

        HashSet<string> allowedRefs = InsightGeneratorEvidenceSummary.CollectAllowedEvidenceRefs(
            engineFindings,
            graphSnapshot,
            communitySummaries);

        if (allowedRefs.Count == 0)
        {
            return [];
        }

        string systemPrompt = InsightGeneratorSystemPromptTemplate.GetText();
        string userPrompt = InsightGeneratorEvidenceSummary.BuildUserPrompt(
            engineFindings,
            graphSnapshot,
            allowedRefs,
            options.MaxGeneratedInsightFindingsPerSnapshot,
            communitySummaries);

        (IAgentCompletionClient completionClient, _) = _tierCompletionRouter.ResolveForAgentTypeName(
            InsightDensityJudgeAgentTypeNames.Judge,
            taskTierOverride: null);

        try
        {
            string rawJson = await completionClient
                .CompleteJsonAsync(systemPrompt, userPrompt, maxTokens: null, cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            IReadOnlyList<InsightGeneratorProposal> proposals = InsightGeneratorFindingParser.TryParse(
                rawJson,
                options.MaxGeneratedInsightFindingsPerSnapshot);

            if (proposals.Count == 0)
            {
                return [];
            }

            List<Finding> findings = [];

            foreach (InsightGeneratorProposal proposal in proposals)
            {
                if (!IsFaithful(proposal, allowedRefs))
                {
                    continue;
                }

                findings.Add(BuildFinding(proposal));
            }

            return findings;
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Insight generator LLM pass failed; returning no generated findings.");

            return [];
        }
    }

    private async Task<IReadOnlyList<InsightGeneratorCommunitySummary>> ResolveCommunitySummariesAsync(
        GraphSnapshot graphSnapshot,
        CancellationToken cancellationToken)
    {
        AdvancedRetrievalOptions retrievalOptions = _advancedRetrievalOptions.CurrentValue;

        if (!retrievalOptions.Enabled || !retrievalOptions.EnableCommunitySummarization)
            return [];

        return await _communitySummaryLookup
            .GetSummariesAsync(graphSnapshot, cancellationToken)
            .ConfigureAwait(false);
    }

    private bool IsRealExecutionMode()
    {
        return string.Equals(
            _executionModeAccessor.GetEffectiveMode(),
            DevAgentExecutionModeHeaderNames.Real,
            StringComparison.OrdinalIgnoreCase);
    }

    private bool IsPremiumDeploymentConfigured()
    {
        AgentModelTierOptions tiers = _tierOptions.CurrentValue;
        string? premiumDeployment = tiers.PremiumDeploymentName ?? _configuration["Llm:Deployments:Reasoning"];

        return !string.IsNullOrWhiteSpace(premiumDeployment);
    }

    private static bool IsFaithful(InsightGeneratorProposal proposal, IReadOnlySet<string> allowedRefs)
    {
        if (proposal.EvidenceRefs.Count == 0)
        {
            return false;
        }

        foreach (string reference in proposal.EvidenceRefs)
        {
            if (!allowedRefs.Contains(reference.Trim()))
            {
                return false;
            }
        }

        return true;
    }

    private static Finding BuildFinding(InsightGeneratorProposal proposal)
    {
        List<string> traceNotes = proposal.EvidenceRefs
            .Select(static reference => $"evidence:{reference}")
            .ToList();

        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = InsightDensityFindingSourceClassifier.InsightGeneratorFindingType,
            Category = proposal.Category,
            EngineType = "insight-generator",
            Severity = proposal.Severity,
            Title = proposal.Title,
            Rationale = proposal.Rationale,
            RelatedNodeIds = ExtractGraphNodeIds(proposal.EvidenceRefs),
            Trace = new ExplainabilityTrace
            {
                RulesApplied = ["insight-generator-llm-pass"],
                DecisionsTaken =
                [
                    "Proposed a package-grounded finding from bounded graph and engine evidence.",
                ],
                AlternativePathsConsidered =
                [
                    "Dismiss when the insight duplicates an existing typed-engine finding.",
                    "Operationalize when the team accepts the risk with documented rationale.",
                ],
                Notes = traceNotes,
            },
        };
    }

    private static List<string> ExtractGraphNodeIds(IReadOnlyList<string> evidenceRefs)
    {
        List<string> nodeIds = [];

        foreach (string reference in evidenceRefs)
        {
            if (!reference.StartsWith("graph-node:", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string nodeId = reference["graph-node:".Length..].Trim();

            if (!string.IsNullOrWhiteSpace(nodeId))
            {
                nodeIds.Add(nodeId);
            }
        }

        return nodeIds;
    }
}
