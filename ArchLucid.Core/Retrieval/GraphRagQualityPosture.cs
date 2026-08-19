using ArchLucid.Core.Hosting;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Retrieval;

/// <summary>
///     Run-level Graph-RAG quality posture derived from hosting vector-index configuration (TB-596).
/// </summary>
public static class GraphRagQualityPosture
{
    public const string ProvenValue = "proven";

    public const string UnprovenValue = "unproven";

    /// <summary>
    ///     Returns <see cref="ProvenValue"/> or <see cref="UnprovenValue"/> when Graph-RAG expansion was used on the run; otherwise <see langword="null"/>.
    /// </summary>
    public static string? ResolveForGroundedRun(
        IConfiguration configuration,
        int totalGraphRagNeighborsAdded,
        int totalGraphRagSeedHits)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        if (totalGraphRagNeighborsAdded <= 0 && totalGraphRagSeedHits <= 0)
            return null;

        return GraphRagProductionLikeConfigurationLint.HasAzureSearchPosture(configuration)
            ? ProvenValue
            : UnprovenValue;
    }
}
