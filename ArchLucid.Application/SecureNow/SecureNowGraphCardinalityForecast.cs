namespace ArchLucid.Application.SecureNow;

/// <summary>
/// Deterministic graph path-expansion envelope, not an observed path count.
/// Requires calibration using real SecureNow graph traversal benchmarks.
/// </summary>
public static class SecureNowGraphCardinalityForecast
{
    public sealed record Input(
        long NodeCount, long EdgeCount, int MaximumHopDepth,
        long SeedNodeCount, int MaximumBranchingFactor);

    public sealed record Result(
        long NodeCount, long EdgeCount, decimal MeanOutDegree,
        long ExpansionUpperBound, bool Saturated,
        string EvidenceStatus);

    public static Result Estimate(Input input)
    {
        ArgumentNullException.ThrowIfNull(input);
        if (input.NodeCount < 0 || input.EdgeCount < 0 || input.SeedNodeCount < 0 ||
            input.MaximumHopDepth is < 0 or > 64 || input.MaximumBranchingFactor < 0)
            throw new ArgumentOutOfRangeException(nameof(input), "Graph counts and traversal limits must be nonnegative.");
        if ((input.NodeCount == 0 && (input.EdgeCount != 0 || input.SeedNodeCount != 0)) ||
            input.SeedNodeCount > input.NodeCount)
            throw new ArgumentException("Edges and seeds must belong to a nonempty graph.", nameof(input));

        decimal mean = input.NodeCount == 0 ? 0 : (decimal)input.EdgeCount / input.NodeCount;
        long frontier = input.SeedNodeCount;
        long total = 0;
        bool saturated = false;
        // Sum candidate path prefixes, not distinct vertices. Cycles, visited-node rules,
        // path constraints and topology can make the real count much smaller.
        for (int depth = 0; depth <= input.MaximumHopDepth; depth++)
        {
            if (long.MaxValue - total < frontier)
            {
                saturated = true;
                total = long.MaxValue;
                break;
            }
            total += frontier;
            if (frontier == 0 || depth == input.MaximumHopDepth) break;
            int branch = input.MaximumBranchingFactor;
            if (branch != 0 && frontier > long.MaxValue / branch)
            {
                saturated = true;
                total = long.MaxValue;
                break;
            }
            frontier *= branch;
        }
        return new Result(input.NodeCount, input.EdgeCount, mean, total, saturated,
            "THEORETICAL_ENVELOPE_UNCALIBRATED");
    }
}
