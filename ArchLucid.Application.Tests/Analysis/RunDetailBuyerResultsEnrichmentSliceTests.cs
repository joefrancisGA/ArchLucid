using ArchLucid.Application.Runs.Enrichment;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Decisioning.Models;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Persistence;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RunDetailBuyerResultsEnrichmentSliceTests
{
    [Fact]
    public async Task CompareQuality_EnrichAsync_loads_agent_markers_when_stored_run_id_differs_only_by_casing()
    {
        Guid runGuid = Guid.Parse("f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1");
        string runN = runGuid.ToString("N");
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        Mock<IAgentResultEnrichmentRepository> enrichmentRepo = new();
        enrichmentRepo
            .Setup(r => r.GetByResultIdsAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, AgentResultEnrichmentRecord>(StringComparer.Ordinal));
        InMemoryAgentResultRepository resultRepository = new(enrichmentRepo.Object);

        await resultRepository.CreateAsync(
            new AgentResult
            {
                ResultId = Guid.NewGuid().ToString("N"),
                RunId = runN.ToUpperInvariant(),
                TaskId = Guid.NewGuid().ToString("N"),
                AgentType = AgentType.Topology,
                Claims = ["ok"],
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        RunDetailDto detail = new()
        {
            Run = new RunRecord
            {
                RunId = runGuid,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ScopeProjectId = projectId,
            },
        };

        RunDetailBuyerResultsEnrichmentSlice slice = new(resultRepository);
        await slice.EnrichAsync(
            new RunDetailEnrichmentContext { Detail = detail },
            CancellationToken.None);

        detail.Results.Should().ContainSingle();
        detail.Results[0].AgentType.Should().Be(AgentType.Topology);
        detail.AgentExecutionOutcomes.Should().NotBeNull();
    }

    [Fact]
    public async Task EnrichAsync_buyer_summary_carrier_uses_not_stored_title_copy()
    {
        Guid runGuid = Guid.Parse("a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1");
        string runN = runGuid.ToString("N");

        Mock<IAgentResultEnrichmentRepository> enrichmentRepo = new();
        enrichmentRepo
            .Setup(r => r.GetByResultIdsAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, AgentResultEnrichmentRecord>(StringComparer.Ordinal));
        InMemoryAgentResultRepository resultRepository = new(enrichmentRepo.Object);

        RunDetailDto detail = new()
        {
            Run = new RunRecord
            {
                RunId = runGuid,
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                ScopeProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            },
            FindingsSnapshot = new FindingsSnapshot
            {
                Findings =
                [
                    new Finding
                    {
                        FindingId = "f-empty-title",
                        Title = "",
                        Category = "Security",
                    },
                ],
            },
        };

        RunDetailBuyerResultsEnrichmentSlice slice = new(resultRepository);
        await slice.EnrichAsync(
            new RunDetailEnrichmentContext { Detail = detail },
            CancellationToken.None);

        detail.Results.Should().ContainSingle();
        detail.Results[0].Findings.Should().ContainSingle();
        detail.Results[0].Findings![0].Message.Should().Be(RunDetailBuyerResultsEnrichmentSlice.FindingTitleNotStoredWireMessage);
    }

    [Fact]
    public async Task EnrichAsync_buyer_summary_carrier_uses_not_stored_category_copy()
    {
        Guid runGuid = Guid.Parse("b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2");
        string runN = runGuid.ToString("N");

        Mock<IAgentResultEnrichmentRepository> enrichmentRepo = new();
        enrichmentRepo
            .Setup(r => r.GetByResultIdsAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, AgentResultEnrichmentRecord>(StringComparer.Ordinal));
        InMemoryAgentResultRepository resultRepository = new(enrichmentRepo.Object);

        RunDetailDto detail = new()
        {
            Run = new RunRecord
            {
                RunId = runGuid,
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                ScopeProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            },
            FindingsSnapshot = new FindingsSnapshot
            {
                Findings =
                [
                    new Finding
                    {
                        FindingId = "f-blank-cat",
                        Title = "Has title",
                        Category = "   ",
                    },
                ],
            },
        };

        RunDetailBuyerResultsEnrichmentSlice slice = new(resultRepository);
        await slice.EnrichAsync(
            new RunDetailEnrichmentContext { Detail = detail },
            CancellationToken.None);

        detail.Results.Should().ContainSingle();
        detail.Results[0].Findings.Should().ContainSingle();
        detail.Results[0].Findings![0].Category.Should().Be(RunDetailBuyerResultsEnrichmentSlice.FindingCategoryNotStoredWireMessage);
    }
}
