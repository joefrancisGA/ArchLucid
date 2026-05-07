namespace ArchLucid.Core.Configuration;

/// <summary>
///     Controls how strict structural/citation/evidence checks are before sponsor-facing proof classification.
///     Default <see cref="WarnOnly"/> preserves legacy behaviour unless <see cref="AgentOutputQualityGateOptions.Mode"/> is changed.
/// </summary>
public enum AgentOutputQualityGateMode
{
    /// <summary>
    ///     Score floors remain driven by <see cref="AgentOutputQualityGateOptions.StructuralRejectBelow"/> /
    ///     <see cref="AgentOutputQualityGateOptions.SemanticRejectBelow"/>; missing citations downgrade to a warned outcome
    ///     instead of automatic reject.
    /// </summary>
    WarnOnly = 0,

    /// <summary>
    ///     Stricter pilot posture: parse failures, missing citations, optional evidence-ref floors, configured PilotStrict
    ///     score mins, and optional aggregate explanation faithfulness minimum can surface as reject outcomes and sponsor blocks.
    /// </summary>
    PilotStrict = 1
}
