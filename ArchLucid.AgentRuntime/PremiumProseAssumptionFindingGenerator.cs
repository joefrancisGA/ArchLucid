using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Application.Findings.ProseAssumption;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>Premium-tier prose assumption extractor and contradiction emitter in Real mode (DX-55).</summary>
public sealed class PremiumProseAssumptionFindingGenerator(
    IAgentTierCompletionRouter tierCompletionRouter,
    IOptionsMonitor<AgentModelTierOptions> tierOptions,
    IInsightDensityGateOptionsResolver gateOptionsResolver,
    IEffectiveAgentExecutionModeAccessor executionModeAccessor,
    IConfiguration configuration,
    IRunRepository runRepository,
    IArchitectureRequestRepository architectureRequestRepository,
    IScopeContextProvider scopeContextProvider,
    IProseAssumptionContradictionService contradictionService,
    ILogger<PremiumProseAssumptionFindingGenerator> logger) : IProseAssumptionFindingGenerator
{
    private readonly IAgentTierCompletionRouter _tierCompletionRouter =
        tierCompletionRouter ?? throw new ArgumentNullException(nameof(tierCompletionRouter));

    private readonly IOptionsMonitor<AgentModelTierOptions> _tierOptions =
        tierOptions ?? throw new ArgumentNullException(nameof(tierOptions));

    private readonly IInsightDensityGateOptionsResolver _gateOptionsResolver =
        gateOptionsResolver ?? throw new ArgumentNullException(nameof(gateOptionsResolver));

    private readonly IEffectiveAgentExecutionModeAccessor _executionModeAccessor =
        executionModeAccessor ?? throw new ArgumentNullException(nameof(executionModeAccessor));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IArchitectureRequestRepository _architectureRequestRepository =
        architectureRequestRepository ?? throw new ArgumentNullException(nameof(architectureRequestRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IProseAssumptionContradictionService _contradictionService =
        contradictionService ?? throw new ArgumentNullException(nameof(contradictionService));

    private readonly ILogger<PremiumProseAssumptionFindingGenerator> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<IReadOnlyList<Finding>> GenerateAsync(
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        if (!IsRealExecutionMode())
            return [];

        InsightDensityGateOptions options = _gateOptionsResolver.Resolve(cancellationToken);

        if (!options.EnableProseAssumptionExtraction || !IsPremiumDeploymentConfigured())
            return [];

        IReadOnlyList<ContextDocumentRequest> documents = await LoadDocumentsAsync(analysisContext, cancellationToken)
            .ConfigureAwait(false);

        if (documents.Count == 0)
            return [];

        Dictionary<string, string> documentBodiesByPath = documents
            .Where(document => !string.IsNullOrWhiteSpace(document.Name) && !string.IsNullOrWhiteSpace(document.Content))
            .ToDictionary(document => document.Name, document => document.Content, StringComparer.OrdinalIgnoreCase);

        List<ProseAssumptionCandidate> candidates = ProseAssumptionDocumentLineScanner
            .Scan(documents, options.MaxProseAssumptionCandidatesPerSnapshot)
            .ToList();

        await AppendPremiumCandidatesAsync(
            documents,
            documentBodiesByPath,
            candidates,
            options.MaxProseAssumptionCandidatesPerSnapshot,
            cancellationToken).ConfigureAwait(false);

        List<ProseAssumptionCandidate> groundedCandidates = [];

        foreach (ProseAssumptionCandidate candidate in candidates)
        {
            if (groundedCandidates.Count >= options.MaxProseAssumptionCandidatesPerSnapshot)
                break;

            if (!ProseAssumptionFaithfulnessValidator.IsSpanGrounded(candidate, documentBodiesByPath))
                continue;

            groundedCandidates.Add(candidate);
        }

        if (groundedCandidates.Count == 0)
            return [];

        return await _contradictionService.EmitContradictionsAsync(
            groundedCandidates,
            graphSnapshot,
            analysisContext,
            options.MaxProseAssumptionFindingsPerSnapshot,
            cancellationToken).ConfigureAwait(false);
    }

    private async Task AppendPremiumCandidatesAsync(
        IReadOnlyList<ContextDocumentRequest> documents,
        IReadOnlyDictionary<string, string> documentBodiesByPath,
        List<ProseAssumptionCandidate> candidates,
        int maxCandidates,
        CancellationToken cancellationToken)
    {
        if (maxCandidates <= 0 || candidates.Count >= maxCandidates)
            return;

        (IAgentCompletionClient completionClient, _) = _tierCompletionRouter.ResolveForAgentTypeName(
            InsightDensityJudgeAgentTypeNames.Judge,
            taskTierOverride: null);

        string systemPrompt = ProseAssumptionExtractionSystemPromptTemplate.GetText();
        string userPrompt = BuildUserPrompt(documents, maxCandidates - candidates.Count);

        try
        {
            string rawJson = await completionClient
                .CompleteJsonAsync(systemPrompt, userPrompt, maxTokens: null, cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            IReadOnlyList<ProseAssumptionCandidate> parsed = ProseAssumptionExtractionParser.TryParse(
                rawJson,
                maxCandidates - candidates.Count);

            foreach (ProseAssumptionCandidate candidate in parsed)
            {
                if (candidates.Count >= maxCandidates)
                    break;

                if (!ProseAssumptionFaithfulnessValidator.IsSpanGrounded(candidate, documentBodiesByPath))
                    continue;

                if (candidates.Any(existing =>
                        existing.DocumentPath.Equals(candidate.DocumentPath, StringComparison.OrdinalIgnoreCase)
                        && existing.LineNumber == candidate.LineNumber))
                    continue;

                candidates.Add(candidate);
            }
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Prose assumption Premium extraction failed; using deterministic scan only.");
        }
    }

    private static string BuildUserPrompt(IReadOnlyList<ContextDocumentRequest> documents, int maxCandidates)
    {
        List<string> sections = [];

        foreach (ContextDocumentRequest document in documents)
        {
            if (string.IsNullOrWhiteSpace(document.Name) || string.IsNullOrWhiteSpace(document.Content))
                continue;

            sections.Add($"### {document.Name}\n{document.Content}");
        }

        return $"Extract up to {maxCandidates} mapped assumptions.\n\n{string.Join("\n\n", sections)}";
    }

    private async Task<IReadOnlyList<ContextDocumentRequest>> LoadDocumentsAsync(
        FindingAnalysisContext? analysisContext,
        CancellationToken cancellationToken)
    {
        if (analysisContext is null || analysisContext.RunId == Guid.Empty)
            return [];

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? run = await _runRepository.GetByIdAsync(scope, analysisContext.RunId, cancellationToken)
            .ConfigureAwait(false);

        if (run is null || string.IsNullOrWhiteSpace(run.ArchitectureRequestId))
            return [];

        Contracts.Requests.ArchitectureRequest? request = await _architectureRequestRepository
            .GetByIdAsync(run.ArchitectureRequestId, cancellationToken)
            .ConfigureAwait(false);

        if (request?.Documents is null || request.Documents.Count == 0)
            return [];

        return request.Documents;
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
}
