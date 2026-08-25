using System.Data;

using Dapper;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlArtifactBundleRepository
{
    private static async Task InsertArtifactBundleTraceRelationalAsync(
        ArtifactBundle bundle,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        await InsertArtifactBundleTraceGeneratorsRelationalAsync(bundle, connection, transaction, ct);
        await InsertArtifactBundleTraceDecisionLinksRelationalAsync(bundle, connection, transaction, ct);
        await InsertArtifactBundleTraceNotesRelationalAsync(bundle, connection, transaction, ct);
    }

    private static async Task InsertArtifactBundleTraceGeneratorsRelationalAsync(
        ArtifactBundle bundle,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        Guid bundleId = bundle.BundleId;
        SynthesisTrace trace = bundle.Trace;

        for (int g = 0; g < trace.GeneratorsUsed.Count; g++)
        {
            const string insertGenSql = """
                                        INSERT INTO dbo.ArtifactBundleTraceGenerators (
                                            BundleId, SortOrder, GeneratorName,
                                            TenantId, WorkspaceId, ProjectId)
                                        VALUES (@BundleId, @SortOrder, @GeneratorName, @TenantId, @WorkspaceId, @ProjectId);
                                        """;

            await connection.ExecuteAsync(
                new CommandDefinition(
                    insertGenSql,
                    new
                    {
                        BundleId = bundleId,
                        SortOrder = g,
                        GeneratorName = trace.GeneratorsUsed[g],
                        bundle.TenantId,
                        bundle.WorkspaceId,
                        bundle.ProjectId
                    },
                    transaction,
                    cancellationToken: ct));
        }
    }

    private static async Task InsertArtifactBundleTraceDecisionLinksRelationalAsync(
        ArtifactBundle bundle,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        Guid bundleId = bundle.BundleId;
        SynthesisTrace trace = bundle.Trace;

        for (int s = 0; s < trace.SourceDecisionIds.Count; s++)
        {
            const string insertTraceDecSql = """
                                             INSERT INTO dbo.ArtifactBundleTraceDecisionLinks (
                                                 BundleId, SortOrder, DecisionId,
                                                 TenantId, WorkspaceId, ProjectId)
                                             VALUES (@BundleId, @SortOrder, @DecisionId, @TenantId, @WorkspaceId, @ProjectId);
                                             """;

            await connection.ExecuteAsync(
                new CommandDefinition(
                    insertTraceDecSql,
                    new
                    {
                        BundleId = bundleId,
                        SortOrder = s,
                        DecisionId = trace.SourceDecisionIds[s],
                        bundle.TenantId,
                        bundle.WorkspaceId,
                        bundle.ProjectId
                    },
                    transaction,
                    cancellationToken: ct));
        }
    }

    private static async Task InsertArtifactBundleTraceNotesRelationalAsync(
        ArtifactBundle bundle,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        Guid bundleId = bundle.BundleId;
        SynthesisTrace trace = bundle.Trace;

        for (int n = 0; n < trace.Notes.Count; n++)
        {
            const string insertNoteSql = """
                                         INSERT INTO dbo.ArtifactBundleTraceNotes (
                                             BundleId, SortOrder, NoteText,
                                             TenantId, WorkspaceId, ProjectId)
                                         VALUES (@BundleId, @SortOrder, @NoteText, @TenantId, @WorkspaceId, @ProjectId);
                                         """;

            await connection.ExecuteAsync(
                new CommandDefinition(
                    insertNoteSql,
                    new
                    {
                        BundleId = bundleId,
                        SortOrder = n,
                        NoteText = trace.Notes[n],
                        bundle.TenantId,
                        bundle.WorkspaceId,
                        bundle.ProjectId
                    },
                    transaction,
                    cancellationToken: ct));
        }
    }
}
