using System.Data;

using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Sql;

using Dapper;

namespace ArchLucid.Persistence.Findings;

internal static partial class FindingRelationalWriter
{
    private static async Task InsertFindingChildrenAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid findingRecordId,
        Finding finding,
        FindingRelationalScope scope,
        CancellationToken ct)
    {
        await InsertNodeIdRowsAsync(
            connection,
            transaction,
            findingRecordId,
            scope,
            FindingChildInsertQueryShapes.RelatedNodesInsert,
            finding.RelatedNodeIds,
            ct);

        await InsertTextRowsAsync(
            connection,
            transaction,
            findingRecordId,
            scope,
            FindingChildInsertQueryShapes.RecommendedActionsInsert,
            finding.RecommendedActions,
            ct);

        await InsertPropertyRowsAsync(connection, transaction, findingRecordId, scope, finding.Properties, ct);

        await InsertNodeIdRowsAsync(
            connection,
            transaction,
            findingRecordId,
            scope,
            FindingChildInsertQueryShapes.TraceGraphNodesExaminedInsert,
            finding.Trace.GraphNodeIdsExamined,
            ct);

        await InsertTextRowsAsync(
            connection,
            transaction,
            findingRecordId,
            scope,
            FindingChildInsertQueryShapes.TraceRulesAppliedInsert,
            finding.Trace.RulesApplied,
            ct);

        await InsertTextRowsAsync(
            connection,
            transaction,
            findingRecordId,
            scope,
            FindingChildInsertQueryShapes.TraceDecisionsTakenInsert,
            finding.Trace.DecisionsTaken,
            ct);

        await InsertTextRowsAsync(
            connection,
            transaction,
            findingRecordId,
            scope,
            FindingChildInsertQueryShapes.TraceAlternativePathsInsert,
            finding.Trace.AlternativePathsConsidered,
            ct);

        await InsertTextRowsAsync(
            connection,
            transaction,
            findingRecordId,
            scope,
            FindingChildInsertQueryShapes.TraceNotesInsert,
            finding.Trace.Notes,
            ct);
    }

    private static async Task InsertNodeIdRowsAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid findingRecordId,
        FindingRelationalScope scope,
        string sql,
        IReadOnlyList<string> nodeIds,
        CancellationToken ct)
    {
        if (nodeIds.Count == 0)
            return;

        DataTable rows = FindingChildTableValuedParameters.CreateSortNodeIdTable(nodeIds);

        await ExecuteChildInsertAsync(
            connection,
            transaction,
            findingRecordId,
            scope,
            sql,
            rows,
            FindingChildTableValuedParameters.SortNodeIdListTypeName,
            ct);
    }

    private static async Task InsertTextRowsAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid findingRecordId,
        FindingRelationalScope scope,
        string sql,
        IReadOnlyList<string> textRows,
        CancellationToken ct)
    {
        if (textRows.Count == 0)
            return;

        DataTable rows = FindingChildTableValuedParameters.CreateSortTextTable(textRows);

        await ExecuteChildInsertAsync(
            connection,
            transaction,
            findingRecordId,
            scope,
            sql,
            rows,
            FindingChildTableValuedParameters.SortTextListTypeName,
            ct);
    }

    private static async Task ExecuteChildInsertAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid findingRecordId,
        FindingRelationalScope scope,
        string sql,
        DataTable rows,
        string tableTypeName,
        CancellationToken ct)
    {
        DynamicParameters parameters = FindingChildTableValuedParameters.CreateScopeParameters(
            findingRecordId,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            rows,
            tableTypeName);

        await connection.ExecuteAsync(new CommandDefinition(sql, parameters, transaction, cancellationToken: ct));
    }
}
