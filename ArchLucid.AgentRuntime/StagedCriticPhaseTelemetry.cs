using System.Diagnostics;

using ArchLucid.Core.Diagnostics;

namespace ArchLucid.AgentRuntime;

internal static class StagedCriticPhaseTelemetry
{
    internal static void RecordPhaseCompleted(Activity? activity, string phase, double durationMilliseconds)
    {
        activity?.SetTag("archlucid.staged_critic.phase", phase);
        activity?.SetTag("archlucid.staged_critic.phase_duration_ms", durationMilliseconds);

        ArchLucidInstrumentation.AgentExecutionStagedCriticPhaseDurationMilliseconds.Record(
            durationMilliseconds,
            new KeyValuePair<string, object?>("phase", phase),
            new KeyValuePair<string, object?>("outcome", "success"));
    }
}
