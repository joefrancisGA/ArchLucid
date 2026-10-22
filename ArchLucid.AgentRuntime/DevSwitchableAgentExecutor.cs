using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.DevTesting;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Development-only <see cref="IAgentExecutor" /> that routes to <see cref="RealAgentExecutor" /> or
///     <see cref="SimulatorExecutionTraceRecordingExecutor" /> based on
///     <see cref="IEffectiveAgentExecutionModeAccessor" />.
/// </summary>
public sealed class DevSwitchableAgentExecutor(
    RealAgentExecutor realExecutor,
    SimulatorExecutionTraceRecordingExecutor simulatorExecutor,
    IEffectiveAgentExecutionModeAccessor effectiveModeAccessor) : IAgentExecutor
{
    private readonly RealAgentExecutor _realExecutor =
        realExecutor ?? throw new ArgumentNullException(nameof(realExecutor));

    private readonly SimulatorExecutionTraceRecordingExecutor _simulatorExecutor =
        simulatorExecutor ?? throw new ArgumentNullException(nameof(simulatorExecutor));

    private readonly IEffectiveAgentExecutionModeAccessor _effectiveModeAccessor =
        effectiveModeAccessor ?? throw new ArgumentNullException(nameof(effectiveModeAccessor));

    /// <inheritdoc />
    public Task<IReadOnlyList<AgentResult>> ExecuteAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IReadOnlyCollection<AgentTask> tasks,
        CancellationToken cancellationToken = default)
    {
        bool useSimulator = string.Equals(
            _effectiveModeAccessor.GetEffectiveMode(),
            DevAgentExecutionModeHeaderNames.Simulator,
            StringComparison.OrdinalIgnoreCase);

        IAgentExecutor executor = useSimulator ? _simulatorExecutor : _realExecutor;

        return executor.ExecuteAsync(runId, request, evidence, tasks, cancellationToken);
    }
}
