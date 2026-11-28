using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;
using ArchLucid.Persistence.Sql;
using ArchLucid.Persistence.Transactions;
using ArchLucid.TestSupport;

using Dapper;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

/// <summary>Exercises the real checkpoint and audit transaction, not deployment or engine output equivalence.</summary>
[Trait("Category", "Integration")]
[Trait("Category", "SqlServerContainer")]
[Trait("Suite", "Application")]
public sealed class Fnd083DurableLineageSqlRehearsalTests
{
    private const string ConnectionVariable = "ARCHLUCID_FND083_REHEARSAL_SQL";

    [SkippableFact]
    public async Task Authority_and_SecureNow_lineage_commits_and_rolls_back_with_the_checkpoint()
    {
        string? configured = Environment.GetEnvironmentVariable(ConnectionVariable);
        Skip.If(string.IsNullOrWhiteSpace(configured), "This rehearsal requires its dedicated disposable SQL runner.");

        var admin = new SqlConnectionStringBuilder(configured);
        Assert.Equal("127.0.0.1,1433", admin.DataSource);
        Assert.Equal("master", admin.InitialCatalog);
        Assert.Empty(admin.AttachDBFilename);
        admin.Pooling = false;
        var owned = new SqlConnectionStringBuilder(admin.ConnectionString)
        {
            InitialCatalog = "ArchLucidFnd083Test_" + Guid.NewGuid().ToString("N"),
        };

        using CancellationTokenSource timeout = new(TimeSpan.FromMinutes(5));
        CancellationToken ct = timeout.Token;
        await using (SqlConnection server = new(admin.ConnectionString))
        {
            await server.OpenAsync(ct);
            // Never adopt or drop an existing catalog on a name collision.
            const string create = """
                DECLARE @sql nvarchar(256) = N'CREATE DATABASE ' + QUOTENAME(@name);
                EXEC sys.sp_executesql @sql;
                """;
            await server.ExecuteAsync(new CommandDefinition(create, new { name = owned.InitialCatalog }, cancellationToken: ct));
        }

        try
        {
            await using (SqlConnection verify = new(owned.ConnectionString))
            {
                await verify.OpenAsync(ct);
                Assert.Equal(owned.InitialCatalog, verify.Database);
            }

            DatabaseMigrator.Run(owned.ConnectionString);
            SqlConnectionFactory connections = new(owned.ConnectionString);
            await new SqlSchemaBootstrapper(connections,
                Path.Combine(AppContext.BaseDirectory, "Scripts", "PersistenceContractSupplement.sql")).EnsureSchemaAsync(ct);

            ScopeContext scope = new()
            {
                TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid(),
            };
            Mock<IScopeContextProvider> scoped = new(MockBehavior.Strict);
            scoped.Setup(p => p.GetCurrentScope()).Returns(scope);
            SqlAnalysisRecoveryRepository checkpoints = new(connections, scoped.Object);
            DapperAuditRepository audit = new(connections, new InMemoryReadOnlyDbConnectionFactory());
            DapperArchLucidUnitOfWorkFactory transactions = new(connections);
            FakeTimeProvider clock = new();
            ProjectScopeKey project = ProjectScopeKey.From(scope);

            await VerifyAsync(AnalysisDependencyGraphs.Authority, "authority", AuthorityPipelineStageNames.ContextIngestion);
            await VerifyAsync(AnalysisDependencyGraphs.SecureFull, "securenow", AnalysisDependencyGraphs.Plan);
            await VerifyAsync(AnalysisDependencyGraphs.SecureCarry, "securenow", AnalysisDependencyGraphs.Plan);

            async Task VerifyAsync(AnalysisDependencyGraph graph, string pipeline, string stage)
            {
                Guid runId = Guid.NewGuid();
                AnalysisRecoveryStageKey key = new(project, pipeline, runId, stage);
                const string rawInput = "synthetic-input-not-an-audit-payload";
                const string output = "synthetic-checkpoint-result-not-an-audit-payload";
                var execution = new AnalysisDependencyExecution(graph, project, runId);
                AnalysisDependencyBinding binding = execution.BindInputs(stage, new { input = rawInput });
                Assert.Null(binding.MissingStage);
                AnalysisDependencyDecision decision = execution.Observe(stage, binding, "checkpoint_missing",
                    legacyReuse: false, enforce: true, NullLogger.Instance);

                // Observe the same boundary first without durable graph writes.
                _ = execution.Observe(stage, binding, "checkpoint_missing",
                    legacyReuse: false, enforce: false, NullLogger.Instance);
                Assert.Null(await checkpoints.ReadAsync(key, ct));
                Assert.Empty(await ReadAuditAsync(connections, key, ct));

                if (pipeline == "authority")
                    await SeedAuthorityRunAsync(connections, key, ct);

                await using AnalysisRecoveryLease lease = await AnalysisRecoveryLease.AcquireAsync(checkpoints, key,
                    binding.InputVersion, 3, clock, ct, replaceAuthorityInputs: pipeline == "authority");
                await using (IArchLucidUnitOfWork tx = await transactions.CreateAsync(ct))
                {
                    await AnalysisDependencyAudit.AppendAsync(audit, clock, key, binding, decision,
                        output, lease.Claim.Fence, tx, ct);
                    await lease.CompleteAsync(output, tx, ct);
                    await tx.RollbackAsync(ct);
                }

                AnalysisRecoveryClaim? afterRollback = await checkpoints.ReadAsync(key, ct);
                Assert.NotNull(afterRollback);
                Assert.Equal("running", afterRollback.State);
                Assert.Null(afterRollback.ResultReference);
                Assert.Equal(lease.Claim.Fence, afterRollback.Fence);
                Assert.Empty(await ReadAuditAsync(connections, key, ct));

                await using (IArchLucidUnitOfWork tx = await transactions.CreateAsync(ct))
                {
                    await AnalysisDependencyAudit.AppendAsync(audit, clock, key, binding, decision,
                        output, lease.Claim.Fence, tx, ct);
                    await lease.CompleteAsync(output, tx, ct);
                    await tx.CommitAsync(ct);
                }

                AnalysisRecoveryClaim? afterCommit = await checkpoints.ReadAsync(key, ct);
                Assert.NotNull(afterCommit);
                Assert.Equal("succeeded", afterCommit.State);
                Assert.Equal(output, afterCommit.ResultReference);
                AuditEvent entry = Assert.Single(await ReadAuditAsync(connections, key, ct));
                Assert.Equal(pipeline == "authority" ? runId : (Guid?)null, entry.RunId);
                Assert.DoesNotContain(rawInput, entry.DataJson!, StringComparison.Ordinal);
                Assert.DoesNotContain(output, entry.DataJson!, StringComparison.Ordinal);
                using JsonDocument data = JsonDocument.Parse(entry.DataJson!);
                Assert.Equal(graph.Version, data.RootElement.GetProperty("GraphVersion").GetString());
                Assert.Equal(stage, data.RootElement.GetProperty("Stage").GetString());
                Assert.Equal(binding.InputVersion, data.RootElement.GetProperty("InputVersion").GetString());
                Assert.Equal(lease.Claim.Fence, data.RootElement.GetProperty("Fence").GetInt64());
                Assert.Equal(AnalysisDependencyFingerprint.Digest(output), data.RootElement.GetProperty("OutputWitness").GetString());
            }
        }
        finally
        {
            SqlServerTestCatalogCommands.DropCatalogIfExists(owned.ConnectionString);
        }
    }

