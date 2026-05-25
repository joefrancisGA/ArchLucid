namespace ArchLucid.Core.Configuration;

/// <summary>
///     Optional post-evaluation gate on persisted agent JSON (structural + semantic scores). On by default with
///     calibrated default warn/reject floors (reject floors classify traces; <see cref="EnforceOnReject" /> remains off
///     for V1); set <see cref="Enabled" /> to false
///     to disable.
/// </summary>
public sealed class AgentOutputQualityGateOptions
{
    public const string SectionPath = "ArchLucid:AgentOutput:QualityGate";

    /// <summary>
    ///     Operational posture for citation/evidence handling and PilotStrict sponsor-facing gates.
    ///     Defaults to <see cref="AgentOutputQualityGateMode.WarnOnly"/>.
    /// </summary>
    public AgentOutputQualityGateMode Mode
    {
        get;
        set;
    } = AgentOutputQualityGateMode.WarnOnly;

    /// <summary>
    ///     When <see cref="Mode"/> is <see cref="AgentOutputQualityGateMode.PilotStrict"/>, structural completeness ratios
    ///     strictly below this yield reject outcomes (after base gate evaluation). Ignored in warn-only mode.
    /// </summary>
    public double PilotStrictMinStructuralCompleteness
    {
        get;
        set;
    } = 0.90;

    /// <summary>
    ///     When <see cref="Mode"/> is <see cref="AgentOutputQualityGateMode.PilotStrict"/>, semantic scores strictly below
    ///     this yield reject outcomes. Ignored in warn-only mode.
    /// </summary>
    public double PilotStrictMinSemanticScore
    {
        get;
        set;
    } = 0.50;

    /// <summary>
    ///     When non-zero and mode is <see cref="AgentOutputQualityGateMode.PilotStrict"/>, the top-level JSON
    ///     <c>evidenceRefs</c> array length must meet this minimum or the trace is rejected.
    /// </summary>
    public int PilotStrictMinEvidenceRefCount
    {
        get;
        set;
    } = 2;

    /// <summary>
    ///     Optional aggregate explanation faithfulness floor for sponsor proof when mode is PilotStrict.
    ///     When set, values strictly below this on <see cref="Explanation.RunExplanationSummary.FaithfulnessSupportRatio"/>
    ///     block sponsor-sendable classification (trace evaluation already ran).
    /// </summary>
    public double? PilotStrictMinFaithfulnessSupportRatio
    {
        get;
        set;
    }

    /// <summary>
    ///     PilotStrict floor on deterministic AgentResult→evidence grounding (token overlap + resolved refs).
    ///     Required when <see cref="Mode"/> is <see cref="AgentOutputQualityGateMode.PilotStrict"/> (startup validation).
    ///     When set with evidence available, values strictly below AgentResultFaithfulnessSupportRatio on the semantic score reject the trace.
    /// </summary>
    public double? PilotStrictMinAgentResultFaithfulnessSupportRatio
    {
        get;
        set;
    }

    /// <summary>
    ///     When true, the heuristic semantic evaluator applies stricter length / overlap / proposed-change checks (production-like posture).
    /// </summary>
    public bool HeuristicEvaluatorTightenedThresholds
    {
        get;
        set;
    }

    /// <summary>When false, the gate always accepts and emits no gate metrics.</summary>
    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>Structural ratio below this yields <c>warned</c> unless <see cref="StructuralRejectBelow" /> triggers first.</summary>
    public double StructuralWarnBelow
    {
        get;
        set;
    } = 0.85;

    /// <summary>Semantic score below this yields <c>warned</c> unless <see cref="SemanticRejectBelow" /> triggers first.</summary>
    public double SemanticWarnBelow
    {
        get;
        set;
    } = 0.65;

    /// <summary>
    ///     Structural ratio strictly below this yields <c>rejected</c>. Set above zero in production to classify poor
    ///     outputs; pair with <see cref="EnforceOnReject" /> to throw. Zero disables reject classification (warn-only posture).
    /// </summary>
    public double StructuralRejectBelow
    {
        get;
        set;
    }

    /// <summary>
    ///     Semantic score strictly below this yields <c>rejected</c>. Set above zero in production; zero disables reject
    ///     classification until explicitly configured (see base <c>appsettings.json</c>).
    /// </summary>
    public double SemanticRejectBelow
    {
        get;
        set;
    }

    /// <summary>
    ///     Optional per-agent overrides for warn/reject floors. Dictionary keys match
    ///     <see cref="ArchLucid.Contracts.Common.AgentType" /> string names (case-insensitive bind).
    /// </summary>
    public Dictionary<string, AgentTypeQualityFloors> PerAgentTypeFloors
    {
        get;
        set;
    } = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    ///     When <c>true</c>, a <c>Rejected</c> outcome causes
    ///     <c>AgentOutputEvaluationRecorder.EvaluateAndRecordMetricsAsync</c> to throw
    ///     <see cref="AgentOutputQualityGateRejectedException" /> after emitting metrics and logs.
    ///     Defaults to <c>false</c> so existing behaviour (metrics-only) is preserved until a product
    ///     decision explicitly enables enforcement.
    /// </summary>
    public bool EnforceOnReject
    {
        get;
        set;
    } = false;

    /// <summary>
    ///     When <c>true</c> with <see cref="EnforceOnReject" />, <c>AgentOutputQualityGateRejectedException</c> is not
    ///     swallowed by the architecture run execute orchestrator: the run is marked
    ///     <c>ExecutionCompletedQualityRejected</c> and the exception propagates (HTTP 409 from the API filter).
    ///     Defaults to <c>false</c>; <see cref="EnforceOnReject" /> alone only fails the trace-evaluation hook without
    ///     changing run completion.
    /// </summary>
    public bool BlockRunOnReject
    {
        get;
        set;
    }

    /// <summary>
    ///     When a per-run token or USD cap (<see cref="MaxTokensPerRun" />, <see cref="MaxCostPerRun" />) is exceeded
    ///     after at least one agent handler returns, persist completed <see cref="ArchLucid.Contracts.Agents.AgentResult" />
    ///     rows plus evidence (orchestrator path). When false, the executor fails the batch without partial persistence.
    /// </summary>
    public bool PersistPartialOutputsOnBudgetExceeded
    {
        get;
        set;
    } = true;

    /// <summary>
    ///     Maximum allowed tokens per run. If exceeded, a CostLimitExceededException is thrown.
    ///     Null means no limit.
    /// </summary>
    public int? MaxTokensPerRun
    {
        get;
        set;
    }

    /// <summary>
    ///     Maximum allowed cost (USD) per run. If exceeded, a CostLimitExceededException is thrown.
    ///     Null means no limit.
    /// </summary>
    public decimal? MaxCostPerRun
    {
        get;
        set;
    }
}
