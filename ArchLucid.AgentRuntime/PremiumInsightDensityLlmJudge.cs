using System.Diagnostics;

using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Findings;

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

    private readonly ILogger<PremiumInsightDensityLlmJudge> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<int> ApplyToFindingsAsync(
        IReadOnlyList<Finding> findings,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(findings);

        InsightDensityGateOptions options = _gateOptionsResolver.Resolve(cancellationToken);

        if (!IsLlmJudgeOperational() || !options.EnableLlmJudgeForEngineFindings)
        {
            return 0;
        }

        List<Finding> candidates = findings
            .Where(IsEngineJudgeCandidate)
            .ToList();

        if (candidates.Count == 0)
        {
            return 0;
        }

        (IReadOnlyList<Finding> judgedFindings, int skippedByCap) = SelectJudgedCandidates(
            candidates,
            options.MaxJudgedFindingsPerSnapshot);

        if (skippedByCap > 0)
        {
            RecordSkippedByCap(JudgePathEngine, skippedByCap);
        }

        if (judgedFindings.Count == 0)
        {
            return skippedByCap;
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

        return skippedByCap;
    }

    /// <inheritdoc />
    public async Task<int> ApplyToArchitectureFindingsAsync(
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
            return 0;
        }

        InsightDensityGateOptions options = _gateOptionsResolver.Resolve(cancellationToken);

        List<ArchitectureFinding> candidates = findings
            .Where(static finding => finding.Treatment == FindingTreatment.Promote)
            .ToList();

        if (candidates.Count == 0)
        {
            return 0;
        }

        (IReadOnlyList<ArchitectureFinding> judgedFindings, int skippedByCap) = SelectJudgedArchitectureCandidates(
            candidates,
            options.MaxJudgedFindingsPerSnapshot);

        if (skippedByCap > 0)
        {
            RecordSkippedByCap(JudgePathArchitecture, skippedByCap);
        }

        if (judgedFindings.Count == 0)
        {
            return skippedByCap;
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

        return skippedByCap;
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
}
