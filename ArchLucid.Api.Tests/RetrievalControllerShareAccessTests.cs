using System.Security.Claims;

using ArchLucid.Api.Controllers.Planning;
using ArchLucid.Api.Support;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RetrievalControllerShareAccessTests
{
    private static readonly Guid RunA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid RunB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid Manifest = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Denied_run_or_manifest_stops_before_payload_or_search(bool manifestOnly)
    {
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        if (manifestOnly)
            authority.Setup(q => q.GetRunIdByManifestIdAsync(Scope, Manifest, CancellationToken.None))
                .ReturnsAsync((Guid?)RunA);

        Mock<IArchitectureShareAccessGate> gate = new(MockBehavior.Strict);
        NotFoundResult denial = new();
        gate.Setup(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(), Scope, RunA, CancellationToken.None))
            .ReturnsAsync((IActionResult?)denial);

        RetrievalController controller = CreateController(gate.Object, authority: authority.Object);

        IActionResult result = await controller.Search(
            "evidence", manifestOnly ? null : RunA, manifestOnly ? Manifest : null, 8, CancellationToken.None);

        if (manifestOnly)
        {
            result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
            authority.Verify(q => q.GetRunIdByManifestIdAsync(Scope, Manifest, CancellationToken.None), Times.Once);
        }
        else
            result.Should().BeSameAs(denial);

        authority.VerifyNoOtherCalls();
        gate.Verify(g => g.EnsureRunReadAllowedAsync(controller, controller.User, Scope, RunA, CancellationToken.None), Times.Once);
        gate.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Missing_or_mismatched_manifest_owner_does_not_start_authorization_or_retrieval(bool mismatched)
    {
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        authority.Setup(q => q.GetRunIdByManifestIdAsync(Scope, Manifest, CancellationToken.None))
            .ReturnsAsync(mismatched ? RunB : (Guid?)null);
        Mock<IArchitectureShareAccessGate> gate = new(MockBehavior.Strict);
        RetrievalController controller = CreateController(gate.Object, authority: authority.Object);

        IActionResult result = await controller.Search("evidence", RunA, Manifest, 8, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        gate.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Authorized_manifest_still_requires_exact_manifest_identity_before_vector_search()
    {
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        Mock<IArchitectureShareAccessGate> gate = new(MockBehavior.Strict);
        MockSequence sequence = new();
        authority.InSequence(sequence).Setup(q => q.GetRunIdByManifestIdAsync(Scope, Manifest, CancellationToken.None))
            .ReturnsAsync((Guid?)RunA);
        gate.InSequence(sequence).Setup(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(), Scope, RunA, CancellationToken.None))
            .ReturnsAsync((IActionResult?)null);
        authority.InSequence(sequence).Setup(q => q.GetManifestSummaryAsync(Scope, Manifest, CancellationToken.None))
            .ReturnsAsync((ManifestSummaryDto?)null);

        RetrievalController controller = CreateController(gate.Object, authority: authority.Object);
        IActionResult result = await controller.Search("evidence", null, Manifest, 8, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Explicit_run_authorizes_before_existing_seal_read_and_vector_filter()
    {
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        Mock<IArchitectureShareAccessGate> gate = new(MockBehavior.Strict);
        Mock<IRetrievalQueryService> retrieval = new(MockBehavior.Strict);
        MockSequence sequence = new();
        gate.InSequence(sequence).Setup(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(), Scope, RunA, CancellationToken.None))
            .ReturnsAsync((IActionResult?)null);
        authority.InSequence(sequence).Setup(q => q.GetRunDetailAsync(Scope, RunA, CancellationToken.None))
            .ReturnsAsync((RunDetailDto?)null);
        retrieval.InSequence(sequence).Setup(r => r.SearchAsync(
                It.Is<RetrievalQuery>(q => q.RunId == RunA && q.ManifestId == null &&
                    q.AuthorizedEvidenceRunIds != null && q.AuthorizedEvidenceRunIds.SetEquals(new[] { RunA })),
                CancellationToken.None))
            .ReturnsAsync(Array.Empty<RetrievalHit>());

        RetrievalController controller = CreateController(gate.Object, retrieval.Object, authority.Object);
        IActionResult result = await controller.Search("evidence", RunA, null, 8, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Project_search_authorizes_each_discovered_run_and_filters_before_search()
    {
        DateTime cursor = new(2026, 11, 24, 0, 0, 0, DateTimeKind.Utc);
        Mock<IRunRepository> runs = new(MockBehavior.Strict);
        Mock<IArchitectureShareAccessGate> gate = new(MockBehavior.Strict);
        Mock<IRetrievalQueryService> retrieval = new(MockBehavior.Strict);
        MockSequence sequence = new();

        runs.InSequence(sequence).Setup(r => r.ListRecentInScopeKeysetAsync(
                Scope, null, null, RunPagination.MaxTake, CancellationToken.None))
            .ReturnsAsync(new RunListPage([new RunRecord { RunId = RunA, CreatedUtc = cursor }], true));
        gate.InSequence(sequence).Setup(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(), Scope, RunA, CancellationToken.None))
            .ReturnsAsync((IActionResult?)null);
        runs.InSequence(sequence).Setup(r => r.ListRecentInScopeKeysetAsync(
                Scope, cursor, RunA, RunPagination.MaxTake, CancellationToken.None))
            .ReturnsAsync(new RunListPage([new RunRecord { RunId = RunB, CreatedUtc = cursor.AddDays(-1) }], false));
        gate.InSequence(sequence).Setup(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(), Scope, RunB, CancellationToken.None))
            .ReturnsAsync((IActionResult?)new NotFoundResult());
        retrieval.InSequence(sequence).Setup(r => r.SearchAsync(
                It.Is<RetrievalQuery>(q => q.RunId == null && q.AuthorizedEvidenceRunIds != null &&
                    q.AuthorizedEvidenceRunIds.SetEquals(new[] { RunA })), CancellationToken.None))
            .ReturnsAsync(Array.Empty<RetrievalHit>());

        RetrievalController controller = CreateController(gate.Object, retrieval.Object, runs: runs.Object);
        IActionResult result = await controller.Search("evidence", null, null, 8, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Project_search_with_no_visible_runs_does_not_dispatch_vector_search()
    {
        Mock<IRunRepository> runs = new(MockBehavior.Strict);
        runs.Setup(r => r.ListRecentInScopeKeysetAsync(Scope, null, null, RunPagination.MaxTake, CancellationToken.None))
            .ReturnsAsync(new RunListPage([new RunRecord { RunId = RunB }], false));
        Mock<IArchitectureShareAccessGate> gate = new(MockBehavior.Strict);
        gate.Setup(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(), Scope, RunB, CancellationToken.None))
            .ReturnsAsync((IActionResult?)new NotFoundResult());
        RetrievalController controller = CreateController(gate.Object, runs: runs.Object);

        IActionResult result = await controller.Search("evidence", null, null, 8, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeAssignableTo<IReadOnlyList<RetrievalHit>>()
            .Which.Should().BeEmpty();
    }

    [Fact]
    public async Task Incomplete_project_enumeration_fails_closed()
    {
        Mock<IRunRepository> runs = new(MockBehavior.Strict);
        runs.Setup(r => r.ListRecentInScopeKeysetAsync(Scope, null, null, RunPagination.MaxTake, CancellationToken.None))
            .ReturnsAsync(new RunListPage([], true));
        RetrievalController controller = CreateController(
            new Mock<IArchitectureShareAccessGate>(MockBehavior.Strict).Object, runs: runs.Object);

        IActionResult result = await controller.Search("evidence", null, null, 8, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Authorized_manifest_search_verifies_current_or_historical_exact_seal(bool historical)
    {
        Guid currentId = historical ? Guid.NewGuid() : Manifest;
        ManifestDocument MakeDocument(Guid id) => new()
        {
            ManifestId = id,
            RunId = RunA,
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ProjectId = Scope.ProjectId,
            ManifestHash = "sealed-good",
        };
        ManifestDocument current = MakeDocument(currentId);
        ManifestDocument exact = historical ? MakeDocument(Manifest) : current;
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        Mock<IArchitectureShareAccessGate> gate = new(MockBehavior.Strict);
        Mock<IManifestHashService> hash = new(MockBehavior.Strict);
        Mock<IRetrievalQueryService> retrieval = new(MockBehavior.Strict);
        MockSequence sequence = new();
        authority.InSequence(sequence).Setup(q => q.GetRunIdByManifestIdAsync(Scope, Manifest, CancellationToken.None))
            .ReturnsAsync((Guid?)RunA);
        gate.InSequence(sequence).Setup(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(), Scope, RunA, CancellationToken.None))
            .ReturnsAsync((IActionResult?)null);
        authority.InSequence(sequence).Setup(q => q.GetManifestSummaryAsync(Scope, Manifest, CancellationToken.None))
            .ReturnsAsync(new ManifestSummaryDto { ManifestId = Manifest, RunId = RunA, ManifestHash = "sealed-good" });
        authority.InSequence(sequence).Setup(q => q.GetRunDetailForManifestCompareAsync(Scope, RunA, CancellationToken.None))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = RunA, GoldenManifestId = currentId },
                GoldenManifest = current,
            });
        if (historical)
            authority.InSequence(sequence).Setup(q => q.GetManifestForSummaryVerificationAsync(Scope, Manifest, CancellationToken.None))
                .ReturnsAsync(exact);
        hash.InSequence(sequence).Setup(h => h.ComputeHash(exact)).Returns("sealed-good");
        if (historical)
            hash.InSequence(sequence).Setup(h => h.ComputeHash(current)).Returns("sealed-good");
        retrieval.InSequence(sequence).Setup(r => r.SearchAsync(
                It.Is<RetrievalQuery>(q => q.RunId == RunA && q.ManifestId == Manifest &&
                    q.AuthorizedEvidenceRunIds != null && q.AuthorizedEvidenceRunIds.SetEquals(new[] { RunA })),
                CancellationToken.None))
            .ReturnsAsync(Array.Empty<RetrievalHit>());

        RetrievalController controller = CreateController(gate.Object, retrieval.Object, authority.Object, hash: hash.Object);
        IActionResult result = await controller.Search("evidence", null, Manifest, 8, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    private static RetrievalController CreateController(
        IArchitectureShareAccessGate gate,
        IRetrievalQueryService? retrieval = null,
        IAuthorityQueryService? authority = null,
        IRunRepository? runs = null,
        IManifestHashService? hash = null)
    {
        Mock<IScopeContextProvider> scopes = new(MockBehavior.Strict);
        scopes.Setup(s => s.GetCurrentScope()).Returns(Scope);
        return new RetrievalController(
            retrieval ?? new Mock<IRetrievalQueryService>(MockBehavior.Strict).Object,
            scopes.Object,
            authority ?? new Mock<IAuthorityQueryService>(MockBehavior.Strict).Object,
            hash ?? new Mock<IManifestHashService>(MockBehavior.Strict).Object,
            gate,
            runs ?? new Mock<IRunRepository>(MockBehavior.Strict).Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
