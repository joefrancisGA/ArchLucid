using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class GovernanceLineageServiceTests
{
    private static GovernanceLineageService CreateSut(
        IGovernanceApprovalRequestRepository approvals,
        IGovernancePromotionRecordRepository promotions,
        IRunDetailQueryService runQuery,
        IAuthorityQueryService authority,
        IScopeContextProvider scope,
        IManifestHashService? manifestHashService = null) =>
        new(
            approvals,
            promotions,
            runQuery,
            authority,
            manifestHashService ?? PolicyPackGovernanceDryRunSealedManifestTestSupport.CreateManifestHashService(),
            scope);
    [SkippableFact]
    public async Task GetApprovalRequestLineageAsync_When_missing_Returns_null()
    {
        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(r => r.GetByIdAsync("nope", It.IsAny<CancellationToken>()))
            .ReturnsAsync((GovernanceApprovalRequest?)null);

        GovernanceLineageService sut = CreateSut(
            approvals.Object,
            Mock.Of<IGovernancePromotionRecordRepository>(),
            Mock.Of<IRunDetailQueryService>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IScopeContextProvider>());

        GovernanceLineageResult? result = await sut.GetApprovalRequestLineageAsync("nope");

        result.Should().BeNull();
    }

    [SkippableFact]
    public async Task GetApprovalRequestLineageAsync_When_run_id_is_not_32_char_hex_does_not_query_authority()
    {
        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        Mock<IGovernancePromotionRecordRepository> promotions = new();
        Mock<IRunDetailQueryService> runQuery = new();
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        Mock<IScopeContextProvider> scope = new();

        GovernanceApprovalRequest approval = new() { RunId = "00000000-0000-0000-0000-000000000000" };
        approvals
            .Setup(r => r.GetByIdAsync("req-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(approval);

        runQuery
            .Setup(r => r.GetRunDetailAsync(approval.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRunDetail?)null);

        promotions
            .Setup(p => p.GetByRunIdAsync(approval.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        GovernanceLineageService sut = CreateSut(approvals.Object, promotions.Object, runQuery.Object, authority.Object, scope.Object);

        GovernanceLineageResult? result = await sut.GetApprovalRequestLineageAsync("req-1");

        result.Should().NotBeNull();
        result.TopFindings.Should().BeEmpty();
    }

    [SkippableFact]
    public async Task GetApprovalRequestLineageAsync_Orders_equal_severity_by_title_then_maps_top_findings()
    {
        Guid runGuid = Guid.NewGuid();
        string runN = runGuid.ToString("N");
        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        Mock<IGovernancePromotionRecordRepository> promotions = new();
        Mock<IRunDetailQueryService> runQuery = new();
        Mock<IAuthorityQueryService> authority = new();
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = Guid.NewGuid() });

        GovernanceApprovalRequest approval = new() { RunId = runN };
        approvals
            .Setup(r => r.GetByIdAsync("req-2", It.IsAny<CancellationToken>()))
            .ReturnsAsync(approval);

        runQuery
            .Setup(r => r.GetRunDetailAsync(runN, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ArchitectureRunDetail { Run = new ArchitectureRun { RunId = runN, Status = ArchitectureRunStatus.Committed } });

        promotions
            .Setup(p => p.GetByRunIdAsync(runN, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                new()
                {
                    Category = "c",
                    EngineType = "e",
                    FindingId = "b",
                    FindingType = "t",
                    Rationale = "r",
                    Severity = FindingSeverity.Warning,
                    Title = "Bravo",
                    Trace = new ExplainabilityTrace()
                },
                new()
                {
                    Category = "c",
                    EngineType = "e",
                    FindingId = "a",
                    FindingType = "t",
                    Rationale = "r",
                    Severity = FindingSeverity.Warning,
                    Title = "alpha",
                    Trace = new ExplainabilityTrace()
                }
            ]
        };

        RunDetailDto authorityRow = new() { Run = new RunRecord { RunId = runGuid, }, FindingsSnapshot = snapshot };

        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityRow);

        GovernanceLineageService sut = CreateSut(approvals.Object, promotions.Object, runQuery.Object, authority.Object, scope.Object);

        GovernanceLineageResult? result = await sut.GetApprovalRequestLineageAsync("req-2");

        result.Should().NotBeNull();
        List<GovernanceLineageFindingSummary> top = result.TopFindings;
        top.Should().HaveCount(2);
        top[0].Title.Should().Be("alpha");
        top[1].Title.Should().Be("Bravo");
    }

    [SkippableFact]
    public async Task GetApprovalRequestLineageAsync_When_finding_trace_null_maps_without_throw()
    {
        Guid runGuid = Guid.NewGuid();
        string runN = runGuid.ToString("N");
        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        Mock<IGovernancePromotionRecordRepository> promotions = new();
        Mock<IRunDetailQueryService> runQuery = new();
        Mock<IAuthorityQueryService> authority = new();
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = Guid.NewGuid() });

        GovernanceApprovalRequest approval = new() { RunId = runN };
        approvals
            .Setup(r => r.GetByIdAsync("req-null-trace", It.IsAny<CancellationToken>()))
            .ReturnsAsync(approval);

        runQuery
            .Setup(r => r.GetRunDetailAsync(runN, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ArchitectureRunDetail { Run = new ArchitectureRun { RunId = runN, Status = ArchitectureRunStatus.Committed } });

        promotions
            .Setup(p => p.GetByRunIdAsync(runN, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                new()
                {
                    Category = "c",
                    EngineType = "e",
                    FindingId = "f1",
                    FindingType = "t",
                    Rationale = "r",
                    Severity = FindingSeverity.Info,
                    Title = "Traceless",
                    Trace = null!
                }
            ]
        };

        RunDetailDto authorityRow = new() { Run = new RunRecord { RunId = runGuid, }, FindingsSnapshot = snapshot };

        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityRow);

        GovernanceLineageService sut = CreateSut(approvals.Object, promotions.Object, runQuery.Object, authority.Object, scope.Object);

        GovernanceLineageResult? result = await sut.GetApprovalRequestLineageAsync("req-null-trace");

        result.Should().NotBeNull();
        result.TopFindings.Should().ContainSingle();
        result.TopFindings[0].Title.Should().Be("Traceless");
        result.TopFindings[0].SourceAgentExecutionTraceId.Should().BeNull();
    }

    [SkippableFact]
    public async Task GetApprovalRequestLineageAsync_When_manifest_unsealed_omits_manifest_summary_and_risk_posture()
    {
        Guid runGuid = Guid.NewGuid();
        string runN = runGuid.ToString("N");
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };

        ManifestDocument unsealedManifest = PolicyPackGovernanceDryRunSealedManifestTestSupport.CreateSealedGoldenManifest(
            scope,
            runGuid);
        unsealedManifest.ManifestHash = "tampered-hash";

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        Mock<IGovernancePromotionRecordRepository> promotions = new();
        Mock<IRunDetailQueryService> runQuery = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        GovernanceApprovalRequest approval = new() { RunId = runN };
        approvals
            .Setup(r => r.GetByIdAsync("req-unsealed", It.IsAny<CancellationToken>()))
            .ReturnsAsync(approval);

        runQuery
            .Setup(r => r.GetRunDetailAsync(runN, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ArchitectureRunDetail { Run = new ArchitectureRun { RunId = runN, Status = ArchitectureRunStatus.Committed } });

        promotions
            .Setup(p => p.GetByRunIdAsync(runN, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        IAuthorityQueryService authority = CreateAuthorityWithManifest(scope, runGuid, unsealedManifest);

        GovernanceLineageService sut = CreateSut(
            approvals.Object,
            promotions.Object,
            runQuery.Object,
            authority,
            scopeProvider.Object,
            PolicyPackGovernanceDryRunSealedManifestTestSupport.CreateManifestHashService(
                PolicyPackGovernanceDryRunSealedManifestTestSupport.SealedManifestHash));

        GovernanceLineageResult? result = await sut.GetApprovalRequestLineageAsync("req-unsealed");

        result.Should().NotBeNull();
        result!.Manifest.Should().BeNull();
        result.RiskPosture.Should().BeNull();
        result.TopFindings.Should().BeEmpty();
    }

    private static IAuthorityQueryService CreateAuthorityWithManifest(
        ScopeContext scope,
        Guid runGuid,
        ManifestDocument goldenManifest)
    {
        Mock<IAuthorityQueryService> authority = new();
        RunDetailDto detail = new()
        {
            Run = new RunRecord { RunId = runGuid },
            GoldenManifest = goldenManifest,
            FindingsSnapshot = new FindingsSnapshot { Findings = [] },
        };

        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        authority
            .Setup(a => a.GetRunDetailForManifestCompareAsync(
                It.IsAny<ScopeContext>(),
                runGuid,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        return authority.Object;
    }
}