    private static async Task<IEnumerable<AuditEvent>> ReadAuditAsync(ISqlConnectionFactory connections,
        AnalysisRecoveryStageKey key, CancellationToken ct)
    {
        const string sql = """
            SELECT RunId, DataJson FROM dbo.AuditEvents
            WHERE TenantId=@TenantId AND WorkspaceId=@WorkspaceId AND ProjectId=@ProjectId
              AND EventType=@EventType AND JSON_VALUE(DataJson, '$.ExecutionId')=@ExecutionId
              AND JSON_VALUE(DataJson, '$.Stage')=@Stage;
            """;
        await using SqlConnection db = await connections.CreateOpenConnectionAsync(ct);

        return await db.QueryAsync<AuditEvent>(new CommandDefinition(sql, new
        {
            key.Scope.TenantId, key.Scope.WorkspaceId, key.Scope.ProjectId, key.Stage,
            EventType = AuditEventTypes.AnalyticalDependencyCheckpointRecorded, ExecutionId = key.RunId.ToString("D"),
        }, cancellationToken: ct));
    }

    private static async Task SeedAuthorityRunAsync(ISqlConnectionFactory connections,
        AnalysisRecoveryStageKey key, CancellationToken ct)
    {
        const string sql = """
            INSERT INTO dbo.ArchitectureRequests
                (RequestId, SystemName, Environment, CloudProvider, RequestJson, CreatedUtc)
            VALUES (@RequestId, N'FND083 disposable test', N'test', N'Azure', N'{}', SYSUTCDATETIME());
            INSERT INTO dbo.Runs
                (RunId, ProjectId, Description, CreatedUtc, TenantId, WorkspaceId, ScopeProjectId, ArchitectureRequestId, LegacyRunStatus)
            VALUES (@RunId, N'Fnd083Rehearsal', N'Disposable rehearsal', SYSUTCDATETIME(), @TenantId, @WorkspaceId, @ProjectId, @RequestId, N'Created');
            """;
        await using SqlConnection db = await connections.CreateOpenConnectionAsync(ct);
        await db.ExecuteAsync(new CommandDefinition(sql, new
        {
            key.RunId, key.Scope.TenantId, key.Scope.WorkspaceId, key.Scope.ProjectId,
            RequestId = "fnd083-" + key.RunId.ToString("N"),
        }, cancellationToken: ct));
    }
}
