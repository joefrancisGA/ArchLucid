using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Application.Runs;
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

        StructuralExecutionMode? structuralMode = response.RunStructuralExecutionMode;
        bool realModeFellBackToSimulator = response.RunRealModeFellBackToSimulator ?? false;

        bool isSimulator = structuralMode is StructuralExecutionMode.Simulator or StructuralExecutionMode.Mixed
            || IsSimulatorTraceDeployment(response.ModelDeploymentName);

        bool isRealRun = StructuralExecutionModeHonesty.ShouldTreatRunAsLiveModel(structuralMode);

        bool isDegraded = realModeFellBackToSimulator
            || structuralMode is StructuralExecutionMode.Fallback or StructuralExecutionMode.Mixed
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
