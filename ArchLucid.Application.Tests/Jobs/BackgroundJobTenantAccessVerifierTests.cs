using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Application.Jobs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.TestSupport;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Jobs;

[Trait("Category", "Unit")]
public sealed class BackgroundJobTenantAccessVerifierTests
{
    private static readonly ScopeContext TenantAScope = new()
    {
        TenantId = ScopeIds.DefaultTenant,
        WorkspaceId = ScopeIds.DefaultWorkspace,
        ProjectId = ScopeIds.DefaultProject
    };

    private static readonly ScopeContext TenantBScope = new()
    {
        TenantId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
        WorkspaceId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
        ProjectId = Guid.Parse("66666666-6666-6666-6666-666666666666")
    };

    [Fact]
    public async Task IsAccessibleAsync_unknown_job_returns_false()
    {
        Mock<IBackgroundJobWorkUnitAccessor> accessor = new();
        accessor
            .Setup(a => a.TryGetAsync("missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((BackgroundJobWorkUnit?)null);
        BackgroundJobTenantAccessVerifier sut = new(accessor.Object, Mock.Of<IRunRepository>());

        bool accessible = await sut.IsAccessibleAsync("missing", TenantAScope, CancellationToken.None);

        accessible.Should().BeFalse();
    }

    [Fact]
    public async Task IsAccessibleAsync_analysis_docx_run_in_scope_returns_true()
    {
        Guid runId = Guid.NewGuid();
        string runIdText = runId.ToString("N");
        AnalysisReportDocxWorkUnit workUnit = new(
            new AnalysisReportDocxJobPayload { RunId = runIdText },
            "report.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        Mock<IBackgroundJobWorkUnitAccessor> accessor = new();
        accessor
            .Setup(a => a.TryGetAsync("job-a", It.IsAny<CancellationToken>()))
            .ReturnsAsync(workUnit);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(TenantAScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { TenantId = TenantAScope.TenantId });

        BackgroundJobTenantAccessVerifier sut = new(accessor.Object, runs.Object);

        bool accessible = await sut.IsAccessibleAsync("job-a", TenantAScope, CancellationToken.None);

        accessible.Should().BeTrue();
    }

    [Fact]
    public async Task IsAccessibleAsync_analysis_docx_run_out_of_scope_returns_false()
    {
        Guid runId = Guid.NewGuid();
        string runIdText = runId.ToString("N");
        AnalysisReportDocxWorkUnit workUnit = new(
            new AnalysisReportDocxJobPayload { RunId = runIdText },
            "report.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        Mock<IBackgroundJobWorkUnitAccessor> accessor = new();
        accessor
            .Setup(a => a.TryGetAsync("job-b", It.IsAny<CancellationToken>()))
            .ReturnsAsync(workUnit);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(TenantBScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        BackgroundJobTenantAccessVerifier sut = new(accessor.Object, runs.Object);

        bool accessible = await sut.IsAccessibleAsync("job-b", TenantBScope, CancellationToken.None);

        accessible.Should().BeFalse("cross-tenant job poll must fail closed as inaccessible.");
    }

    [Fact]
    public async Task IsAccessibleAsync_itsm_outbound_matching_scope_returns_true()
    {
        ItsmOutboundCreateWorkUnit workUnit = new(
            new ItsmOutboundCreateJobPayload(
                TenantAScope.TenantId,
                TenantAScope.WorkspaceId,
                TenantAScope.ProjectId,
                "finding-1",
                ItsmOutboundIssueProvider.Jira,
                "corr-1"));

        Mock<IBackgroundJobWorkUnitAccessor> accessor = new();
        accessor
            .Setup(a => a.TryGetAsync("job-itsm", It.IsAny<CancellationToken>()))
            .ReturnsAsync(workUnit);

        BackgroundJobTenantAccessVerifier sut = new(accessor.Object, Mock.Of<IRunRepository>());

        bool accessible = await sut.IsAccessibleAsync("job-itsm", TenantAScope, CancellationToken.None);

        accessible.Should().BeTrue();
    }

    [Fact]
    public async Task IsAccessibleAsync_itsm_outbound_foreign_tenant_returns_false()
    {
        ItsmOutboundCreateWorkUnit workUnit = new(
            new ItsmOutboundCreateJobPayload(
                TenantAScope.TenantId,
                TenantAScope.WorkspaceId,
                TenantAScope.ProjectId,
                "finding-1",
                ItsmOutboundIssueProvider.Jira,
                "corr-1"));

        Mock<IBackgroundJobWorkUnitAccessor> accessor = new();
        accessor
            .Setup(a => a.TryGetAsync("job-itsm-b", It.IsAny<CancellationToken>()))
            .ReturnsAsync(workUnit);

        BackgroundJobTenantAccessVerifier sut = new(accessor.Object, Mock.Of<IRunRepository>());

        bool accessible = await sut.IsAccessibleAsync("job-itsm-b", TenantBScope, CancellationToken.None);

        accessible.Should().BeFalse();
    }
}
