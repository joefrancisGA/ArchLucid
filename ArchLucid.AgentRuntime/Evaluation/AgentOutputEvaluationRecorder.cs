using System.Diagnostics;
using System.Text.Json;

using ArchLucid.AgentRuntime.Evaluation.ReferenceCases;
using ArchLucid.AgentRuntime.Prompts.Variants;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.QualityGates;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
///     Loads traces for a run, scores parsed JSON shape and semantic quality, and emits OTEL metrics (intended for
///     post-run or batch jobs).
/// </summary>
public sealed partial class AgentOutputEvaluationRecorder(
    IAgentExecutionTraceRepository traceRepository,
    IAgentEvidencePackageRepository agentEvidencePackageRepository,
    IAgentResultRepository agentResultRepository,
    IScopeContextProvider scopeContextProvider,
    IAgentOutputEvaluator evaluator,
    IAgentOutputSemanticEvaluator semanticEvaluator,
    IAgentOutputQualityGate qualityGate,
    IAgentOutputQualityGateOptionsResolver gateOptionsResolver,
    IAgentConfidenceCalibrationService confidenceCalibrationService,
    IAgentConfidenceCalibrationSampleRepository calibrationSampleRepository,
    IOptions<AgentConfidenceCalibrationOptions> calibrationOptions,
    AgentOutputReferenceCaseRunEvaluator referenceCaseRunEvaluator,
    Contracts.Findings.IAgentArchitectureFindingConfidenceEnricher architectureFindingConfidenceEnricher,
    IAgentResultEvidenceFaithfulnessChecker agentResultEvidenceFaithfulnessChecker,
    IAgentResultEmbeddingFaithfulnessScorer embeddingFaithfulnessScorer,
    IAgentOutputFaithfulnessEvaluator llmFaithfulnessEvaluator,
    IOptionsMonitor<AgentOutputLlmFaithfulnessOptions> llmFaithfulnessOptions,
    IAuditService auditService,
    IAgentOutputEvaluationRepository agentOutputEvaluationRepository,
    IOptionsMonitor<AgentExecutionOptions> agentExecutionOptions,
    ILogger<AgentOutputEvaluationRecorder> logger)
{
    private const double LowStructuralScoreThreshold = 0.5;

    /// <summary>
    ///     Log when semantic score is critically low (product/docs threshold; quality gate uses
    ///     <see cref="AgentOutputQualityGateOptions" />).
    /// </summary>
    private const double LowSemanticScoreThreshold = 0.3;

    private readonly IAgentOutputQualityGateOptionsResolver _gateOptionsResolver =
        gateOptionsResolver ?? throw new ArgumentNullException(nameof(gateOptionsResolver));

    private readonly AgentOutputReferenceCaseRunEvaluator _referenceCaseRunEvaluator =
        referenceCaseRunEvaluator ?? throw new ArgumentNullException(nameof(referenceCaseRunEvaluator));

    private readonly Contracts.Findings.IAgentArchitectureFindingConfidenceEnricher _architectureFindingConfidenceEnricher =
        architectureFindingConfidenceEnricher ??
        throw new ArgumentNullException(nameof(architectureFindingConfidenceEnricher));

    private readonly IAgentResultRepository _agentResultRepository =
        agentResultRepository ?? throw new ArgumentNullException(nameof(agentResultRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAgentConfidenceCalibrationService _confidenceCalibrationService =
        confidenceCalibrationService ?? throw new ArgumentNullException(nameof(confidenceCalibrationService));

    private readonly IAgentConfidenceCalibrationSampleRepository _calibrationSampleRepository =
        calibrationSampleRepository ?? throw new ArgumentNullException(nameof(calibrationSampleRepository));

    private readonly AgentConfidenceCalibrationOptions _calibrationOptions =
        (calibrationOptions ?? throw new ArgumentNullException(nameof(calibrationOptions))).Value;

    private readonly IAgentResultEmbeddingFaithfulnessScorer _embeddingFaithfulnessScorer =
        embeddingFaithfulnessScorer ?? throw new ArgumentNullException(nameof(embeddingFaithfulnessScorer));

    private readonly IAgentOutputFaithfulnessEvaluator _llmFaithfulnessEvaluator =
        llmFaithfulnessEvaluator ?? throw new ArgumentNullException(nameof(llmFaithfulnessEvaluator));

    private readonly IOptionsMonitor<AgentOutputLlmFaithfulnessOptions> _llmFaithfulnessOptions =
        llmFaithfulnessOptions ?? throw new ArgumentNullException(nameof(llmFaithfulnessOptions));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IAgentOutputEvaluationRepository _agentOutputEvaluationRepository =
        agentOutputEvaluationRepository ?? throw new ArgumentNullException(nameof(agentOutputEvaluationRepository));

    private readonly IOptionsMonitor<AgentExecutionOptions> _agentExecutionOptions =
        agentExecutionOptions ?? throw new ArgumentNullException(nameof(agentExecutionOptions));
}
