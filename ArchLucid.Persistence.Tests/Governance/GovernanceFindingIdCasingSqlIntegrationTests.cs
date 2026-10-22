using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Serialization;
using ArchLucid.Persistence.Tests.Support;

using Dapper;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Governance;

/// <summary>
///     Cheap-disproof SQL integration for legacy waiver / disposition <c>FindingId</c> casing parity (#829).
///     SQL Server default CI collation matches rows that differ only by casing; #826 fixed C# Ordinal divergence on mutate paths.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class GovernanceFindingIdCasingSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private const string CanonicalFindingId = "finding-1";
    private const string LegacyStoredFindingId = "FINDING-1";

    private static readonly Guid TenantId = Guid.Parse("a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4");
    private static readonly Guid WorkspaceId = Guid.Parse("b5b5b5b5-b5b5-b5b5-b5b5-b5b5b5b5b5b5");
    private static readonly Guid ProjectId = Guid.Parse("c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c6c6");

    [SkippableFact]
    public async Task GetInspectAsync_sets_HasActiveWaiver_when_legacy_waiver_finding_id_differs_only_by_casing()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SeededFindingChain chain = await SeedFindingWithLegacyWaiverAsync();

        DapperFindingInspectReadRepository inspectReader = new(new SqlConnectionFactory(fixture.ConnectionString));

        FindingInspectResponse? response = await inspectReader.GetInspectAsync(
            chain.Scope,
            CanonicalFindingId,
            CancellationToken.None);

        response.Should().NotBeNull();
        response!.FindingId.Should().Be(CanonicalFindingId);
        response.HasActiveWaiver.Should().BeTrue("SQL Server CI collation matches legacy waiver FindingId casing");
    }

    [SkippableFact]
    public async Task ListAsync_includes_waiver_expiry_when_legacy_waiver_finding_id_differs_only_by_casing()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SeededFindingChain chain = await SeedFindingWithLegacyWaiverAsync();

        ArchitectureRiskRegisterReader registerReader = new(new SqlConnectionFactory(fixture.ConnectionString));

        IReadOnlyList<ArchitectureRiskRegisterEntry> rows = await registerReader.ListAsync(
            TenantId,
            WorkspaceId,
            ProjectId,
            maxRows: 10,
            cancellationToken: CancellationToken.None);

        ArchitectureRiskRegisterEntry row = rows.Should().ContainSingle(e => e.FindingId == CanonicalFindingId).Subject;
        row.WaiverExpiresAtUtc.Should().NotBeNull();
        row.StatusLabel.Should().StartWith("Waived until ");
    }

    private async Task<SeededFindingChain> SeedFindingWithLegacyWaiverAsync()
    {
        ScopeContext scope = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        Guid runId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid findingsId = Guid.NewGuid();

        await AuthorityRunChainTestSeed.SeedRunAndContextOnlyAsync(
            connection,
            TenantId,
            WorkspaceId,
            ProjectId,
            runId,
            contextId,
            "governance-finding-casing",
            CancellationToken.None);

        string emptyNodes = JsonEntitySerializer.Serialize(new List<GraphNode>());
        string emptyEdges = JsonEntitySerializer.Serialize(new List<GraphEdge>());
        string emptyGraphWarnings = JsonEntitySerializer.Serialize(new List<string>());

        await AuthorityRunChainTestSeed.InsertGraphSnapshotHeaderAsync(
            connection,
            TenantId,
            WorkspaceId,
            ProjectId,
            graphId,
            contextId,
            runId,
            TimeProvider.System.UtcNowDateTime(),
            emptyNodes,
            emptyEdges,
            emptyGraphWarnings,
            CancellationToken.None);

        FixedTestScopeContextProvider scopeProvider = new(scope);
        SqlFindingsSnapshotRepository findingsRepository = new(
            factory,
            new TestReadOnlyDbConnectionFactory(factory),
            scopeProvider);

        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = findingsId,
            RunId = runId,
            ContextSnapshotId = contextId,
            GraphSnapshotId = graphId,
            CreatedUtc = new DateTime(2026, 9, 5, 12, 0, 0, DateTimeKind.Utc),
            SchemaVersion = FindingsSchema.CurrentSnapshotVersion,
            Findings =
            [
                new Finding
                {
                    FindingId = CanonicalFindingId,
                    FindingType = "RequirementFinding",
                    Category = "Security",
                    EngineType = "TestEngine",
                    Severity = FindingSeverity.Warning,
                    Title = "Casing parity probe",
                    Rationale = "Legacy waiver row retains pre-canonical FindingId casing.",
                },
            ],
        };

        FindingsSnapshotMigrator.Apply(snapshot);
        await findingsRepository.SaveAsync(snapshot, CancellationToken.None);

        SqlRiskExceptionRepository riskRepository = new(factory);
        DateTimeOffset expiresAtUtc = DateTimeOffset.UtcNow.AddDays(30);

        await riskRepository.CreateAsync(
            new RiskExceptionRecord
            {
                RiskExceptionId = Guid.NewGuid(),
                TenantId = TenantId,
                WorkspaceId = WorkspaceId,
                ProjectId = ProjectId,
                FindingId = LegacyStoredFindingId,
                RunId = runId,
                OwnerUserId = "owner@contoso.com",
                Rationale = "legacy casing waiver",
                EvidenceRef = "artifact://evidence/legacy",
                ExpiresAtUtc = expiresAtUtc,
                Status = RiskExceptionStatus.Active,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                CreatedByUserId = "creator@contoso.com",
            },
            CancellationToken.None);

        return new SeededFindingChain(scope, expiresAtUtc);
    }

    private sealed record SeededFindingChain(ScopeContext Scope, DateTimeOffset WaiverExpiresAtUtc);
}
