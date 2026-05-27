using ArchLucid.Application.Findings;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingPriorityRerankerTests
{
    [Fact]
    public async Task RerankForRunAsync_persists_llm_order_per_severity_tier()
    {
        Guid runGuid = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid snapshotId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid tenantId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(r => r.GetByRunIdAdminAsync(runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runGuid,
                TenantId = tenantId,
                FindingsSnapshotId = snapshotId
            });

        Mock<ITenantRepository> tenantRepository = new();
        tenantRepository
            .Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = tenantId, IndustryVertical = "healthcare" });

        FindingRecordMetadataRow highA = new(
            Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            0,
            "finding-high-a",
            "Policy",
            "Security",
            "PolicyEngine",
            "High",
            "Unencrypted storage");

        FindingRecordMetadataRow highB = new(
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            1,
            "finding-high-b",
            "Policy",
            "Reliability",
            "PolicyEngine",
            "High",
            "Missing failover");

        Mock<IFindingsSnapshotRepository> findingsRepository = new();
        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };

        findingsRepository
            .Setup(f => f.ListFindingRecordsKeysetAsync(
                scope,
                snapshotId,
                null,
                null,
                null,
                null,
                null,
                null,
                200,
                false,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FindingRecordMetadataPage([highA, highB], HasMore: false));

        IReadOnlyList<(string FindingId, int PriorityRank)>? capturedRanks = null;
        findingsRepository
            .Setup(f => f.UpdatePriorityRanksAsync(
                scope,
                snapshotId,
                It.IsAny<IReadOnlyList<(string FindingId, int PriorityRank)>>(),
                It.IsAny<CancellationToken>()))
            .Callback<ScopeContext, Guid, IReadOnlyList<(string FindingId, int PriorityRank)>, CancellationToken>(
                (_, _, ranks, _) => capturedRanks = ranks)
            .Returns(Task.CompletedTask);

        Mock<IAgentCompletionClient> completionClient = new();
        completionClient
            .Setup(c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                null,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("""["finding-high-b","finding-high-a"]""");

        FindingPriorityReranker sut = new(
            runRepository.Object,
            findingsRepository.Object,
            tenantRepository.Object,
            completionClient.Object,
            NullLogger<FindingPriorityReranker>.Instance);

        await sut.RerankForRunAsync(runGuid.ToString(), CancellationToken.None);

        capturedRanks.Should().NotBeNull();
        capturedRanks!.Should().Contain(r => r.FindingId == "finding-high-b" && r.PriorityRank == 0);
        capturedRanks.Should().Contain(r => r.FindingId == "finding-high-a" && r.PriorityRank == 1);
    }

    [Fact]
    public async Task RerankForRunAsync_noops_when_run_has_no_snapshot()
    {
        Guid runGuid = Guid.Parse("44444444-4444-4444-4444-444444444444");

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(r => r.GetByRunIdAdminAsync(runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runGuid, FindingsSnapshotId = null });

        Mock<IFindingsSnapshotRepository> findingsRepository = new();

        FindingPriorityReranker sut = new(
            runRepository.Object,
            findingsRepository.Object,
            Mock.Of<ITenantRepository>(),
            Mock.Of<IAgentCompletionClient>(),
            NullLogger<FindingPriorityReranker>.Instance);

        await sut.RerankForRunAsync(runGuid.ToString(), CancellationToken.None);

        findingsRepository.Verify(
            f => f.UpdatePriorityRanksAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<IReadOnlyList<(string FindingId, int PriorityRank)>>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
