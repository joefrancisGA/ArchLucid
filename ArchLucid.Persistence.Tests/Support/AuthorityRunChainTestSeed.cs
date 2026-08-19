using System.Data;

using ArchLucid.ContextIngestion.Models;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Serialization;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Support;

/// <summary>
///     Seeds the minimal Runs / ContextSnapshots / GraphSnapshots / FindingsSnapshots / DecisioningTraces chain
///     required before persisting a <see cref="ArchLucid.Core.Manifest.ManifestDocument" /> under FK constraints.
/// </summary>
public static class AuthorityRunChainTestSeed
{
    /// <summary>Inserts <c>dbo.Runs</c> only (FK target for <c>DecisioningTraces.RunId</c>).</summary>
    public static async Task InsertRunAsync(
        SqlConnection connection,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid runId,
        string projectSlug,
        CancellationToken ct,
        IDbTransaction? transaction = null)
    {
        const string insertRun = """
                                 INSERT INTO dbo.Runs (RunId, ProjectId, CreatedUtc, TenantId, WorkspaceId, ScopeProjectId)
                                 VALUES (@RunId, @ProjectId, @CreatedUtc, @TenantId, @WorkspaceId, @ScopeProjectId);
                                 """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertRun,
                new
                {
                    RunId = runId,
                    ProjectId = projectSlug,
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = projectId
                },
                transaction,
                cancellationToken: ct));
    }

    /// <summary>
    ///     Inserts <c>dbo.Runs</c> and <c>dbo.ContextSnapshots</c> only (for tests that insert <c>dbo.GraphSnapshots</c>
    ///     headers directly).
    /// </summary>
    public static async Task SeedRunAndContextOnlyAsync(
        SqlConnection connection,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid runId,
        Guid contextSnapshotId,
        string projectSlug,
        CancellationToken ct)
    {
        await InsertRunAsync(connection, tenantId, workspaceId, projectId, runId, projectSlug, ct);

        string emptyCanonical = JsonEntitySerializer.Serialize(new List<CanonicalObject>());
        string emptyList = JsonEntitySerializer.Serialize(new List<string>());

        await InsertContextSnapshotHeaderAsync(
            connection,
            tenantId,
            workspaceId,
            projectId,
            contextSnapshotId,
            runId,
            projectSlug,
            TimeProvider.System.UtcNowDateTime(),
            emptyCanonical,
            null,
            emptyList,
            emptyList,
            JsonEntitySerializer.Serialize(new Dictionary<string, string>()),
            ct);
    }

    /// <summary>Direct INSERT into <c>dbo.ContextSnapshots</c> (JSON columns; greenfield requires RLS scope columns).</summary>
    public static async Task InsertContextSnapshotHeaderAsync(
        SqlConnection connection,
        Guid tenantId,
        Guid workspaceId,
        Guid scopeProjectId,
        Guid snapshotId,
        Guid runId,
        string projectId,
        DateTime createdUtc,
        string canonicalObjectsJson,
        string? deltaSummary,
        string warningsJson,
        string errorsJson,
        string sourceHashesJson,
        CancellationToken ct,
        IDbTransaction? transaction = null)
    {
        const string insertContext = """
                                     INSERT INTO dbo.ContextSnapshots
                                     (
                                         SnapshotId, RunId, ProjectId, TenantId, WorkspaceId, ScopeProjectId, CreatedUtc,
                                         CanonicalObjectsJson, DeltaSummary, WarningsJson, ErrorsJson, SourceHashesJson
                                     )
                                     VALUES
                                     (
                                         @SnapshotId, @RunId, @ProjectId, @TenantId, @WorkspaceId, @ScopeProjectId, @CreatedUtc,
                                         @CanonicalObjectsJson, @DeltaSummary, @WarningsJson, @ErrorsJson, @SourceHashesJson
                                     );
                                     """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertContext,
                new
                {
                    SnapshotId = snapshotId,
                    RunId = runId,
                    ProjectId = projectId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = scopeProjectId,
                    CreatedUtc = createdUtc,
                    CanonicalObjectsJson = canonicalObjectsJson,
                    DeltaSummary = deltaSummary,
                    WarningsJson = warningsJson,
                    ErrorsJson = errorsJson,
                    SourceHashesJson = sourceHashesJson
                },
                transaction,
                cancellationToken: ct));
    }

    /// <inheritdoc cref="AuthorityRunChainTestSeed" />
    public static async Task SeedFullChainAsync(
        SqlConnection connection,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid runId,
        Guid contextSnapshotId,
        Guid graphSnapshotId,
        Guid findingsSnapshotId,
        Guid decisionTraceId,
        string projectSlug,
        CancellationToken ct)
    {
        await InsertRunAsync(connection, tenantId, workspaceId, projectId, runId, projectSlug, ct);

        await SeedSnapshotChainForExistingRunAsync(
            connection,
            tenantId,
            workspaceId,
            projectId,
            runId,
            contextSnapshotId,
            graphSnapshotId,
            findingsSnapshotId,
            decisionTraceId,
            projectSlug,
            ct);
    }

    /// <summary>
    ///     Inserts <c>dbo.ContextSnapshots</c>, <c>dbo.GraphSnapshots</c>, <c>dbo.FindingsSnapshots</c>, and
    ///     <c>dbo.DecisioningTraces</c> for a <paramref name="runId" /> that already exists in <c>dbo.Runs</c>
    ///     (e.g. after <see cref="ArchitectureCommitTestSeed.InsertRequestAndRunAsync" />).
    /// </summary>
    public static async Task SeedSnapshotChainForExistingRunAsync(
        SqlConnection connection,
        Guid tenantId,
        Guid workspaceId,
        Guid scopeProjectId,
        Guid runId,
        Guid contextSnapshotId,
        Guid graphSnapshotId,
        Guid findingsSnapshotId,
        Guid decisionTraceId,
        string projectSlug,
        CancellationToken ct)
    {
        string emptyCanonical = JsonEntitySerializer.Serialize(new List<CanonicalObject>());
        string emptyList = JsonEntitySerializer.Serialize(new List<string>());

        await InsertContextSnapshotHeaderAsync(
            connection,
            tenantId,
            workspaceId,
            scopeProjectId,
            contextSnapshotId,
            runId,
            projectSlug,
            TimeProvider.System.UtcNowDateTime(),
            emptyCanonical,
            null,
            emptyList,
            emptyList,
            JsonEntitySerializer.Serialize(new Dictionary<string, string>()),
            ct);

        string emptyNodes = JsonEntitySerializer.Serialize(new List<GraphNode>());
        string emptyEdges = JsonEntitySerializer.Serialize(new List<GraphEdge>());
        string emptyGraphWarnings = JsonEntitySerializer.Serialize(new List<string>());

        await InsertGraphSnapshotHeaderAsync(
            connection,
            tenantId,
            workspaceId,
            scopeProjectId,
            graphSnapshotId,
            contextSnapshotId,
            runId,
            TimeProvider.System.UtcNowDateTime(),
            emptyNodes,
            emptyEdges,
            emptyGraphWarnings,
            ct);

        const string insertFindings = """
                                      INSERT INTO dbo.FindingsSnapshots
                                      (
                                          FindingsSnapshotId, RunId, ContextSnapshotId, GraphSnapshotId, TenantId, WorkspaceId, ProjectId,
                                          CreatedUtc, SchemaVersion, FindingsJson
                                      )
                                      VALUES
                                      (
                                          @FindingsSnapshotId, @RunId, @ContextSnapshotId, @GraphSnapshotId, @TenantId, @WorkspaceId, @ScopeProjectId,
                                          @CreatedUtc, @SchemaVersion, @FindingsJson
                                      );
                                      """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertFindings,
                new
                {
                    FindingsSnapshotId = findingsSnapshotId,
                    RunId = runId,
                    ContextSnapshotId = contextSnapshotId,
                    GraphSnapshotId = graphSnapshotId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = scopeProjectId,
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                    SchemaVersion = 1,
                    FindingsJson = JsonEntitySerializer.Serialize(new FindingsSnapshot
                    {
                        FindingsSnapshotId = findingsSnapshotId,
                        RunId = runId,
                        ContextSnapshotId = contextSnapshotId,
                        GraphSnapshotId = graphSnapshotId,
                        CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                        Findings = []
                    })
                },
                cancellationToken: ct));

        const string insertTrace = """
                                   INSERT INTO dbo.DecisioningTraces
                                   (
                                       DecisionTraceId, RunId, CreatedUtc,
                                       RuleSetId, RuleSetVersion, RuleSetHash,
                                       AppliedRuleIdsJson, AcceptedFindingIdsJson, RejectedFindingIdsJson, NotesJson,
                                       TenantId, WorkspaceId, ProjectId
                                   )
                                   VALUES
                                   (
                                       @DecisionTraceId, @RunId, @CreatedUtc,
                                       @RuleSetId, @RuleSetVersion, @RuleSetHash,
                                       @AppliedRuleIdsJson, @AcceptedFindingIdsJson, @RejectedFindingIdsJson, @NotesJson,
                                       @TenantId, @WorkspaceId, @ProjectId
                                   );
                                   """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertTrace,
                new
                {
                    DecisionTraceId = decisionTraceId,
                    RunId = runId,
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                    RuleSetId = "rs",
                    RuleSetVersion = "1",
                    RuleSetHash = "h",
                    AppliedRuleIdsJson = emptyList,
                    AcceptedFindingIdsJson = emptyList,
                    RejectedFindingIdsJson = emptyList,
                    NotesJson = emptyList,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = scopeProjectId
                },
                cancellationToken: ct));
    }

    /// <summary>Direct INSERT into <c>dbo.GraphSnapshots</c> (JSON columns; greenfield requires RLS scope columns).</summary>
    public static async Task InsertGraphSnapshotHeaderAsync(
        SqlConnection connection,
        Guid tenantId,
        Guid workspaceId,
        Guid scopeProjectId,
        Guid graphSnapshotId,
        Guid contextSnapshotId,
        Guid runId,
        DateTime createdUtc,
        string? nodesJson,
        string? edgesJson,
        string? warningsJson,
        CancellationToken ct,
        IDbTransaction? transaction = null)
    {
        const string insertGraph = """
                                   INSERT INTO dbo.GraphSnapshots
                                   (
                                       GraphSnapshotId, ContextSnapshotId, RunId, TenantId, WorkspaceId, ScopeProjectId, CreatedUtc,
                                       NodesJson, EdgesJson, WarningsJson
                                   )
                                   VALUES
                                   (
                                       @GraphSnapshotId, @ContextSnapshotId, @RunId, @TenantId, @WorkspaceId, @ScopeProjectId, @CreatedUtc,
                                       @NodesJson, @EdgesJson, @WarningsJson
                                   );
                                   """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertGraph,
                new
                {
                    GraphSnapshotId = graphSnapshotId,
                    ContextSnapshotId = contextSnapshotId,
                    RunId = runId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = scopeProjectId,
                    CreatedUtc = createdUtc,
                    NodesJson = nodesJson,
                    EdgesJson = edgesJson,
                    WarningsJson = warningsJson
                },
                transaction,
                cancellationToken: ct));
    }
}
