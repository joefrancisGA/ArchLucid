using System.Data;

using ArchLucid.Persistence.RelationalRead;
using ArchLucid.Persistence.Sql;

using Dapper;

namespace ArchLucid.Persistence.GoldenManifests;

/// <summary>
///     Writes the phase-1 relational slices that mirror a manifest's JSON columns: assumptions, warnings, provenance
///     reference lists, and decisions with their evidence and node links.
/// </summary>
/// <remarks>
///     Slices are written row-by-row inside the caller's transaction. List position becomes <c>SortOrder</c>, which is
///     what lets the relational read reproduce the manifest's original ordering.
/// </remarks>
internal static class GoldenManifestRelationalWriter
{
    public static async Task InsertAllAsync(
        ManifestDocument manifest,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        await InsertAssumptionsAsync(manifest, connection, transaction, ct);
        await InsertWarningsAsync(manifest, connection, transaction, ct);
        await InsertProvenanceSourceFindingsAsync(manifest, connection, transaction, ct);
        await InsertProvenanceSourceGraphNodesAsync(manifest, connection, transaction, ct);
        await InsertProvenanceAppliedRulesAsync(manifest, connection, transaction, ct);
        await InsertDecisionsAsync(manifest, connection, transaction, ct);
    }

    /// <summary>
    ///     Inserts only the slices that are still empty, so a manifest saved before a slice table existed can be
    ///     backfilled from its JSON columns without duplicating slices that are already there.
    /// </summary>
    public static async Task BackfillEmptySlicesAsync(
        ManifestDocument manifest,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(connection);

        object sliceScope = GoldenManifestInsertParameters.SliceScope(manifest);

        if (manifest.Assumptions.Count > 0
            && await IsSliceEmptyAsync(GoldenManifestWriteSql.CountAssumptions, connection, transaction, sliceScope, ct))
            await InsertAssumptionsAsync(manifest, connection, transaction, ct);

        if (manifest.Warnings.Count > 0
            && await IsSliceEmptyAsync(GoldenManifestWriteSql.CountWarnings, connection, transaction, sliceScope, ct))
            await InsertWarningsAsync(manifest, connection, transaction, ct);

        if (manifest.Provenance.SourceFindingIds.Count > 0
            && await IsSliceEmptyAsync(GoldenManifestWriteSql.CountProvenanceSourceFindings, connection, transaction, sliceScope, ct))
            await InsertProvenanceSourceFindingsAsync(manifest, connection, transaction, ct);

        if (manifest.Provenance.SourceGraphNodeIds.Count > 0
            && await IsSliceEmptyAsync(GoldenManifestWriteSql.CountProvenanceSourceGraphNodes, connection, transaction, sliceScope, ct))
            await InsertProvenanceSourceGraphNodesAsync(manifest, connection, transaction, ct);

        if (manifest.Provenance.AppliedRuleIds.Count > 0
            && await IsSliceEmptyAsync(GoldenManifestWriteSql.CountProvenanceAppliedRules, connection, transaction, sliceScope, ct))
            await InsertProvenanceAppliedRulesAsync(manifest, connection, transaction, ct);

        if (manifest.Decisions.Count > 0
            && await IsSliceEmptyAsync(GoldenManifestWriteSql.CountDecisions, connection, transaction, sliceScope, ct))
            await InsertDecisionsAsync(manifest, connection, transaction, ct);
    }

    private static Task InsertAssumptionsAsync(
        ManifestDocument manifest,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct) =>
        InsertOrderedAsync(
            manifest.Assumptions,
            GoldenManifestWriteSql.InsertAssumption,
            (sortOrder, assumption) => new
            {
                manifest.ManifestId,
                SortOrder = sortOrder,
                AssumptionText = assumption,
                manifest.TenantId,
                manifest.WorkspaceId,
                manifest.ProjectId
            },
            connection,
            transaction,
            ct);

    private static Task InsertWarningsAsync(
        ManifestDocument manifest,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct) =>
        InsertOrderedAsync(
            manifest.Warnings,
            GoldenManifestWriteSql.InsertWarning,
            (sortOrder, warning) => new
            {
                manifest.ManifestId,
                SortOrder = sortOrder,
                WarningText = warning,
                manifest.TenantId,
                manifest.WorkspaceId,
                manifest.ProjectId
            },
            connection,
            transaction,
            ct);

