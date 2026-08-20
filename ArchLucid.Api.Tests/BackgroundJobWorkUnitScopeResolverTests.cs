using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Application.Jobs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class BackgroundJobWorkUnitScopeResolverTests
{
    private static readonly ScopeContext ForeignScope = new()
    {
        TenantId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
        WorkspaceId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
        ProjectId = Guid.Parse("66666666-6666-6666-6666-666666666666")
    };

    [Fact]
    public async Task ResolveAsync_analysis_docx_loads_scope_from_run_record()
    {
        Guid runId = Guid.Parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        string runIdText = runId.ToString("N");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByRunIdAdminAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new RunRecord
                {
                    RunId = runId,
                    TenantId = ForeignScope.TenantId,
                    WorkspaceId = ForeignScope.WorkspaceId,
                    ScopeProjectId = ForeignScope.ProjectId
                });

        BackgroundJobWorkUnitScopeResolver sut = new(runs.Object);
        AnalysisReportDocxWorkUnit workUnit = new(
            new AnalysisReportDocxJobPayload { RunId = runIdText },
            "report.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        ScopeContext scope = await sut.ResolveAsync(workUnit, CancellationToken.None);

        scope.TenantId.Should().Be(ForeignScope.TenantId);
        scope.WorkspaceId.Should().Be(ForeignScope.WorkspaceId);
        scope.ProjectId.Should().Be(ForeignScope.ProjectId);
    }

    [Fact]
    public async Task ResolveAsync_itsm_outbound_uses_payload_scope()
    {
        ItsmOutboundCreateWorkUnit workUnit = new(
            new ItsmOutboundCreateJobPayload(
                ForeignScope.TenantId,
                ForeignScope.WorkspaceId,
                ForeignScope.ProjectId,
                "finding-1",
                ItsmOutboundIssueProvider.Jira,
                "corr-1"));

        BackgroundJobWorkUnitScopeResolver sut = new(Mock.Of<IRunRepository>());

        ScopeContext scope = await sut.ResolveAsync(workUnit, CancellationToken.None);

        scope.Should().BeEquivalentTo(ForeignScope);
    }
}
