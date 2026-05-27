using ArchLucid.ContextIngestion.Models;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Serialization;
using ArchLucid.Persistence.Tests.Support;

using Dapper;

using Microsoft.Data.SqlClient;

using static ArchLucid.Persistence.Tests.Support.PersistenceIntegrationTestScope;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     <see cref="SqlContextSnapshotRepository" /> against SQL Server + DbUp (relational children + JSON dual-write / read
///     fallback).
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlContextSnapshotRepositorySqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private static readonly Guid TestTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid TestWorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid TestScopeProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    [SkippableFact]
    public async Task Save_then_GetById_round_trips_relational_collections()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlContextSnapshotRepository repository = new(factory, Empty);

        Guid snapshotId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        DateTime created = new(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc);

        ContextSnapshot snapshot = new()
        {
            SnapshotId = snapshotId,
            RunId = runId,
            ProjectId = "proj-relational-1",
            CreatedUtc = created,
            DeltaSummary = "delta",
            CanonicalObjects =
            [
                new CanonicalObject
                {
                    ObjectId = "obj-1",
                    ObjectType = "Service",
                    Name = "Api",
                    SourceType = "Request",
                    SourceId = "src-1",
                    Properties = new Dictionary<string, string>(StringComparer.Ordinal)
                    {
                        ["region"] = "east", ["tier"] = "p1"
                    }
                }
            ],
            Warnings = ["w1", "w2"],
            Errors = ["e1"],
            SourceHashes = new Dictionary<string, string>(StringComparer.Ordinal) { ["file.cs"] = "abc123" }
        };

        await using (SqlConnection seedConnection = await factory.CreateOpenConnectionAsync(CancellationToken.None))
            await AuthorityRunChainTestSeed.InsertRunAsync(
                seedConnection,
                Guid.Empty,
                Guid.Empty,
                Guid.Empty,
                runId,
                "proj-relational-1",
                CancellationToken.None);

        await repository.SaveAsync(snapshot, CancellationToken.None);

        ContextSnapshot? loaded = await repository.GetByIdAsync(Empty.GetCurrentScope().ToReadScope(), snapshotId, CancellationToken.None);
        loaded.Should().NotBeNull();
        loaded.SnapshotId.Should().Be(snapshotId);
        loaded.RunId.Should().Be(runId);
        loaded.ProjectId.Should().Be("proj-relational-1");
        loaded.DeltaSummary.Should().Be("delta");
        loaded.CanonicalObjects.Should().ContainSingle();
        loaded.CanonicalObjects[0].ObjectId.Should().Be("obj-1");
        loaded.CanonicalObjects[0].Properties.Should().HaveCount(2);
        loaded.CanonicalObjects[0].Properties["region"].Should().Be("east");
        loaded.Warnings.Should().Equal("w1", "w2");
        loaded.Errors.Should().Equal("e1");
        loaded.SourceHashes["file.cs"].Should().Be("abc123");
    }

    [SkippableFact]
    public async Task GetById_falls_back_to_json_when_no_relational_child_rows()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlContextSnapshotRepository repository = new(factory, Empty);

        Guid snapshotId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();

        List<CanonicalObject> canonical =
        [
            new()
            {
                ObjectId = "legacy-obj",
                ObjectType = "Type",
                Name = "Legacy",
                SourceType = "S",
                SourceId = "sid",
                Properties = []
            }
        ];

        string canonicalJson = JsonEntitySerializer.Serialize(canonical);
        string warningsJson = JsonEntitySerializer.Serialize(new List<string> { "jw" });
        string errorsJson = JsonEntitySerializer.Serialize(new List<string> { "err-a", "err-b" });
        string hashesJson = JsonEntitySerializer.Serialize(
            new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["legacy/path.cs"] = "sha256:aa",
                ["other"] = "bb"
            });

        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);
        await AuthorityRunChainTestSeed.InsertRunAsync(
            connection,
            TestTenantId,
            TestWorkspaceId,
            TestScopeProjectId,
            runId,
            "proj-legacy-json",
            CancellationToken.None);

        const string insertHeader = """
                                    INSERT INTO dbo.ContextSnapshots
                                    (
                                        SnapshotId, RunId, ProjectId, CreatedUtc,
                                        CanonicalObjectsJson, DeltaSummary, WarningsJson, ErrorsJson, SourceHashesJson
                                    )
                                    VALUES
                                    (
                                        @SnapshotId, @RunId, @ProjectId, @CreatedUtc,
                                        @CanonicalObjectsJson, @DeltaSummary, @WarningsJson, @ErrorsJson, @SourceHashesJson
                                    );
                                    """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertHeader,
                new
                {
                    SnapshotId = snapshotId,
                    RunId = runId,
                    ProjectId = "proj-legacy-json",
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                    CanonicalObjectsJson = canonicalJson,
                    DeltaSummary = (string?)null,
                    WarningsJson = warningsJson,
                    ErrorsJson = errorsJson,
                    SourceHashesJson = hashesJson
                },
                cancellationToken: CancellationToken.None));

        ContextSnapshot? loaded = await repository.GetByIdAsync(Empty.GetCurrentScope().ToReadScope(), snapshotId, CancellationToken.None);
        loaded.Should().NotBeNull();
        loaded.CanonicalObjects.Should().ContainSingle(o => o.ObjectId == "legacy-obj");
        loaded.Warnings.Should().Equal("jw");
        loaded.Errors.Should().Equal("err-a", "err-b");
        loaded.SourceHashes.Should().HaveCount(2);
        loaded.SourceHashes["legacy/path.cs"].Should().Be("sha256:aa");
        loaded.SourceHashes["other"].Should().Be("bb");
    }

    [SkippableFact]
    public async Task GetById_json_fallback_deserializes_canonical_object_properties()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlContextSnapshotRepository repository = new(factory, Empty);

        Guid snapshotId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        DateTime createdUtc = new(2026, 9, 1, 11, 0, 0, DateTimeKind.Utc);

        List<CanonicalObject> canonical =
        [
            new()
            {
                ObjectId = "obj-props",
                ObjectType = "Resource",
                Name = "PrimaryApi",
                SourceType = "Ingest",
                SourceId = "src-props-1",
                Properties = new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    ["region"] = "east", ["tier"] = "premium", ["env"] = "production"
                }
            },
            new()
            {
                ObjectId = "obj-empty-props",
                ObjectType = "Service",
                Name = "NoPropsSvc",
                SourceType = "Catalog",
                SourceId = "src-empty",
                Properties = []
            }
        ];

        string canonicalJson = JsonEntitySerializer.Serialize(canonical);

        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);
        await AuthorityRunChainTestSeed.InsertRunAsync(
            connection,
            TestTenantId,
            TestWorkspaceId,
            TestScopeProjectId,
            runId,
            "proj-canonical-props-json",
            CancellationToken.None);

        const string insertHeader = """
                                    INSERT INTO dbo.ContextSnapshots
                                    (
                                        SnapshotId, RunId, ProjectId, CreatedUtc,
                                        CanonicalObjectsJson, DeltaSummary, WarningsJson, ErrorsJson, SourceHashesJson
                                    )
                                    VALUES
                                    (
                                        @SnapshotId, @RunId, @ProjectId, @CreatedUtc,
                                        @CanonicalObjectsJson, @DeltaSummary, @WarningsJson, @ErrorsJson, @SourceHashesJson
                                    );
                                    """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertHeader,
                new
                {
                    SnapshotId = snapshotId,
                    RunId = runId,
                    ProjectId = "proj-canonical-props-json",
                    CreatedUtc = createdUtc,
                    CanonicalObjectsJson = canonicalJson,
                    DeltaSummary = (string?)null,
                    WarningsJson = JsonEntitySerializer.Serialize(new List<string>()),
                    ErrorsJson = JsonEntitySerializer.Serialize(new List<string>()),
                    SourceHashesJson = JsonEntitySerializer.Serialize(new Dictionary<string, string>())
                },
                cancellationToken: CancellationToken.None));

        ContextSnapshot? loaded = await repository.GetByIdAsync(Empty.GetCurrentScope().ToReadScope(), snapshotId, CancellationToken.None);
        loaded.Should().NotBeNull();
        loaded.CanonicalObjects.Should().HaveCount(2);

        loaded.CanonicalObjects[0].ObjectId.Should().Be("obj-props");
        loaded.CanonicalObjects[0].ObjectType.Should().Be("Resource");
        loaded.CanonicalObjects[0].Name.Should().Be("PrimaryApi");
        loaded.CanonicalObjects[0].SourceType.Should().Be("Ingest");
        loaded.CanonicalObjects[0].SourceId.Should().Be("src-props-1");
        loaded.CanonicalObjects[0].Properties.Should().HaveCount(3);
        loaded.CanonicalObjects[0].Properties["region"].Should().Be("east");
        loaded.CanonicalObjects[0].Properties["tier"].Should().Be("premium");
        loaded.CanonicalObjects[0].Properties["env"].Should().Be("production");

        loaded.CanonicalObjects[1].ObjectId.Should().Be("obj-empty-props");
        loaded.CanonicalObjects[1].ObjectType.Should().Be("Service");
        loaded.CanonicalObjects[1].Name.Should().Be("NoPropsSvc");
        loaded.CanonicalObjects[1].SourceType.Should().Be("Catalog");
        loaded.CanonicalObjects[1].SourceId.Should().Be("src-empty");
        loaded.CanonicalObjects[1].Properties.Should().BeEmpty();
    }

    [SkippableFact]
    public async Task GetById_when_all_json_columns_null_returns_empty_collections()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlContextSnapshotRepository repository = new(factory, Empty);

        Guid snapshotId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        DateTime createdUtc = new(2026, 9, 2, 12, 0, 0, DateTimeKind.Utc);

        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);
        await AuthorityRunChainTestSeed.InsertRunAsync(
            connection,
            TestTenantId,
            TestWorkspaceId,
            TestScopeProjectId,
            runId,
            "proj-all-json-null",
            CancellationToken.None);

        const string insertHeader = """
                                    INSERT INTO dbo.ContextSnapshots
                                    (
                                        SnapshotId, RunId, ProjectId, CreatedUtc,
                                        CanonicalObjectsJson, DeltaSummary, WarningsJson, ErrorsJson, SourceHashesJson
                                    )
                                    VALUES
                                    (
                                        @SnapshotId, @RunId, @ProjectId, @CreatedUtc,
                                        @CanonicalObjectsJson, @DeltaSummary, @WarningsJson, @ErrorsJson, @SourceHashesJson
                                    );
                                    """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertHeader,
                new
                {
                    SnapshotId = snapshotId,
                    RunId = runId,
                    ProjectId = "proj-all-json-null",
                    CreatedUtc = createdUtc,
                    CanonicalObjectsJson = (string?)null,
                    DeltaSummary = (string?)null,
                    WarningsJson = (string?)null,
                    ErrorsJson = (string?)null,
                    SourceHashesJson = (string?)null
                },
                cancellationToken: CancellationToken.None));

        ContextSnapshot? loaded = await repository.GetByIdAsync(Empty.GetCurrentScope().ToReadScope(), snapshotId, CancellationToken.None);
        loaded.Should().NotBeNull();
        loaded.CanonicalObjects.Should().BeEmpty();
        loaded.Warnings.Should().BeEmpty();
        loaded.Errors.Should().BeEmpty();
        loaded.SourceHashes.Should().BeEmpty();
        loaded.DeltaSummary.Should().BeNull();
    }

    [SkippableFact]
    public async Task GetById_when_all_json_columns_are_empty_strings_returns_empty_collections()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlContextSnapshotRepository repository = new(factory, Empty);

        Guid snapshotId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        DateTime createdUtc = new(2026, 11, 11, 14, 0, 0, DateTimeKind.Utc);
        const string projectId = "proj-json-empty-string";

        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);
        await AuthorityRunChainTestSeed.InsertRunAsync(
            connection,
            TestTenantId,
            TestWorkspaceId,
            TestScopeProjectId,
            runId,
            projectId,
            CancellationToken.None);

        const string insertHeader = """
                                    INSERT INTO dbo.ContextSnapshots
                                    (
                                        SnapshotId, RunId, ProjectId, CreatedUtc,
                                        CanonicalObjectsJson, DeltaSummary, WarningsJson, ErrorsJson, SourceHashesJson
                                    )
                                    VALUES
                                    (
                                        @SnapshotId, @RunId, @ProjectId, @CreatedUtc,
                                        @CanonicalObjectsJson, @DeltaSummary, @WarningsJson, @ErrorsJson, @SourceHashesJson
                                    );
                                    """;

        const string empty = "";

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertHeader,
                new
                {
                    SnapshotId = snapshotId,
                    RunId = runId,
                    ProjectId = projectId,
                    CreatedUtc = createdUtc,
                    CanonicalObjectsJson = empty,
                    DeltaSummary = (string?)null,
                    WarningsJson = empty,
                    ErrorsJson = empty,
                    SourceHashesJson = empty
                },
                cancellationToken: CancellationToken.None));

        ContextSnapshot? loaded = await repository.GetByIdAsync(Empty.GetCurrentScope().ToReadScope(), snapshotId, CancellationToken.None);
        loaded.Should().NotBeNull();
        loaded.SnapshotId.Should().Be(snapshotId);
        loaded.RunId.Should().Be(runId);
        loaded.ProjectId.Should().Be(projectId);
        loaded.CreatedUtc.Should().Be(createdUtc);
        loaded.CanonicalObjects.Should().BeEmpty();
        loaded.Warnings.Should().BeEmpty();
        loaded.Errors.Should().BeEmpty();
        loaded.SourceHashes.Should().BeEmpty();
    }

    [SkippableFact]
    public async Task SaveAsync_with_explicit_transaction_commits_header_and_children()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlContextSnapshotRepository repository = new(factory, Empty);

        Guid snapshotId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();

        ContextSnapshot snapshot = new()
        {
            SnapshotId = snapshotId,
            RunId = runId,
            ProjectId = "proj-tx",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            CanonicalObjects = [],
            Warnings = ["tw"],
            Errors = [],
            SourceHashes = new Dictionary<string, string>(StringComparer.Ordinal)
        };

        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);
        await using SqlTransaction tx = connection.BeginTransaction();
        await AuthorityRunChainTestSeed.InsertRunAsync(
            connection,
            Guid.Empty,
            Guid.Empty,
            Guid.Empty,
            runId,
            "proj-tx",
            CancellationToken.None,
            tx);

        await repository.SaveAsync(snapshot, CancellationToken.None, connection, tx);
        tx.Commit();

        ContextSnapshot? loaded = await repository.GetByIdAsync(Empty.GetCurrentScope().ToReadScope(), snapshotId, CancellationToken.None);
        loaded.Should().NotBeNull();
        loaded.Warnings.Should().Equal("tw");
    }

    [SkippableFact]
    public async Task GetLatestAsync_returns_snapshot_using_relational_hydration()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlContextSnapshotRepository repository = new(factory, Empty);

        Guid snapshotId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        DateTime created = new(2026, 12, 10, 9, 0, 0, DateTimeKind.Utc);
        const string projectId = "proj-get-latest-rel";

        ContextSnapshot snapshot = new()
        {
            SnapshotId = snapshotId,
            RunId = runId,
            ProjectId = projectId,
            CreatedUtc = created,
            DeltaSummary = "latest-delta",
            CanonicalObjects =
            [
                new CanonicalObject
                {
                    ObjectId = "co-latest",
                    ObjectType = "Type",
                    Name = "N",
                    SourceType = "SrcT",
                    SourceId = "SrcId",
                    Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["p"] = "q" }
                }
            ],
            Warnings = ["lw"],
            Errors = [],
            SourceHashes = new Dictionary<string, string>(StringComparer.Ordinal)
        };

        await using (SqlConnection seedConnection = await factory.CreateOpenConnectionAsync(CancellationToken.None))
            await AuthorityRunChainTestSeed.InsertRunAsync(
                seedConnection,
                Guid.Empty,
                Guid.Empty,
                Guid.Empty,
                runId,
                projectId,
                CancellationToken.None);

        await repository.SaveAsync(snapshot, CancellationToken.None);

        ContextSnapshot? loaded = await repository.GetLatestAsync(projectId, CancellationToken.None);
        loaded.Should().NotBeNull();
        loaded.SnapshotId.Should().Be(snapshotId);
        loaded.CanonicalObjects.Should().ContainSingle();
        loaded.CanonicalObjects[0].ObjectId.Should().Be("co-latest");
        loaded.Warnings.Should().Equal("lw");
        loaded.DeltaSummary.Should().Be("latest-delta");
    }

    [SkippableFact]
    public async Task GetById_warnings_relational_slice_overlays_json_columns()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlContextSnapshotRepository repository = new(factory, Empty);

        Guid snapshotId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        DateTime createdUtc = new(2026, 12, 11, 10, 0, 0, DateTimeKind.Utc);
        const string projectId = "proj-warn-overlay";

        List<CanonicalObject> canonical =
        [
            new()
            {
                ObjectId = "co-json",
                ObjectType = "T",
                Name = "NM",
                SourceType = "ST",
                SourceId = "SI",
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["a"] = "b" }
            }
        ];

        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);
        await AuthorityRunChainTestSeed.InsertRunAsync(
            connection,
            Guid.Empty,
            Guid.Empty,
            Guid.Empty,
            runId,
            projectId,
            CancellationToken.None);

        const string insertHeader = """
                                    INSERT INTO dbo.ContextSnapshots
                                    (
                                        SnapshotId, RunId, ProjectId, CreatedUtc,
                                        CanonicalObjectsJson, DeltaSummary, WarningsJson, ErrorsJson, SourceHashesJson
                                    )
                                    VALUES
                                    (
                                        @SnapshotId, @RunId, @ProjectId, @CreatedUtc,
                                        @CanonicalObjectsJson, @DeltaSummary, @WarningsJson, @ErrorsJson, @SourceHashesJson
                                    );
                                    """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertHeader,
                new
                {
                    SnapshotId = snapshotId,
                    RunId = runId,
                    ProjectId = projectId,
                    CreatedUtc = createdUtc,
                    CanonicalObjectsJson = JsonEntitySerializer.Serialize(canonical),
                    DeltaSummary = "ds",
                    WarningsJson = JsonEntitySerializer.Serialize(new List<string> { "json-warning-replaced" }),
                    ErrorsJson = JsonEntitySerializer.Serialize(new List<string> { "err-keep" }),
                    SourceHashesJson = JsonEntitySerializer.Serialize(
                        new Dictionary<string, string>(StringComparer.Ordinal) { ["hk"] = "hv" })
                },
                cancellationToken: CancellationToken.None));

        const string insertWarnings = """
                                      INSERT INTO dbo.ContextSnapshotWarnings
                                      (SnapshotId, SortOrder, WarningText, TenantId, WorkspaceId, ScopeProjectId)
                                      VALUES
                                      (@SnapshotId, 1, @W1, @TenantId, @WorkspaceId, @ScopeProjectId),
                                      (@SnapshotId, 0, @W0, @TenantId, @WorkspaceId, @ScopeProjectId);
                                      """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertWarnings,
                new
                {
                    SnapshotId = snapshotId,
                    W0 = "sql-warn-first",
                    W1 = "sql-warn-second",
                    TenantId = Guid.Empty,
                    WorkspaceId = Guid.Empty,
                    ScopeProjectId = Guid.Empty
                },
                cancellationToken: CancellationToken.None));

        ContextSnapshot? loaded = await repository.GetByIdAsync(Empty.GetCurrentScope().ToReadScope(), snapshotId, CancellationToken.None);
        loaded.Should().NotBeNull();
        loaded.CanonicalObjects.Should().ContainSingle();
        loaded.CanonicalObjects[0].ObjectId.Should().Be("co-json");
        loaded.Warnings.Should().Equal("sql-warn-first", "sql-warn-second");
        loaded.Errors.Should().Equal("err-keep");
        loaded.SourceHashes["hk"].Should().Be("hv");
        loaded.DeltaSummary.Should().Be("ds");
    }

    [SkippableFact]
    public async Task GetById_errors_relational_slice_overlays_json_columns()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlContextSnapshotRepository repository = new(factory, Empty);

        Guid snapshotId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        DateTime createdUtc = new(2026, 12, 11, 11, 0, 0, DateTimeKind.Utc);
        const string projectId = "proj-err-overlay";

        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);
        await AuthorityRunChainTestSeed.InsertRunAsync(
            connection,
            Guid.Empty,
            Guid.Empty,
            Guid.Empty,
            runId,
            projectId,
            CancellationToken.None);

        const string insertHeader = """
                                    INSERT INTO dbo.ContextSnapshots
                                    (
                                        SnapshotId, RunId, ProjectId, CreatedUtc,
                                        CanonicalObjectsJson, DeltaSummary, WarningsJson, ErrorsJson, SourceHashesJson
                                    )
                                    VALUES
                                    (
                                        @SnapshotId, @RunId, @ProjectId, @CreatedUtc,
                                        @CanonicalObjectsJson, @DeltaSummary, @WarningsJson, @ErrorsJson, @SourceHashesJson
                                    );
                                    """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertHeader,
                new
                {
                    SnapshotId = snapshotId,
                    RunId = runId,
                    ProjectId = projectId,
                    CreatedUtc = createdUtc,
                    CanonicalObjectsJson = JsonEntitySerializer.Serialize(new List<CanonicalObject>()),
                    DeltaSummary = (string?)null,
                    WarningsJson = JsonEntitySerializer.Serialize(new List<string> { "keep" }),
                    ErrorsJson = JsonEntitySerializer.Serialize(new List<string> { "json-error-replaced" }),
                    SourceHashesJson = JsonEntitySerializer.Serialize(new Dictionary<string, string>())
                },
                cancellationToken: CancellationToken.None));

        const string insertErrors = """
                                    INSERT INTO dbo.ContextSnapshotErrors
                                    (SnapshotId, SortOrder, ErrorText, TenantId, WorkspaceId, ScopeProjectId)
                                    VALUES
                                    (@SnapshotId, 0, @E0, @TenantId, @WorkspaceId, @ScopeProjectId);
                                    """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertErrors,
                new
                {
                    SnapshotId = snapshotId,
                    E0 = "sql-only-error",
                    TenantId = Guid.Empty,
                    WorkspaceId = Guid.Empty,
                    ScopeProjectId = Guid.Empty
                },
                cancellationToken: CancellationToken.None));

        ContextSnapshot? loaded = await repository.GetByIdAsync(Empty.GetCurrentScope().ToReadScope(), snapshotId, CancellationToken.None);
        loaded.Should().NotBeNull();
        loaded.CanonicalObjects.Should().BeEmpty();
        loaded.Warnings.Should().Equal("keep");
        loaded.Errors.Should().Equal("sql-only-error");
    }

    [SkippableFact]
    public async Task GetById_source_hashes_relational_slice_overlays_json_columns()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlContextSnapshotRepository repository = new(factory, Empty);

        Guid snapshotId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        DateTime createdUtc = new(2026, 12, 11, 12, 0, 0, DateTimeKind.Utc);
        const string projectId = "proj-hash-overlay";

        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);
        await AuthorityRunChainTestSeed.InsertRunAsync(
            connection,
            Guid.Empty,
            Guid.Empty,
            Guid.Empty,
            runId,
            projectId,
            CancellationToken.None);

        const string insertHeader = """
                                    INSERT INTO dbo.ContextSnapshots
                                    (
                                        SnapshotId, RunId, ProjectId, CreatedUtc,
                                        CanonicalObjectsJson, DeltaSummary, WarningsJson, ErrorsJson, SourceHashesJson
                                    )
                                    VALUES
                                    (
                                        @SnapshotId, @RunId, @ProjectId, @CreatedUtc,
                                        @CanonicalObjectsJson, @DeltaSummary, @WarningsJson, @ErrorsJson, @SourceHashesJson
                                    );
                                    """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertHeader,
                new
                {
                    SnapshotId = snapshotId,
                    RunId = runId,
                    ProjectId = projectId,
                    CreatedUtc = createdUtc,
                    CanonicalObjectsJson = JsonEntitySerializer.Serialize(new List<CanonicalObject>()),
                    DeltaSummary = (string?)null,
                    WarningsJson = JsonEntitySerializer.Serialize(new List<string>()),
                    ErrorsJson = JsonEntitySerializer.Serialize(new List<string>()),
                    SourceHashesJson = JsonEntitySerializer.Serialize(
                        new Dictionary<string, string>(StringComparer.Ordinal) { ["json"] = "replaced" })
                },
                cancellationToken: CancellationToken.None));

        const string insertHashes = """
                                    INSERT INTO dbo.ContextSnapshotSourceHashes
                                    (SnapshotId, SortOrder, SourceKey, HashValue, TenantId, WorkspaceId, ScopeProjectId)
                                    VALUES
                                    (@SnapshotId, 0, @K, @V, @TenantId, @WorkspaceId, @ScopeProjectId);
                                    """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertHashes,
                new
                {
                    SnapshotId = snapshotId,
                    K = "sql-path.cs",
                    V = "sha256:from-sql",
                    TenantId = Guid.Empty,
                    WorkspaceId = Guid.Empty,
                    ScopeProjectId = Guid.Empty
                },
                cancellationToken: CancellationToken.None));

        ContextSnapshot? loaded = await repository.GetByIdAsync(Empty.GetCurrentScope().ToReadScope(), snapshotId, CancellationToken.None);
        loaded.Should().NotBeNull();
        loaded.SourceHashes.Should().ContainSingle();
        loaded.SourceHashes["sql-path.cs"].Should().Be("sha256:from-sql");
    }

    [SkippableFact]
    public async Task GetById_relational_canonical_without_property_rows_has_empty_properties()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlContextSnapshotRepository repository = new(factory, Empty);

        Guid snapshotId = Guid.NewGuid();
        Guid rowId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        DateTime createdUtc = new(2026, 12, 12, 8, 0, 0, DateTimeKind.Utc);
        const string projectId = "proj-canonical-no-props";

        List<CanonicalObject> staleJson =
        [
            new()
            {
                ObjectId = "stale-json-id",
                ObjectType = "X",
                Name = "Y",
                SourceType = "Z",
                SourceId = "S",
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["stale"] = "yes" }
            }
        ];

        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);
        await AuthorityRunChainTestSeed.InsertRunAsync(
            connection,
            Guid.Empty,
            Guid.Empty,
            Guid.Empty,
            runId,
            projectId,
            CancellationToken.None);

        const string insertHeader = """
                                    INSERT INTO dbo.ContextSnapshots
                                    (
                                        SnapshotId, RunId, ProjectId, CreatedUtc,
                                        CanonicalObjectsJson, DeltaSummary, WarningsJson, ErrorsJson, SourceHashesJson
                                    )
                                    VALUES
                                    (
                                        @SnapshotId, @RunId, @ProjectId, @CreatedUtc,
                                        @CanonicalObjectsJson, @DeltaSummary, @WarningsJson, @ErrorsJson, @SourceHashesJson
                                    );
                                    """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertHeader,
                new
                {
                    SnapshotId = snapshotId,
                    RunId = runId,
                    ProjectId = projectId,
                    CreatedUtc = createdUtc,
                    CanonicalObjectsJson = JsonEntitySerializer.Serialize(staleJson),
                    DeltaSummary = (string?)null,
                    WarningsJson = JsonEntitySerializer.Serialize(new List<string>()),
                    ErrorsJson = JsonEntitySerializer.Serialize(new List<string>()),
                    SourceHashesJson = JsonEntitySerializer.Serialize(new Dictionary<string, string>())
                },
                cancellationToken: CancellationToken.None));

        const string insertCanonical = """
                                       INSERT INTO dbo.ContextSnapshotCanonicalObjects
                                       (
                                           CanonicalObjectRowId, SnapshotId, SortOrder,
                                           TenantId, WorkspaceId, ScopeProjectId,
                                           ObjectId, ObjectType, Name, SourceType, SourceId
                                       )
                                       VALUES
                                       (
                                           @CanonicalObjectRowId, @SnapshotId, 0,
                                           @TenantId, @WorkspaceId, @ScopeProjectId,
                                           @ObjectId, @ObjectType, @Name, @SourceType, @SourceId
                                       );
                                       """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertCanonical,
                new
                {
                    CanonicalObjectRowId = rowId,
                    SnapshotId = snapshotId,
                    TenantId = Guid.Empty,
                    WorkspaceId = Guid.Empty,
                    ScopeProjectId = Guid.Empty,
                    ObjectId = "relational-oid",
                    ObjectType = "relational-otype",
                    Name = "relational-name",
                    SourceType = "relational-src-type",
                    SourceId = "relational-src-id"
                },
                cancellationToken: CancellationToken.None));

        ContextSnapshot? loaded = await repository.GetByIdAsync(Empty.GetCurrentScope().ToReadScope(), snapshotId, CancellationToken.None);
        loaded.Should().NotBeNull();
        loaded.CanonicalObjects.Should().ContainSingle();
        CanonicalObject o = loaded.CanonicalObjects[0];
        o.ObjectId.Should().Be("relational-oid");
        o.ObjectType.Should().Be("relational-otype");
        o.Name.Should().Be("relational-name");
        o.SourceType.Should().Be("relational-src-type");
        o.SourceId.Should().Be("relational-src-id");
        o.Properties.Should().BeEmpty();
    }
}
