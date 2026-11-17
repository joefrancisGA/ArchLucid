using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class CareerExportCoverageHonestyMaterialLoaderTests
{
    [Fact]
    public async Task CompareQuality_LoadAsync_resolves_recorded_quality_gate_when_trace_run_id_differs_only_by_casing()
    {
        Guid runGuid = Guid.Parse("cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd");
        string runN = runGuid.ToString("N");
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        InMemoryAgentExecutionTraceRepository traceRepository = new();
        await traceRepository.CreateAsync(
            new AgentExecutionTrace
            {
                TraceId = "trace-career-gate-casing",
                RunId = runN.ToUpperInvariant(),
                QualityGateDefinitionMode = AgentOutputQualityGateMode.WarnOnly.ToString(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun
            {
                RunId = runN,
                Status = ArchitectureRunStatus.Committed,
                ContextSnapshotId = "ctx",
                FindingsSnapshotId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            },
        };

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(a => a.GetRunDetailForExportAsync(scope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunDetailDto?)null);

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                [$"{PreCommitGovernanceGateOptions.SectionPath}:{nameof(PreCommitGovernanceGateOptions.PreCommitGateEnabled)}"] = "true",
                [$"{AgentOutputQualityGateOptions.SectionPath}:{nameof(AgentOutputQualityGateOptions.Mode)}"] =
                    AgentOutputQualityGateMode.PilotStrict.ToString(),
            })
            .Build();

        CareerExportCoverageHonestyInput input = await CareerExportCoverageHonestyMaterialLoader.LoadAsync(
            detail,
            authority.Object,
            Mock.Of<IGraphSnapshotRepository>(),
            traceRepository,
            scope,
            workingDesk: false,
            configuration,
            CancellationToken.None);

        input.RecordedQualityGateMode.Should().Be(AgentOutputQualityGateMode.WarnOnly);
    }
}