    private static Task InsertProvenanceSourceFindingsAsync(
        ManifestDocument manifest,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct) =>
        InsertOrderedAsync(
            manifest.Provenance.SourceFindingIds,
            GoldenManifestWriteSql.InsertProvenanceSourceFinding,
            (sortOrder, findingId) => new
            {
                manifest.ManifestId,
                SortOrder = sortOrder,
                FindingId = findingId,
                manifest.TenantId,
                manifest.WorkspaceId,
                manifest.ProjectId
            },
            connection,
            transaction,
            ct);

    private static Task InsertProvenanceSourceGraphNodesAsync(
        ManifestDocument manifest,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct) =>
        InsertOrderedAsync(
            manifest.Provenance.SourceGraphNodeIds,
            GoldenManifestWriteSql.InsertProvenanceSourceGraphNode,
            (sortOrder, nodeId) => new
            {
                manifest.ManifestId,
                SortOrder = sortOrder,
                NodeId = nodeId,
                manifest.TenantId,
                manifest.WorkspaceId,
                manifest.ProjectId
            },
            connection,
            transaction,
            ct);

    private static Task InsertProvenanceAppliedRulesAsync(
        ManifestDocument manifest,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct) =>
        InsertOrderedAsync(
            manifest.Provenance.AppliedRuleIds,
            GoldenManifestWriteSql.InsertProvenanceAppliedRule,
            (sortOrder, ruleId) => new
            {
                manifest.ManifestId,
                SortOrder = sortOrder,
                RuleId = ruleId,
                manifest.TenantId,
                manifest.WorkspaceId,
                manifest.ProjectId
            },
            connection,
            transaction,
            ct);

    private static async Task InsertDecisionsAsync(
        ManifestDocument manifest,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        for (int sortOrder = 0; sortOrder < manifest.Decisions.Count; sortOrder++)
        {
            ResolvedArchitectureDecision decision = manifest.Decisions[sortOrder];

            await ExecuteAsync(
                GoldenManifestWriteSql.InsertDecision,
                GoldenManifestInsertParameters.DecisionRow(manifest, sortOrder, decision),
                connection,
                transaction,
                ct);

            await InsertDecisionEvidenceLinksAsync(manifest, decision, connection, transaction, ct);
            await InsertDecisionNodeLinksAsync(manifest, decision, connection, transaction, ct);
        }
    }

    private static Task InsertDecisionEvidenceLinksAsync(
        ManifestDocument manifest,
        ResolvedArchitectureDecision decision,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct) =>
        InsertOrderedAsync(
            decision.SupportingFindingIds,
            GoldenManifestWriteSql.InsertDecisionEvidenceLink,
            (sortOrder, findingId) => new
            {
                manifest.ManifestId,
                decision.DecisionId,
                SortOrder = sortOrder,
                FindingId = findingId,
                manifest.TenantId,
                manifest.WorkspaceId,
                manifest.ProjectId
            },
            connection,
            transaction,
            ct);

    private static Task InsertDecisionNodeLinksAsync(
        ManifestDocument manifest,
        ResolvedArchitectureDecision decision,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct) =>
        InsertOrderedAsync(
            decision.RelatedNodeIds,
            GoldenManifestWriteSql.InsertDecisionNodeLink,
            (sortOrder, nodeId) => new
            {
                manifest.ManifestId,
                decision.DecisionId,
                SortOrder = sortOrder,
                NodeId = nodeId,
                manifest.TenantId,
                manifest.WorkspaceId,
                manifest.ProjectId
            },
            connection,
            transaction,
            ct);

    /// <param name="toParameters">Projects a list index and its value into the statement's Dapper parameters.</param>
    private static async Task InsertOrderedAsync<TValue>(
        IReadOnlyList<TValue> values,
        string sql,
        Func<int, TValue, object> toParameters,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        for (int sortOrder = 0; sortOrder < values.Count; sortOrder++)
        {
            await ExecuteAsync(sql, toParameters(sortOrder, values[sortOrder]), connection, transaction, ct);
        }
    }

    private static async Task<bool> IsSliceEmptyAsync(
        string countSql,
        IDbConnection connection,
        IDbTransaction? transaction,
        object sliceScope,
        CancellationToken ct)
    {
        int count = await SqlRelationalScalarCount
            .ExecuteAsync(connection, transaction, countSql, sliceScope, ct)
            .ConfigureAwait(false);

        return count == 0;
    }

    private static async Task ExecuteAsync(
        string sql,
        object parameters,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct) =>
        await connection
            .ExecuteAsync(new CommandDefinition(sql, parameters, transaction, cancellationToken: ct))
            .ConfigureAwait(false);
}
