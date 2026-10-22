namespace ArchLucid.Core.DevTesting;

/// <summary>
///     Resolves the effective host <c>AgentExecution:Mode</c> for the current HTTP request.
/// </summary>
public interface IEffectiveAgentExecutionModeAccessor
{
    /// <summary>Returns <see cref="DevAgentExecutionModeHeaderNames.Real" /> or <see cref="DevAgentExecutionModeHeaderNames.Simulator" />.</summary>
    string GetEffectiveMode();
}
