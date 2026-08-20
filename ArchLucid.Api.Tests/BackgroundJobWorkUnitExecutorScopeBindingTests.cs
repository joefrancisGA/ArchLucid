using ArchLucid.Application.Analysis;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Application.Jobs;
using ArchLucid.Application.Tenancy;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class BackgroundJobWorkUnitExecutorScopeBindingTests
{
    private static readonly ScopeContext ForeignScope = new()
    {
        TenantId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
        WorkspaceId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
        ProjectId = Guid.Parse("66666666-6666-6666-6666-666666666666")
    };

    [Fact]
    public async Task ExecuteAsync_analysis_docx_pushes_run_scope_before_run_detail_query()
    {
        Guid runId = Guid.Parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        string runIdText = runId.ToString("N");
        ScopeContext? ambientDuringRunDetailLoad = null;

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByRunIdAdminAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new RunRecord
                {
                    RunId = runId,
                    TenantId = ForeignScope.TenantId,
                    WorkspaceId = ForeignScope.WorkspaceId,
                    ScopeProjectId = ForeignScope.ProjectId,
                    LegacyRunStatus = nameof(ArchitectureRunStatus.Committed)
                });
        runs
            .Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                (ScopeContext scope, Guid _, CancellationToken _) =>
                {
                    ambientDuringRunDetailLoad = AmbientScopeContext.CurrentOverride;

                    if (scope.TenantId != ForeignScope.TenantId)
                        return null;

                    return new RunRecord
                    {
                        RunId = runId,
                        TenantId = ForeignScope.TenantId,
                        WorkspaceId = ForeignScope.WorkspaceId,
                        ScopeProjectId = ForeignScope.ProjectId,
                        LegacyRunStatus = nameof(ArchitectureRunStatus.Committed)
                    };
                });

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(r => r.GetRunDetailAsync(runIdText, It.IsAny<CancellationToken>()))
            .Returns<string, CancellationToken>(
                async (id, ct) =>
                {
                    ScopeContext scope = AmbientScopeContext.CurrentOverride
                        ?? throw new InvalidOperationException("Background job must bind ambient scope before run detail load.");

                    RunRecord? record = await runs.Object.GetByIdAsync(scope, runId, ct);

                    if (record is null)
                        return null;

                    return new ArchitectureRunDetail
                    {
                        Run = new ArchitectureRun { RunId = id, Status = ArchitectureRunStatus.Committed }
                    };
                });

        Mock<IArchitectureAnalysisService> analysis = new();
        analysis
            .Setup(a => a.BuildAsync(It.IsAny<ArchitectureAnalysisRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureAnalysisReport());

        Mock<IArchitectureAnalysisDocxExportService> docx = new();
        docx
            .Setup(d => d.GenerateDocxAsync(It.IsAny<ArchitectureAnalysisReport>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([1]);

        BackgroundJobWorkUnitExecutor sut = new(
            runDetail.Object,
            analysis.Object,
            docx.Object,
            Mock.Of<IArchitectureAnalysisConsultingDocxExportService>(),
            Mock.Of<IAuditService>(),
            Mock.Of<ITenantDeletionService>(),
            Mock.Of<IItsmOutboundIssueCreationService>(),
            new BackgroundJobWorkUnitScopeResolver(runs.Object));

        AnalysisReportDocxWorkUnit unit = new(
            new AnalysisReportDocxJobPayload { RunId = runIdText },
            "report.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        BackgroundJobFile file = await sut.ExecuteAsync(unit, CancellationToken.None);

        file.Bytes.Should().Equal(1);
        ambientDuringRunDetailLoad.Should().NotBeNull();
        ambientDuringRunDetailLoad!.TenantId.Should().Be(ForeignScope.TenantId);
        ambientDuringRunDetailLoad.WorkspaceId.Should().Be(ForeignScope.WorkspaceId);
        ambientDuringRunDetailLoad.ProjectId.Should().Be(ForeignScope.ProjectId);
    }
}
