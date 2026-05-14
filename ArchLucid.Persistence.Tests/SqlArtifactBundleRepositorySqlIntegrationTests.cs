using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Serialization;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     <see cref="SqlArtifactBundleRepository" /> against SQL Server + DbUp (relational slices + JSON dual-write).
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlArtifactBundleRepositorySqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private static readonly Guid TenantId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid WorkspaceId = Guid.Parse("55555555-5555-5555-5555-555555555555");
    private static readonly Guid ProjectId = Guid.Parse("66666666-6666-6666-6666-666666666666");

    [SkippableFact]
    public async Task Save_then_GetByManifestId_round_trips_relational_slices()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        Guid runId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid findingsId = Guid.NewGuid();
        Guid traceId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();

        await SeedAuthorityChainAsync(
            connection,
            runId,
            contextId,
            graphId,
            findingsId,
            traceId,
            CancellationToken.None);

        ManifestDocument manifest = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            ManifestId = manifestId,
            RunId = runId,
            ContextSnapshotId = contextId,
            GraphSnapshotId = graphId,
            FindingsSnapshotId = findingsId,
            DecisionTraceId = traceId,
            CreatedUtc = new DateTime(2026, 8, 1, 12, 0, 0, DateTimeKind.Utc),
            ManifestHash = "mh",
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "rsh",
            Metadata = new ManifestMetadata(),
            Requirements = new RequirementsCoverageSection(),
            Topology = new TopologySection(),
            Security = new SecuritySection(),
            Compliance = new ComplianceSection(),
            Cost = new CostSection(),
            Constraints = new ConstraintSection(),
            UnresolvedIssues = new UnresolvedIssuesSection(),
            Assumptions = [],
            Warnings = [],
            Provenance = new ManifestProvenance(),
            Decisions = []
        };

        SqlGoldenManifestRepository manifestRepository =
            SqlPersistenceRepositoryFactory.CreateGoldenManifestRepository(factory);
        await manifestRepository.SaveAsync(manifest, CancellationToken.None);

        DateTime bundleCreated = new(2026, 8, 1, 12, 5, 0, DateTimeKind.Utc);
        Guid bundleId = Guid.NewGuid();
        Guid artifactId = Guid.NewGuid();
        Guid synthTraceId = Guid.NewGuid();

        ArtifactBundle bundle = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            BundleId = bundleId,
            RunId = runId,
            ManifestId = manifestId,
            CreatedUtc = bundleCreated,
            Artifacts =
            [
                new SynthesizedArtifact
                {
                    ArtifactId = artifactId,
                    RunId = runId,
                    ManifestId = manifestId,
                    CreatedUtc = bundleCreated,
                    ArtifactType = "ArchitectureNarrative",
                    Name = "narrative.md",
                    Format = "markdown",
                    Content = "Plain text body â€” not JSON-encoded.",
                    ContentHash = "sha256:abc",
                    Metadata = new Dictionary<string, string>(StringComparer.Ordinal)
                    {
                        ["Section"] = "Overview", ["Lang"] = "en-US"
                    },
                    ContributingDecisionIds = ["dec-a", "dec-b"]
                }
            ],
            Trace = new SynthesisTrace
            {
                TraceId = synthTraceId,
                RunId = runId,
                ManifestId = manifestId,
                CreatedUtc = bundleCreated,
                GeneratorsUsed = ["ArchitectureNarrativeArtifactGenerator"],
                SourceDecisionIds = ["sd-1"],
                Notes = ["Synthesis complete."]
            }
        };

        SqlArtifactBundleRepository
            repository = SqlPersistenceRepositoryFactory.CreateArtifactBundleRepository(factory);
        await repository.SaveAsync(bundle, CancellationToken.None);

        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };

        ArtifactBundle? loaded = await repository.GetByManifestIdAsync(scope, manifestId, loadArtifactBodies: true, CancellationToken.None);
        loaded.Should().NotBeNull();
        loaded.BundleId.Should().Be(bundleId);
        loaded.Artifacts.Should().ContainSingle();
        SynthesizedArtifact a = loaded.Artifacts[0];
        a.Content.Should().Be("Plain text body â€” not JSON-encoded.");
        a.Metadata.Should().HaveCount(2);
        a.Metadata["Section"].Should().Be("Overview");
        a.ContributingDecisionIds.Should().Equal("dec-a", "dec-b");
        loaded.Trace.GeneratorsUsed.Should().Equal("ArchitectureNarrativeArtifactGenerator");
        loaded.Trace.SourceDecisionIds.Should().Equal("sd-1");
        loaded.Trace.Notes.Should().Equal("Synthesis complete.");
        loaded.Trace.TraceId.Should().Be(synthTraceId);
    }

    [SkippableFact]
    public async Task GetByManifestId_when_no_relational_rows_falls_back_to_json_columns()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        Guid runId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid findingsId = Guid.NewGuid();
        Guid traceId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();

        await SeedAuthorityChainAsync(
            connection,
            runId,
            contextId,
            graphId,
            findingsId,
            traceId,
            CancellationToken.None);

        ManifestDocument manifest = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            ManifestId = manifestId,
            RunId = runId,
            ContextSnapshotId = contextId,
            GraphSnapshotId = graphId,
            FindingsSnapshotId = findingsId,
            DecisionTraceId = traceId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ManifestHash = "mh",
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "rsh",
            Metadata = new ManifestMetadata(),
            Requirements = new RequirementsCoverageSection(),
            Topology = new TopologySection(),
            Security = new SecuritySection(),
            Compliance = new ComplianceSection(),
            Cost = new CostSection(),
            Constraints = new ConstraintSection(),
            UnresolvedIssues = new UnresolvedIssuesSection(),
            Assumptions = [],
            Warnings = [],
            Provenance = new ManifestProvenance(),
            Decisions = []
        };

        SqlGoldenManifestRepository manifestRepository =
            SqlPersistenceRepositoryFactory.CreateGoldenManifestRepository(factory);
        await manifestRepository.SaveAsync(manifest, CancellationToken.None);

        Guid bundleId = Guid.NewGuid();
        DateTime created = TimeProvider.System.UtcNowDateTime();
        Guid expectedArtifactId = Guid.NewGuid();

        List<SynthesizedArtifact> artifacts =
        [
            new()
            {
                ArtifactId = expectedArtifactId,
                RunId = runId,
                ManifestId = manifestId,
                CreatedUtc = created,
                ArtifactType = "Legacy",
                Name = "legacy.txt",
                Format = "text",
                Content = "json-only path",
                ContentHash = "h",
                Metadata = new Dictionary<string, string> { ["k"] = "v" },
                ContributingDecisionIds = ["x"]
            }
        ];

        SynthesisTrace trace = new()
        {
            TraceId = Guid.NewGuid(),
            RunId = runId,
            ManifestId = manifestId,
            CreatedUtc = created,
            GeneratorsUsed = ["G"],
            SourceDecisionIds = ["Y"],
            Notes = ["n"]
        };

        const string insertSql = """
                                 INSERT INTO dbo.ArtifactBundles
                                 (
                                     BundleId, RunId, ManifestId, CreatedUtc, ArtifactsJson, TraceJson,
                                     TenantId, WorkspaceId, ProjectId
                                 )
                                 VALUES
                                 (
                                     @BundleId, @RunId, @ManifestId, @CreatedUtc, @ArtifactsJson, @TraceJson,
                                     @TenantId, @WorkspaceId, @ProjectId
                                 );
                                 """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertSql,
                new
                {
                    BundleId = bundleId,
                    RunId = runId,
                    ManifestId = manifestId,
                    CreatedUtc = created,
                    ArtifactsJson = JsonEntitySerializer.Serialize(artifacts),
                    TraceJson = JsonEntitySerializer.Serialize(trace),
                    TenantId,
                    WorkspaceId,
                    ProjectId
                },
                cancellationToken: CancellationToken.None));

        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };

        SqlArtifactBundleRepository
            repository = SqlPersistenceRepositoryFactory.CreateArtifactBundleRepository(factory);
        ArtifactBundle? loaded = await repository.GetByManifestIdAsync(scope, manifestId, loadArtifactBodies: true, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded.Artifacts.Should().ContainSingle();
        SynthesizedArtifact artifact = loaded.Artifacts[0];
        artifact.ArtifactId.Should().Be(expectedArtifactId);
        artifact.RunId.Should().Be(runId);
        artifact.ManifestId.Should().Be(manifestId);
        artifact.CreatedUtc.Should().Be(created);
        artifact.ArtifactType.Should().Be("Legacy");
        artifact.Name.Should().Be("legacy.txt");
        artifact.Format.Should().Be("text");
        artifact.ContentHash.Should().Be("h");
        artifact.Content.Should().Be("json-only path");
        artifact.Metadata.Should().ContainKey("k");
        artifact.Metadata["k"].Should().Be("v");
        artifact.ContributingDecisionIds.Should().Equal("x");
        loaded.Trace.TraceId.Should().Be(trace.TraceId);
        loaded.Trace.GeneratorsUsed.Should().Equal("G");
        loaded.Trace.SourceDecisionIds.Should().Equal("Y");
        loaded.Trace.Notes.Should().Equal("n");
    }

    [SkippableFact]
    public async Task GetByManifestId_json_fallback_with_multiple_artifacts_preserves_order_and_metadata()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        Guid runId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid findingsId = Guid.NewGuid();
        Guid traceId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();

        await SeedAuthorityChainAsync(
            connection,
            runId,
            contextId,
            graphId,
            findingsId,
            traceId,
            CancellationToken.None);

        ManifestDocument manifest = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            ManifestId = manifestId,
            RunId = runId,
            ContextSnapshotId = contextId,
            GraphSnapshotId = graphId,
            FindingsSnapshotId = findingsId,
            DecisionTraceId = traceId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ManifestHash = "mh",
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "rsh",
            Metadata = new ManifestMetadata(),
            Requirements = new RequirementsCoverageSection(),
            Topology = new TopologySection(),
            Security = new SecuritySection(),
            Compliance = new ComplianceSection(),
            Cost = new CostSection(),
            Constraints = new ConstraintSection(),
            UnresolvedIssues = new UnresolvedIssuesSection(),
            Assumptions = [],
            Warnings = [],
            Provenance = new ManifestProvenance(),
            Decisions = []
        };

        SqlGoldenManifestRepository manifestRepository =
            SqlPersistenceRepositoryFactory.CreateGoldenManifestRepository(factory);
        await manifestRepository.SaveAsync(manifest, CancellationToken.None);

        Guid bundleId = Guid.NewGuid();
        DateTime created = new(2026, 10, 1, 8, 0, 0, DateTimeKind.Utc);
        Guid artifactIdFirst = Guid.NewGuid();
        Guid artifactIdSecond = Guid.NewGuid();

        List<SynthesizedArtifact> artifacts =
        [
            new()
            {
                ArtifactId = artifactIdFirst,
                RunId = runId,
                ManifestId = manifestId,
                CreatedUtc = created,
                ArtifactType = "TypeAlpha",
                Name = "first.bin",
                Format = "binary",
                Content = "body-one",
                ContentHash = "hash-one",
                Metadata = new Dictionary<string, string>(StringComparer.Ordinal) { ["m1a"] = "v1a", ["m1b"] = "v1b" },
                ContributingDecisionIds = ["d1a", "d1b"]
            },
            new()
            {
                ArtifactId = artifactIdSecond,
                RunId = runId,
                ManifestId = manifestId,
                CreatedUtc = created,
                ArtifactType = "TypeBeta",
                Name = "second.txt",
                Format = "utf8",
                Content = "body-two",
                ContentHash = "hash-two",
                Metadata = new Dictionary<string, string>(StringComparer.Ordinal) { ["m2a"] = "v2a", ["m2b"] = "v2b" },
                ContributingDecisionIds = ["d2a", "d2b", "d2c"]
            }
        ];

        SynthesisTrace trace = new()
        {
            TraceId = Guid.NewGuid(),
            RunId = runId,
            ManifestId = manifestId,
            CreatedUtc = created,
            GeneratorsUsed = ["GeneratorOne", "GeneratorTwo"],
            SourceDecisionIds = ["src-dec-a", "src-dec-b"],
            Notes = ["trace-note-a", "trace-note-b"]
        };

        const string insertSql = """
                                 INSERT INTO dbo.ArtifactBundles
                                 (
                                     BundleId, RunId, ManifestId, CreatedUtc, ArtifactsJson, TraceJson,
                                     TenantId, WorkspaceId, ProjectId
                                 )
                                 VALUES
                                 (
                                     @BundleId, @RunId, @ManifestId, @CreatedUtc, @ArtifactsJson, @TraceJson,
                                     @TenantId, @WorkspaceId, @ProjectId
                                 );
                                 """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertSql,
                new
                {
                    BundleId = bundleId,
                    RunId = runId,
                    ManifestId = manifestId,
                    CreatedUtc = created,
                    ArtifactsJson = JsonEntitySerializer.Serialize(artifacts),
                    TraceJson = JsonEntitySerializer.Serialize(trace),
                    TenantId,
                    WorkspaceId,
                    ProjectId
                },
                cancellationToken: CancellationToken.None));

        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };

        SqlArtifactBundleRepository
            repository = SqlPersistenceRepositoryFactory.CreateArtifactBundleRepository(factory);
        ArtifactBundle? loaded = await repository.GetByManifestIdAsync(scope, manifestId, loadArtifactBodies: true, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded.Artifacts.Should().HaveCount(2);

        SynthesizedArtifact first = loaded.Artifacts[0];
        first.ArtifactType.Should().Be("TypeAlpha");
        first.Name.Should().Be("first.bin");
        first.Format.Should().Be("binary");
        first.ContentHash.Should().Be("hash-one");
        first.Content.Should().Be("body-one");
        first.Metadata.Should().HaveCount(2);
        first.Metadata["m1a"].Should().Be("v1a");
        first.Metadata["m1b"].Should().Be("v1b");
        first.ContributingDecisionIds.Should().Equal("d1a", "d1b");

        SynthesizedArtifact second = loaded.Artifacts[1];
        second.ArtifactType.Should().Be("TypeBeta");
        second.Name.Should().Be("second.txt");
        second.Format.Should().Be("utf8");
        second.ContentHash.Should().Be("hash-two");
        second.Content.Should().Be("body-two");
        second.Metadata.Should().HaveCount(2);
        second.Metadata["m2a"].Should().Be("v2a");
        second.Metadata["m2b"].Should().Be("v2b");
        second.ContributingDecisionIds.Should().Equal("d2a", "d2b", "d2c");

        loaded.Trace.GeneratorsUsed.Should().Equal("GeneratorOne", "GeneratorTwo");
        loaded.Trace.SourceDecisionIds.Should().Equal("src-dec-a", "src-dec-b");
        loaded.Trace.Notes.Should().Equal("trace-note-a", "trace-note-b");
        loaded.Trace.TraceId.Should().Be(trace.TraceId);
    }

    [SkippableFact]
    public async Task GetByManifestId_when_ArtifactsJson_is_null_and_no_relational_rows_returns_empty_artifacts()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        Guid runId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid findingsId = Guid.NewGuid();
        Guid traceId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();

        await SeedAuthorityChainAsync(
            connection,
            runId,
            contextId,
            graphId,
            findingsId,
            traceId,
            CancellationToken.None);

        ManifestDocument manifest = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            ManifestId = manifestId,
            RunId = runId,
            ContextSnapshotId = contextId,
            GraphSnapshotId = graphId,
            FindingsSnapshotId = findingsId,
            DecisionTraceId = traceId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ManifestHash = "mh",
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "rsh",
            Metadata = new ManifestMetadata(),
            Requirements = new RequirementsCoverageSection(),
            Topology = new TopologySection(),
            Security = new SecuritySection(),
            Compliance = new ComplianceSection(),
            Cost = new CostSection(),
            Constraints = new ConstraintSection(),
            UnresolvedIssues = new UnresolvedIssuesSection(),
            Assumptions = [],
            Warnings = [],
            Provenance = new ManifestProvenance(),
            Decisions = []
        };

        SqlGoldenManifestRepository manifestRepository =
            SqlPersistenceRepositoryFactory.CreateGoldenManifestRepository(factory);
        await manifestRepository.SaveAsync(manifest, CancellationToken.None);

        Guid bundleId = Guid.NewGuid();
        DateTime created = new(2026, 10, 2, 9, 0, 0, DateTimeKind.Utc);
        SynthesisTrace emptyTrace = new()
        {
            TraceId = Guid.NewGuid(),
            RunId = runId,
            ManifestId = manifestId,
            CreatedUtc = created,
            GeneratorsUsed = [],
            SourceDecisionIds = [],
            Notes = []
        };

        const string insertSql = """
                                 INSERT INTO dbo.ArtifactBundles
                                 (
                                     BundleId, RunId, ManifestId, CreatedUtc, ArtifactsJson, TraceJson,
                                     TenantId, WorkspaceId, ProjectId
                                 )
                                 VALUES
                                 (
                                     @BundleId, @RunId, @ManifestId, @CreatedUtc, @ArtifactsJson, @TraceJson,
                                     @TenantId, @WorkspaceId, @ProjectId
                                 );
                                 """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertSql,
                new
                {
                    BundleId = bundleId,
                    RunId = runId,
                    ManifestId = manifestId,
                    CreatedUtc = created,
                    ArtifactsJson = (string?)null,
                    TraceJson = JsonEntitySerializer.Serialize(emptyTrace),
                    TenantId,
                    WorkspaceId,
                    ProjectId
                },
                cancellationToken: CancellationToken.None));

        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };

        SqlArtifactBundleRepository
            repository = SqlPersistenceRepositoryFactory.CreateArtifactBundleRepository(factory);
        ArtifactBundle? loaded = await repository.GetByManifestIdAsync(scope, manifestId, loadArtifactBodies: true, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded.Artifacts.Should().BeEmpty();
        loaded.Trace.Should().NotBeNull();
        loaded.Trace.TraceId.Should().Be(emptyTrace.TraceId);
        loaded.Trace.GeneratorsUsed.Should().BeEmpty();
        loaded.Trace.SourceDecisionIds.Should().BeEmpty();
        loaded.Trace.Notes.Should().BeEmpty();
    }

    [SkippableFact]
    public async Task
        GetByManifestId_when_both_ArtifactsJson_and_TraceJson_null_returns_empty_artifacts_and_default_trace()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        Guid runId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid findingsId = Guid.NewGuid();
        Guid traceId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();

        await SeedAuthorityChainAsync(
            connection,
            runId,
            contextId,
            graphId,
            findingsId,
            traceId,
            CancellationToken.None);

        ManifestDocument manifest = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            ManifestId = manifestId,
            RunId = runId,
            ContextSnapshotId = contextId,
            GraphSnapshotId = graphId,
            FindingsSnapshotId = findingsId,
            DecisionTraceId = traceId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ManifestHash = "mh",
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "rsh",
            Metadata = new ManifestMetadata(),
            Requirements = new RequirementsCoverageSection(),
            Topology = new TopologySection(),
            Security = new SecuritySection(),
            Compliance = new ComplianceSection(),
            Cost = new CostSection(),
            Constraints = new ConstraintSection(),
            UnresolvedIssues = new UnresolvedIssuesSection(),
            Assumptions = [],
            Warnings = [],
            Provenance = new ManifestProvenance(),
            Decisions = []
        };

        SqlGoldenManifestRepository manifestRepository =
            SqlPersistenceRepositoryFactory.CreateGoldenManifestRepository(factory);
        await manifestRepository.SaveAsync(manifest, CancellationToken.None);

        Guid bundleId = Guid.NewGuid();
        DateTime created = new(2026, 11, 12, 11, 0, 0, DateTimeKind.Utc);

        const string insertSql = """
                                 INSERT INTO dbo.ArtifactBundles
                                 (
                                     BundleId, RunId, ManifestId, CreatedUtc, ArtifactsJson, TraceJson,
                                     TenantId, WorkspaceId, ProjectId
                                 )
                                 VALUES
                                 (
                                     @BundleId, @RunId, @ManifestId, @CreatedUtc, @ArtifactsJson, @TraceJson,
                                     @TenantId, @WorkspaceId, @ProjectId
                                 );
                                 """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertSql,
                new
                {
                    BundleId = bundleId,
                    RunId = runId,
                    ManifestId = manifestId,
                    CreatedUtc = created,
                    ArtifactsJson = (string?)null,
                    TraceJson = (string?)null,
                    TenantId,
                    WorkspaceId,
                    ProjectId
                },
                cancellationToken: CancellationToken.None));

        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };

        SqlArtifactBundleRepository
            repository = SqlPersistenceRepositoryFactory.CreateArtifactBundleRepository(factory);
        ArtifactBundle? loaded = await repository.GetByManifestIdAsync(scope, manifestId, loadArtifactBodies: true, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded.Artifacts.Should().BeEmpty();
        loaded.Trace.Should().NotBeNull();
        loaded.Trace.GeneratorsUsed.Should().BeEmpty();
        loaded.Trace.SourceDecisionIds.Should().BeEmpty();
        loaded.Trace.Notes.Should().BeEmpty();
        loaded.BundleId.Should().Be(bundleId);
        loaded.RunId.Should().Be(runId);
        loaded.ManifestId.Should().Be(manifestId);
        loaded.CreatedUtc.Should().Be(created);
    }

    [SkippableFact]
    public async Task GetByManifestId_relational_with_loadArtifactBodies_false_maps_content_to_empty()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        Guid runId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid findingsId = Guid.NewGuid();
        Guid traceId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();

        await SeedAuthorityChainAsync(
            connection,
            runId,
            contextId,
            graphId,
            findingsId,
            traceId,
            CancellationToken.None);

        ManifestDocument manifest = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            ManifestId = manifestId,
            RunId = runId,
            ContextSnapshotId = contextId,
            GraphSnapshotId = graphId,
            FindingsSnapshotId = findingsId,
            DecisionTraceId = traceId,
            CreatedUtc = new DateTime(2026, 12, 1, 10, 0, 0, DateTimeKind.Utc),
            ManifestHash = "mh",
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "rsh",
            Metadata = new ManifestMetadata(),
            Requirements = new RequirementsCoverageSection(),
            Topology = new TopologySection(),
            Security = new SecuritySection(),
            Compliance = new ComplianceSection(),
            Cost = new CostSection(),
            Constraints = new ConstraintSection(),
            UnresolvedIssues = new UnresolvedIssuesSection(),
            Assumptions = [],
            Warnings = [],
            Provenance = new ManifestProvenance(),
            Decisions = []
        };

        SqlGoldenManifestRepository manifestRepository =
            SqlPersistenceRepositoryFactory.CreateGoldenManifestRepository(factory);
        await manifestRepository.SaveAsync(manifest, CancellationToken.None);

        DateTime bundleCreated = new(2026, 12, 1, 10, 5, 0, DateTimeKind.Utc);
        Guid bundleId = Guid.NewGuid();
        Guid artifactId = Guid.NewGuid();
        Guid synthTraceId = Guid.NewGuid();
        string storedBody = "relational body for load-slices-only";

        ArtifactBundle bundle = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            BundleId = bundleId,
            RunId = runId,
            ManifestId = manifestId,
            CreatedUtc = bundleCreated,
            Artifacts =
            [
                new SynthesizedArtifact
                {
                    ArtifactId = artifactId,
                    RunId = runId,
                    ManifestId = manifestId,
                    CreatedUtc = bundleCreated,
                    ArtifactType = "ArchitectureNarrative",
                    Name = "narrative.md",
                    Format = "markdown",
                    Content = storedBody,
                    ContentHash = "sha256:body-off",
                    Metadata = new Dictionary<string, string>(StringComparer.Ordinal) { ["k"] = "v" },
                    ContributingDecisionIds = ["d1"]
                }
            ],
            Trace = new SynthesisTrace
            {
                TraceId = synthTraceId,
                RunId = runId,
                ManifestId = manifestId,
                CreatedUtc = bundleCreated,
                GeneratorsUsed = ["G"],
                SourceDecisionIds = ["S"],
                Notes = ["N"]
            }
        };

        SqlArtifactBundleRepository
            repository = SqlPersistenceRepositoryFactory.CreateArtifactBundleRepository(factory);
        await repository.SaveAsync(bundle, CancellationToken.None);

        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };

        ArtifactBundle? loaded =
            await repository.GetByManifestIdAsync(scope, manifestId, loadArtifactBodies: false, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded.Artifacts.Should().ContainSingle();
        SynthesizedArtifact a = loaded.Artifacts[0];
        a.Content.Should().Be(string.Empty);
        a.ContentHash.Should().Be("sha256:body-off");
        a.Metadata.Should().ContainKey("k");
        a.ContributingDecisionIds.Should().Equal("d1");
        loaded.Trace.GeneratorsUsed.Should().Equal("G");
    }

    [SkippableFact]
    public async Task GetByManifestId_relational_artifact_with_empty_metadata_and_decision_links_round_trips()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        Guid runId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid findingsId = Guid.NewGuid();
        Guid traceId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();

        await SeedAuthorityChainAsync(
            connection,
            runId,
            contextId,
            graphId,
            findingsId,
            traceId,
            CancellationToken.None);

        ManifestDocument manifest = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            ManifestId = manifestId,
            RunId = runId,
            ContextSnapshotId = contextId,
            GraphSnapshotId = graphId,
            FindingsSnapshotId = findingsId,
            DecisionTraceId = traceId,
            CreatedUtc = new DateTime(2026, 12, 2, 11, 0, 0, DateTimeKind.Utc),
            ManifestHash = "mh",
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "rsh",
            Metadata = new ManifestMetadata(),
            Requirements = new RequirementsCoverageSection(),
            Topology = new TopologySection(),
            Security = new SecuritySection(),
            Compliance = new ComplianceSection(),
            Cost = new CostSection(),
            Constraints = new ConstraintSection(),
            UnresolvedIssues = new UnresolvedIssuesSection(),
            Assumptions = [],
            Warnings = [],
            Provenance = new ManifestProvenance(),
            Decisions = []
        };

        SqlGoldenManifestRepository manifestRepository =
            SqlPersistenceRepositoryFactory.CreateGoldenManifestRepository(factory);
        await manifestRepository.SaveAsync(manifest, CancellationToken.None);

        DateTime bundleCreated = new(2026, 12, 2, 11, 5, 0, DateTimeKind.Utc);
        Guid bundleId = Guid.NewGuid();
        Guid artifactId = Guid.NewGuid();

        ArtifactBundle bundle = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            BundleId = bundleId,
            RunId = runId,
            ManifestId = manifestId,
            CreatedUtc = bundleCreated,
            Artifacts =
            [
                new SynthesizedArtifact
                {
                    ArtifactId = artifactId,
                    RunId = runId,
                    ManifestId = manifestId,
                    CreatedUtc = bundleCreated,
                    ArtifactType = "Minimal",
                    Name = "x.txt",
                    Format = "text",
                    Content = "c",
                    ContentHash = "h",
                    Metadata = new Dictionary<string, string>(StringComparer.Ordinal),
                    ContributingDecisionIds = []
                }
            ],
            Trace = new SynthesisTrace
            {
                TraceId = Guid.NewGuid(),
                RunId = runId,
                ManifestId = manifestId,
                CreatedUtc = bundleCreated,
                GeneratorsUsed = [],
                SourceDecisionIds = [],
                Notes = []
            }
        };

        SqlArtifactBundleRepository
            repository = SqlPersistenceRepositoryFactory.CreateArtifactBundleRepository(factory);
        await repository.SaveAsync(bundle, CancellationToken.None);

        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };

        ArtifactBundle? loaded =
            await repository.GetByManifestIdAsync(scope, manifestId, loadArtifactBodies: true, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded.Artifacts.Should().ContainSingle();
        SynthesizedArtifact a = loaded.Artifacts[0];
        a.Metadata.Should().BeEmpty();
        a.ContributingDecisionIds.Should().BeEmpty();
        a.Content.Should().Be("c");
    }

    [SkippableFact]
    public async Task GetByManifestId_trace_generators_relational_slice_overlays_json_lists()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        Guid runId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid findingsId = Guid.NewGuid();
        Guid traceId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();

        await SeedAuthorityChainAsync(
            connection,
            runId,
            contextId,
            graphId,
            findingsId,
            traceId,
            CancellationToken.None);

        ManifestDocument manifest = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            ManifestId = manifestId,
            RunId = runId,
            ContextSnapshotId = contextId,
            GraphSnapshotId = graphId,
            FindingsSnapshotId = findingsId,
            DecisionTraceId = traceId,
            CreatedUtc = new DateTime(2026, 12, 3, 12, 0, 0, DateTimeKind.Utc),
            ManifestHash = "mh",
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "rsh",
            Metadata = new ManifestMetadata(),
            Requirements = new RequirementsCoverageSection(),
            Topology = new TopologySection(),
            Security = new SecuritySection(),
            Compliance = new ComplianceSection(),
            Cost = new CostSection(),
            Constraints = new ConstraintSection(),
            UnresolvedIssues = new UnresolvedIssuesSection(),
            Assumptions = [],
            Warnings = [],
            Provenance = new ManifestProvenance(),
            Decisions = []
        };

        SqlGoldenManifestRepository manifestRepository =
            SqlPersistenceRepositoryFactory.CreateGoldenManifestRepository(factory);
        await manifestRepository.SaveAsync(manifest, CancellationToken.None);

        Guid bundleId = Guid.NewGuid();
        DateTime created = new(2026, 12, 3, 12, 5, 0, DateTimeKind.Utc);
        Guid synthTraceId = Guid.NewGuid();

        List<SynthesizedArtifact> artifacts = [];
        SynthesisTrace trace = new()
        {
            TraceId = synthTraceId,
            RunId = runId,
            ManifestId = manifestId,
            CreatedUtc = created,
            GeneratorsUsed = ["from-json-should-replace"],
            SourceDecisionIds = ["src-json-a"],
            Notes = ["note-json-a"]
        };

        const string insertBundle = """
                                    INSERT INTO dbo.ArtifactBundles
                                    (
                                        BundleId, RunId, ManifestId, CreatedUtc, ArtifactsJson, TraceJson,
                                        TenantId, WorkspaceId, ProjectId
                                    )
                                    VALUES
                                    (
                                        @BundleId, @RunId, @ManifestId, @CreatedUtc, @ArtifactsJson, @TraceJson,
                                        @TenantId, @WorkspaceId, @ProjectId
                                    );
                                    """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertBundle,
                new
                {
                    BundleId = bundleId,
                    RunId = runId,
                    ManifestId = manifestId,
                    CreatedUtc = created,
                    ArtifactsJson = JsonEntitySerializer.Serialize(artifacts),
                    TraceJson = JsonEntitySerializer.Serialize(trace),
                    TenantId,
                    WorkspaceId,
                    ProjectId
                },
                cancellationToken: CancellationToken.None));

        const string insertGens = """
                                  INSERT INTO dbo.ArtifactBundleTraceGenerators
                                  (BundleId, SortOrder, GeneratorName, TenantId, WorkspaceId, ProjectId)
                                  VALUES
                                  (@BundleId, 0, @G0, @TenantId, @WorkspaceId, @ProjectId),
                                  (@BundleId, 1, @G1, @TenantId, @WorkspaceId, @ProjectId);
                                  """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertGens,
                new
                {
                    BundleId = bundleId,
                    G0 = "sql-generator-z",
                    G1 = "sql-generator-a",
                    TenantId,
                    WorkspaceId,
                    ProjectId
                },
                cancellationToken: CancellationToken.None));

        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };

        SqlArtifactBundleRepository
            repository = SqlPersistenceRepositoryFactory.CreateArtifactBundleRepository(factory);
        ArtifactBundle? loaded =
            await repository.GetByManifestIdAsync(scope, manifestId, loadArtifactBodies: true, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded.Artifacts.Should().BeEmpty();
        loaded.Trace.TraceId.Should().Be(synthTraceId);
        loaded.Trace.GeneratorsUsed.Should().Equal("sql-generator-z", "sql-generator-a");
        loaded.Trace.SourceDecisionIds.Should().Equal("src-json-a");
        loaded.Trace.Notes.Should().Equal("note-json-a");
    }

    [SkippableFact]
    public async Task GetByManifestId_trace_decision_links_relational_slice_overlays_json_lists()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        Guid runId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid findingsId = Guid.NewGuid();
        Guid traceId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();

        await SeedAuthorityChainAsync(
            connection,
            runId,
            contextId,
            graphId,
            findingsId,
            traceId,
            CancellationToken.None);

        ManifestDocument manifest = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            ManifestId = manifestId,
            RunId = runId,
            ContextSnapshotId = contextId,
            GraphSnapshotId = graphId,
            FindingsSnapshotId = findingsId,
            DecisionTraceId = traceId,
            CreatedUtc = new DateTime(2026, 12, 4, 13, 0, 0, DateTimeKind.Utc),
            ManifestHash = "mh",
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "rsh",
            Metadata = new ManifestMetadata(),
            Requirements = new RequirementsCoverageSection(),
            Topology = new TopologySection(),
            Security = new SecuritySection(),
            Compliance = new ComplianceSection(),
            Cost = new CostSection(),
            Constraints = new ConstraintSection(),
            UnresolvedIssues = new UnresolvedIssuesSection(),
            Assumptions = [],
            Warnings = [],
            Provenance = new ManifestProvenance(),
            Decisions = []
        };

        SqlGoldenManifestRepository manifestRepository =
            SqlPersistenceRepositoryFactory.CreateGoldenManifestRepository(factory);
        await manifestRepository.SaveAsync(manifest, CancellationToken.None);

        Guid bundleId = Guid.NewGuid();
        DateTime created = new(2026, 12, 4, 13, 5, 0, DateTimeKind.Utc);

        List<SynthesizedArtifact> artifacts = [];
        SynthesisTrace trace = new()
        {
            TraceId = Guid.NewGuid(),
            RunId = runId,
            ManifestId = manifestId,
            CreatedUtc = created,
            GeneratorsUsed = ["gen-json"],
            SourceDecisionIds = ["from-json-should-replace"],
            Notes = ["note-json"]
        };

        const string insertBundle = """
                                    INSERT INTO dbo.ArtifactBundles
                                    (
                                        BundleId, RunId, ManifestId, CreatedUtc, ArtifactsJson, TraceJson,
                                        TenantId, WorkspaceId, ProjectId
                                    )
                                    VALUES
                                    (
                                        @BundleId, @RunId, @ManifestId, @CreatedUtc, @ArtifactsJson, @TraceJson,
                                        @TenantId, @WorkspaceId, @ProjectId
                                    );
                                    """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertBundle,
                new
                {
                    BundleId = bundleId,
                    RunId = runId,
                    ManifestId = manifestId,
                    CreatedUtc = created,
                    ArtifactsJson = JsonEntitySerializer.Serialize(artifacts),
                    TraceJson = JsonEntitySerializer.Serialize(trace),
                    TenantId,
                    WorkspaceId,
                    ProjectId
                },
                cancellationToken: CancellationToken.None));

        const string insertLinks = """
                                   INSERT INTO dbo.ArtifactBundleTraceDecisionLinks
                                   (BundleId, SortOrder, DecisionId, TenantId, WorkspaceId, ProjectId)
                                   VALUES
                                   (@BundleId, 1, @D1, @TenantId, @WorkspaceId, @ProjectId),
                                   (@BundleId, 0, @D0, @TenantId, @WorkspaceId, @ProjectId);
                                   """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertLinks,
                new
                {
                    BundleId = bundleId,
                    D0 = "sql-dec-first",
                    D1 = "sql-dec-second",
                    TenantId,
                    WorkspaceId,
                    ProjectId
                },
                cancellationToken: CancellationToken.None));

        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };

        SqlArtifactBundleRepository
            repository = SqlPersistenceRepositoryFactory.CreateArtifactBundleRepository(factory);
        ArtifactBundle? loaded =
            await repository.GetByManifestIdAsync(scope, manifestId, loadArtifactBodies: true, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded.Trace.GeneratorsUsed.Should().Equal("gen-json");
        loaded.Trace.SourceDecisionIds.Should().Equal("sql-dec-first", "sql-dec-second");
        loaded.Trace.Notes.Should().Equal("note-json");
    }

    [SkippableFact]
    public async Task GetByManifestId_trace_notes_relational_slice_overlays_json_lists()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        Guid runId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid findingsId = Guid.NewGuid();
        Guid traceId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();

        await SeedAuthorityChainAsync(
            connection,
            runId,
            contextId,
            graphId,
            findingsId,
            traceId,
            CancellationToken.None);

        ManifestDocument manifest = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            ManifestId = manifestId,
            RunId = runId,
            ContextSnapshotId = contextId,
            GraphSnapshotId = graphId,
            FindingsSnapshotId = findingsId,
            DecisionTraceId = traceId,
            CreatedUtc = new DateTime(2026, 12, 5, 14, 0, 0, DateTimeKind.Utc),
            ManifestHash = "mh",
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "rsh",
            Metadata = new ManifestMetadata(),
            Requirements = new RequirementsCoverageSection(),
            Topology = new TopologySection(),
            Security = new SecuritySection(),
            Compliance = new ComplianceSection(),
            Cost = new CostSection(),
            Constraints = new ConstraintSection(),
            UnresolvedIssues = new UnresolvedIssuesSection(),
            Assumptions = [],
            Warnings = [],
            Provenance = new ManifestProvenance(),
            Decisions = []
        };

        SqlGoldenManifestRepository manifestRepository =
            SqlPersistenceRepositoryFactory.CreateGoldenManifestRepository(factory);
        await manifestRepository.SaveAsync(manifest, CancellationToken.None);

        Guid bundleId = Guid.NewGuid();
        DateTime created = new(2026, 12, 5, 14, 5, 0, DateTimeKind.Utc);

        List<SynthesizedArtifact> artifacts = [];
        SynthesisTrace trace = new()
        {
            TraceId = Guid.NewGuid(),
            RunId = runId,
            ManifestId = manifestId,
            CreatedUtc = created,
            GeneratorsUsed = ["gen-json"],
            SourceDecisionIds = ["src-json"],
            Notes = ["from-json-should-replace"]
        };

        const string insertBundle = """
                                    INSERT INTO dbo.ArtifactBundles
                                    (
                                        BundleId, RunId, ManifestId, CreatedUtc, ArtifactsJson, TraceJson,
                                        TenantId, WorkspaceId, ProjectId
                                    )
                                    VALUES
                                    (
                                        @BundleId, @RunId, @ManifestId, @CreatedUtc, @ArtifactsJson, @TraceJson,
                                        @TenantId, @WorkspaceId, @ProjectId
                                    );
                                    """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertBundle,
                new
                {
                    BundleId = bundleId,
                    RunId = runId,
                    ManifestId = manifestId,
                    CreatedUtc = created,
                    ArtifactsJson = JsonEntitySerializer.Serialize(artifacts),
                    TraceJson = JsonEntitySerializer.Serialize(trace),
                    TenantId,
                    WorkspaceId,
                    ProjectId
                },
                cancellationToken: CancellationToken.None));

        const string insertNotes = """
                                   INSERT INTO dbo.ArtifactBundleTraceNotes
                                   (BundleId, SortOrder, NoteText, TenantId, WorkspaceId, ProjectId)
                                   VALUES
                                   (@BundleId, 0, @N0, @TenantId, @WorkspaceId, @ProjectId),
                                   (@BundleId, 1, @N1, @TenantId, @WorkspaceId, @ProjectId);
                                   """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertNotes,
                new
                {
                    BundleId = bundleId,
                    N0 = "sql-note-a",
                    N1 = "sql-note-b",
                    TenantId,
                    WorkspaceId,
                    ProjectId
                },
                cancellationToken: CancellationToken.None));

        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };

        SqlArtifactBundleRepository
            repository = SqlPersistenceRepositoryFactory.CreateArtifactBundleRepository(factory);
        ArtifactBundle? loaded =
            await repository.GetByManifestIdAsync(scope, manifestId, loadArtifactBodies: true, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded.Trace.GeneratorsUsed.Should().Equal("gen-json");
        loaded.Trace.SourceDecisionIds.Should().Equal("src-json");
        loaded.Trace.Notes.Should().Equal("sql-note-a", "sql-note-b");
    }

    private static async Task SeedAuthorityChainAsync(
        SqlConnection connection,
        Guid runId,
        Guid contextSnapshotId,
        Guid graphSnapshotId,
        Guid findingsSnapshotId,
        Guid decisionTraceId,
        CancellationToken ct)
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
                    ProjectId = "proj-ab",
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                    TenantId,
                    WorkspaceId,
                    ScopeProjectId = ProjectId
                },
                cancellationToken: ct));

        string emptyCanonical = JsonEntitySerializer.Serialize(new List<CanonicalObject>());
        string emptyList = JsonEntitySerializer.Serialize(new List<string>());

        const string insertContext = """
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
                insertContext,
                new
                {
                    SnapshotId = contextSnapshotId,
                    RunId = runId,
                    ProjectId = "proj-ab",
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                    CanonicalObjectsJson = emptyCanonical,
                    DeltaSummary = (string?)null,
                    WarningsJson = emptyList,
                    ErrorsJson = emptyList,
                    SourceHashesJson = JsonEntitySerializer.Serialize(new Dictionary<string, string>())
                },
                cancellationToken: ct));

        string emptyNodes = JsonEntitySerializer.Serialize(new List<GraphNode>());
        string emptyEdges = JsonEntitySerializer.Serialize(new List<GraphEdge>());
        string emptyGraphWarnings = JsonEntitySerializer.Serialize(new List<string>());

        const string insertGraph = """
                                   INSERT INTO dbo.GraphSnapshots
                                   (
                                       GraphSnapshotId, ContextSnapshotId, RunId, CreatedUtc,
                                       NodesJson, EdgesJson, WarningsJson
                                   )
                                   VALUES
                                   (
                                       @GraphSnapshotId, @ContextSnapshotId, @RunId, @CreatedUtc,
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
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                    NodesJson = emptyNodes,
                    EdgesJson = emptyEdges,
                    WarningsJson = emptyGraphWarnings
                },
                cancellationToken: ct));

        const string insertFindings = """
                                      INSERT INTO dbo.FindingsSnapshots
                                      (
                                          FindingsSnapshotId, RunId, ContextSnapshotId, GraphSnapshotId, CreatedUtc,
                                          SchemaVersion, FindingsJson
                                      )
                                      VALUES
                                      (
                                          @FindingsSnapshotId, @RunId, @ContextSnapshotId, @GraphSnapshotId, @CreatedUtc,
                                          @SchemaVersion, @FindingsJson
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
                    TenantId,
                    WorkspaceId,
                    ProjectId
                },
                cancellationToken: ct));
    }
}
