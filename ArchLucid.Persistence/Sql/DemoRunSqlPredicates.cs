namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Shared SQL fragments that exclude Contoso showcase/demo/sample runs from buyer-facing aggregates
///     and reference-evidence anchor selection.
/// </summary>
internal static class DemoRunSqlPredicates
{
    /// <summary>Canonical brownfield showcase baseline authority run id (default-tenant demo seed).</summary>
    internal static readonly Guid CanonicalShowcaseRunBaselineId =
        Guid.Parse("6e8c4a10-2b1f-4c9a-9d3e-10b2a4f0c501");

    /// <summary>Canonical brownfield showcase hardened authority run id (default-tenant demo seed).</summary>
    internal static readonly Guid CanonicalShowcaseRunHardenedId =
        Guid.Parse("6e8c4a10-2b1f-4c9a-9d3e-10b2a4f0c502");

    /// <summary>
    ///     Predicate for a <c>dbo.Runs</c> row alias — excludes demo/sample/showcase runs and canonical showcase ids.
    /// </summary>
    internal const string ExcludeShowcaseDemoRunsForAliasR =
        "r.IsDemoWelcomeRun = 0"
        + " AND r.IsPublicShowcase = 0"
        + " AND r.IsSample = 0"
        + " AND r.ArchitectureRequestId <> N'request-contoso-demo'"
        + " AND r.ArchitectureRequestId NOT LIKE N'req-contoso-demo-%'"
        + " AND r.ArchitectureRequestId NOT LIKE N'req-trial-welcome-%'"
        + " AND r.RunId NOT IN (@CanonicalShowcaseRunBaselineId, @CanonicalShowcaseRunHardenedId)";

    /// <summary>Same predicate as <see cref="ExcludeShowcaseDemoRunsForAliasR"/> for alias <c>rInner</c>.</summary>
    internal const string ExcludeShowcaseDemoRunsForAliasRInner =
        "rInner.IsDemoWelcomeRun = 0"
        + " AND rInner.IsPublicShowcase = 0"
        + " AND rInner.IsSample = 0"
        + " AND rInner.ArchitectureRequestId <> N'request-contoso-demo'"
        + " AND rInner.ArchitectureRequestId NOT LIKE N'req-contoso-demo-%'"
        + " AND rInner.ArchitectureRequestId NOT LIKE N'req-trial-welcome-%'"
        + " AND rInner.RunId NOT IN (@CanonicalShowcaseRunBaselineId, @CanonicalShowcaseRunHardenedId)";

    /// <summary>
    ///     Predicate for a <c>dbo.Runs</c> row alias — excludes demo/sample/showcase runs and canonical showcase ids.
    /// </summary>
    internal static string ExcludeShowcaseDemoRuns(string runsAlias)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runsAlias);

        if (string.Equals(runsAlias, "r", StringComparison.Ordinal))
            return ExcludeShowcaseDemoRunsForAliasR;

        if (string.Equals(runsAlias, "rInner", StringComparison.Ordinal))
            return ExcludeShowcaseDemoRunsForAliasRInner;

        return
            $"{runsAlias}.IsDemoWelcomeRun = 0" +
            $" AND {runsAlias}.IsPublicShowcase = 0" +
            $" AND {runsAlias}.IsSample = 0" +
            $" AND {runsAlias}.ArchitectureRequestId <> N'request-contoso-demo'" +
            $" AND {runsAlias}.ArchitectureRequestId NOT LIKE N'req-contoso-demo-%'" +
            $" AND {runsAlias}.ArchitectureRequestId NOT LIKE N'req-trial-welcome-%'" +
            $" AND {runsAlias}.RunId NOT IN (@CanonicalShowcaseRunBaselineId, @CanonicalShowcaseRunHardenedId)";
    }
}
