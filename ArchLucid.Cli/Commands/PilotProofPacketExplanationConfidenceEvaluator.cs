using ArchLucid.Core.Explanation;

namespace ArchLucid.Cli.Commands;

/// <summary>Maps aggregate explanation JSON to sponsor-safe PASS/WARN/HOLD (assessment #20).</summary>
internal static class PilotProofPacketExplanationConfidenceEvaluator
{
    internal static string ResolveDisposition(string? aggregateJson)
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(aggregateJson);

        return RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals);
    }

    internal static string? BuildLimitationsLine(string? aggregateJson)
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(aggregateJson);

        return RunExplanationConfidenceCalloutBuilder.BuildLimitationsLine(signals);
    }
}
