using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Serialization;
using ArchLucid.Persistence.Tests.Support;

using Dapper;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Governance;

/// <summary>
///     SQL integration coverage for <see cref="ArchitectureDecisionRegisterReader.ListAsync" /> filter ordering.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class ArchitectureDecisionRegisterReaderSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private static readonly Guid TenantId = Guid.Parse("a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1");
    private static readonly Guid WorkspaceId = Guid.Parse("b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2");
    private static readonly Guid ProjectId = Guid.Parse("c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3");

    [SkippableFact]
    public async Task ListAsync_applies_category_filter_before_top_limit()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        Guid runId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid findingsId = Guid.NewGuid();
        Guid traceId = Guid.NewGuid();

        await AuthorityRunChainTestSeed.SeedFullChainAsync(
            connection,
            TenantId,
            WorkspaceId,
            ProjectId,
            runId,
            contextId,
            graphId,
            findingsId,
            traceId,
            "decision-register-filter-order",
            CancellationToken.None);

        Guid newestCostManifestId = Guid.NewGuid();
        Guid middleCostManifestId = Guid.NewGuid();
        Guid oldestSecurityManifestId = Guid.NewGuid();

        await InsertManifestWithDecisionAsync(
            connection,
            runId,
            contextId,
            graphId,
            findingsId,
            traceId,
            newestCostManifestId,
            new DateTime(2026, 8, 26, 12, 0, 0, DateTimeKind.Utc),
            "Cost",
            "cost-newest");

        await InsertManifestWithDecisionAsync(
            connection,
            runId,
            contextId,
            graphId,
            findingsId,
            traceId,
            middleCostManifestId,
            new DateTime(2026, 8, 25, 12, 0, 0, DateTimeKind.Utc),
            "Cost",
            "cost-middle");

        await InsertManifestWithDecisionAsync(
            connection,
            runId,
            contextId,
            graphId,
            findingsId,
            traceId,
            oldestSecurityManifestId,
            new DateTime(2026, 8, 24, 12, 0, 0, DateTimeKind.Utc),
            "Security",
            "security-oldest");

        ArchitectureDecisionRegisterReader reader = new(factory);

        IReadOnlyList<ArchitectureDecisionRegisterEntry> decisions = await reader.ListAsync(
            TenantId,
            WorkspaceId,
            ProjectId,
            maxRows: 2,
            new ArchitectureDecisionRegisterQueryOptions { Category = "Security" },
            CancellationToken.None);

        decisions.Should().ContainSingle();
        decisions[0].DecisionId.Should().Be("security-oldest");
        decisions[0].Category.Should().Be("Security");
    }

    private static async Task InsertManifestWithDecisionAsync(
        SqlConnection connection,
        Guid runId,
        Guid contextId,
        Guid graphId,
        Guid findingsId,
        Guid traceId,
        Guid manifestId,
        DateTime createdUtc,
        string category,
        string decisionId)
    {
        const string insertManifest = """
                                      INSERT INTO dbo.GoldenManifests
                                      (
                                          TenantId, WorkspaceId, ProjectId,
                                          ManifestId, RunId, ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId, DecisionTraceId,
                                          CreatedUtc, ManifestHash, RuleSetId, RuleSetVersion, RuleSetHash,
                                          MetadataJson, RequirementsJson, TopologyJson, SecurityJson, ComplianceJson, CostJson,
                                          ConstraintsJson, UnresolvedIssuesJson, DecisionsJson, AssumptionsJson,
                                          WarningsJson, ProvenanceJson
                                      )
                                      VALUES
                                      (
                                          @TenantId, @WorkspaceId, @ProjectId,
                                          @ManifestId, @RunId, @ContextSnapshotId, @GraphSnapshotId, @FindingsSnapshotId, @DecisionTraceId,
                                          @CreatedUtc, @ManifestHash, @RuleSetId, @RuleSetVersion, @RuleSetHash,
                                          @MetadataJson, @RequirementsJson, @TopologyJson, @SecurityJson, @ComplianceJson, @CostJson,
                                          @ConstraintsJson, @UnresolvedIssuesJson, @DecisionsJson, @AssumptionsJson,
                                          @WarningsJson, @ProvenanceJson
                                      );
                                      """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertManifest,
                new
                {
                    TenantId,
                    WorkspaceId,
                    ProjectId,
                    ManifestId = manifestId,
                    RunId = runId,
                    ContextSnapshotId = contextId,
                    GraphSnapshotId = graphId,
                    FindingsSnapshotId = findingsId,
                    DecisionTraceId = traceId,
                    CreatedUtc = createdUtc,
                    ManifestHash = "h",
                    RuleSetId = "r",
                    RuleSetVersion = "1",
                    RuleSetHash = "rh",
                    MetadataJson = JsonEntitySerializer.Serialize(new ManifestMetadata()),
                    RequirementsJson = JsonEntitySerializer.Serialize(new RequirementsCoverageSection()),
                    TopologyJson = JsonEntitySerializer.Serialize(new TopologySection()),
                    SecurityJson = JsonEntitySerializer.Serialize(new SecuritySection()),
                    ComplianceJson = JsonEntitySerializer.Serialize(new ComplianceSection()),
                    CostJson = JsonEntitySerializer.Serialize(new CostSection()),
                    ConstraintsJson = JsonEntitySerializer.Serialize(new ConstraintSection()),
                    UnresolvedIssuesJson = JsonEntitySerializer.Serialize(new UnresolvedIssuesSection()),
                    DecisionsJson = JsonEntitySerializer.Serialize(Array.Empty<ResolvedArchitectureDecision>()),
                    AssumptionsJson = JsonEntitySerializer.Serialize(Array.Empty<string>()),
                    WarningsJson = JsonEntitySerializer.Serialize(Array.Empty<string>()),
                    ProvenanceJson = JsonEntitySerializer.Serialize(new ManifestProvenance()),
                },
                cancellationToken: CancellationToken.None));

        await connection.ExecuteAsync(
            new CommandDefinition(
                RelationalScopeChildInsertSql.GoldenManifestDecisionFromManifest,
                new
                {
                    ManifestId = manifestId,
                    SortOrder = 0,
                    DecisionId = decisionId,
                    Category = category,
                    Title = "title",
                    SelectedOption = "option",
                    Rationale = "rationale",
                    RawDecisionJson = (string?)null,
                },
                cancellationToken: CancellationToken.None));
    }
}
