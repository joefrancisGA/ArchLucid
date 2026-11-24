using System.Security.Claims;

using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Models;
using ArchLucid.Api.Support;
using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
/// FND-010 reuse: architecture-share authorization must run before any
/// export facade can return metadata, diffs, or replayed artifacts.
/// Scoped and sealed-manifest checks cannot substitute for share authority.
/// </summary>
[Trait("Category", "Unit")]
public sealed class ExportsControllerShareAccessTests
{
    private static readonly Guid RunA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid RunB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Theory]
    [InlineData("history", false)]
    [InlineData("record", false)]
    [InlineData("compare", false)]
    [InlineData("compare", true)]
    [InlineData("summary", false)]
    [InlineData("summary", true)]
    [InlineData("replay", false)]
    [InlineData("replay-metadata", false)]
    public async Task Restricted_run_denied_before_export_facade_or_authority_read(
        string operation, bool denyRightRun)
    {
        const string leftId = "export-left";
        const string rightId = "export-right";

        Mock<IRunExportQueryFacade> facade = new(MockBehavior.Strict);
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        // A two-record comparison can pass the permitted left-run integrity
        // precheck before denying the restricted right run.
        authority.Setup(q => q.GetRunDetailAsync(
                Scope, RunA, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunDetailDto?)null);
        Mock<IManifestHashService> manifestHash = new(MockBehavior.Strict);
        Mock<IScopeContextProvider> scopes = new(MockBehavior.Strict);
        scopes.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IRunExportRecordRepository> records = new(MockBehavior.Strict);
        records.Setup(r => r.GetByIdAsync(leftId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunExportRecord { ExportRecordId = leftId, RunId = RunA.ToString("N") });
        records.Setup(r => r.GetByIdAsync(rightId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunExportRecord { ExportRecordId = rightId, RunId = RunB.ToString("N") });

        Mock<IArchitectureShareAccessGate> sharing = new(MockBehavior.Strict);
        sharing.Setup(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(),
                It.IsAny<ClaimsPrincipal>(),
                Scope,
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ControllerBase controller, ClaimsPrincipal user, ScopeContext scope, Guid id, CancellationToken token) =>
                (IActionResult?)(id == (denyRightRun ? RunB : RunA) ? new NotFoundResult() : null));

        ExportsController controller = new(
            facade.Object, authority.Object, scopes.Object,
            manifestHash.Object, sharing.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

        IActionResult result = operation switch
        {
            "history" => await controller.GetRunExportHistory(RunA.ToString("N"), CancellationToken.None),
            "record" => await controller.GetExportRecord(leftId, records.Object, CancellationToken.None),
            "compare" => await controller.CompareExportRecords(
                leftId, rightId, records.Object, CancellationToken.None),
            "summary" => await controller.CompareExportRecordsSummary(
                leftId, rightId, new PersistComparisonRequest { Persist = true },
                records.Object, CancellationToken.None),
            "replay" => await controller.ReplayExportRecord(
                leftId, new ReplayExportRequest(), records.Object, CancellationToken.None),
            "replay-metadata" => await controller.ReplayExportRecordMetadata(
                leftId, new ReplayExportRequest(), records.Object, CancellationToken.None),
            _ => throw new InvalidOperationException(operation),
        };

        result.Should().BeOfType<NotFoundResult>();
        sharing.Verify(g => g.EnsureRunReadAllowedAsync(
            It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(),
            Scope, denyRightRun ? RunB : RunA, It.IsAny<CancellationToken>()), Times.Once);
        facade.VerifyNoOtherCalls();
        if (denyRightRun)
        {
            authority.Verify(q => q.GetRunDetailAsync(
                Scope, RunA, It.IsAny<CancellationToken>()), Times.Once);
        }
        else
        {
            authority.VerifyNoOtherCalls();
        }
        manifestHash.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-a-run-guid")]
    public async Task Invalid_run_history_id_does_not_reach_export_facade(string runId)
    {
        Mock<IRunExportQueryFacade> facade = new(MockBehavior.Strict);
        Mock<IArchitectureShareAccessGate> sharing = new(MockBehavior.Strict);
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        ExportsController controller = new(
            facade.Object, authority.Object,
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<IManifestHashService>(),
            sharing.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

        IActionResult result = await controller.GetRunExportHistory(runId, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode
            .Should().Be(StatusCodes.Status404NotFound);
        sharing.VerifyNoOtherCalls();
        facade.VerifyNoOtherCalls();
        authority.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-a-run-guid")]
    public async Task Unlinked_export_record_does_not_reach_export_facade(string runId)
    {
        const string exportId = "orphan-export";
        Mock<IRunExportRecordRepository> records = new(MockBehavior.Strict);
        records.Setup(r => r.GetByIdAsync(exportId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunExportRecord { ExportRecordId = exportId, RunId = runId });
        Mock<IRunExportQueryFacade> facade = new(MockBehavior.Strict);
        Mock<IArchitectureShareAccessGate> sharing = new(MockBehavior.Strict);
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);

        ExportsController controller = new(
            facade.Object, authority.Object,
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<IManifestHashService>(), sharing.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult result = await controller.GetExportRecord(exportId, records.Object, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode
            .Should().Be(StatusCodes.Status404NotFound);
        sharing.VerifyNoOtherCalls();
        authority.VerifyNoOtherCalls();
        facade.VerifyNoOtherCalls();
    }
}
