using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Builds <see cref="AgentTrustContext" /> for finding inspect from persisted run + trace metadata (TB-2066).
/// </summary>
public static class FindingInspectTrustContextResolver
{
    public static AgentTrustContext Resolve(FindingInspectResponse response)
    {
        ArgumentNullException.ThrowIfNull(response);

        StructuralExecutionMode structuralMode = response.RunStructuralExecutionMode ?? StructuralExecutionMode.Real;
        bool realModeFellBackToSimulator = response.RunRealModeFellBackToSimulator ?? false;

        bool isSimulator = structuralMode == StructuralExecutionMode.Simulator
            || IsSimulatorTraceDeployment(response.ModelDeploymentName);

        bool isRealRun = structuralMode == StructuralExecutionMode.Real;

        bool isDegraded = realModeFellBackToSimulator
            || structuralMode == StructuralExecutionMode.Fallback
            || AgentExecutionTraceDegradationProbe.LlmResourceFallbackModelDeployment(response.ModelDeploymentName);

        bool isRealModel = isRealRun && !isDegraded && !isSimulator;

        return new AgentTrustContext(isSimulator, isDegraded, isRealModel);
    }

    private static bool IsSimulatorTraceDeployment(string? modelDeploymentName) =>
        string.Equals(
            modelDeploymentName,
            AgentExecutionTraceModelMetadata.SimulatorDeploymentName,
            StringComparison.Ordinal);
}
