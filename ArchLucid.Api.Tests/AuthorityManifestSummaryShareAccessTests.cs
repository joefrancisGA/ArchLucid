using System.Security.Claims;

using ArchLucid.Api.Contracts;
using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Support;
using ArchLucid.Application;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Common;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Provenance;
using ArchLucid.Application.Runs;
using ArchLucid.Core.Audit;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
/// FND-010: resolve a manifest in trusted scope, authorize its associated run,
/// then verify the exact requested manifest ID, run ownership and sealed hash.
/// Historical manifest IDs must not be confused with the run's current pointer.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityManifestSummaryShareAccessTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid ManifestId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    [Fact]
    public async Task Missing_scoped_manifest_returns_not_found_without_share_or_run_lookup()
    {
        Harness h = new();
        h.Query.Setup(x => x.GetRunIdByManifestIdAsync(
                Scope, ManifestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid?)null);

        IActionResult response = await h.Controller().GetManifestSummary(ManifestId, CancellationToken.None);

        AssertManifestNotFound(response);
        h.Query.Verify(x => x.GetRunIdByManifestIdAsync(
            Scope, ManifestId, It.IsAny<CancellationToken>()), Times.Once);
        h.Query.VerifyNoOtherCalls();
        h.Gate.VerifyNoOtherCalls();
        h.Hash.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Empty_manifest_id_returns_not_found_without_lookup()
    {
        Harness h = new();
        AssertManifestNotFound(await h.Controller().GetManifestSummary(Guid.Empty, CancellationToken.None));
        h.Query.VerifyNoOtherCalls();
        h.Gate.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Empty_run_mapping_is_denied_before_share_or_payload()
    {
        Harness h = new();
        h.Query.Setup(x => x.GetRunIdByManifestIdAsync(Scope, ManifestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid?)Guid.Empty);

        AssertManifestNotFound(await h.Controller().GetManifestSummary(ManifestId, CancellationToken.None));
        h.Query.Verify(x => x.GetRunIdByManifestIdAsync(
            Scope, ManifestId, It.IsAny<CancellationToken>()), Times.Once);
        h.Query.VerifyNoOtherCalls();
        h.Gate.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("wrong-manifest-id")]
    [InlineData("changed-run-id")]
    [InlineData("missing-run-id")]
    [InlineData("missing-summary")]
    public async Task Summary_must_match_authorized_identity_before_run_detail(string kind)
    {
        Harness h = new();
        h.SetupIdentity();
        h.AllowRun();
        ManifestSummaryDto summary = Summary();
        if (kind == "wrong-manifest-id")
            summary.ManifestId = Guid.NewGuid();
        else if (kind == "changed-run-id")
            summary.RunId = Guid.NewGuid();
        else if (kind == "missing-run-id")
            summary.RunId = Guid.Empty;

        h.Query.Setup(x => x.GetManifestSummaryAsync(Scope, ManifestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                h.Gate.Verify(x => x.EnsureRunReadAllowedAsync(
                    It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(),
                    Scope, RunId, It.IsAny<CancellationToken>()), Times.Once);
                return kind == "missing-summary" ? null : summary;
            });

        AssertManifestNotFound(await h.Controller().GetManifestSummary(ManifestId, CancellationToken.None));
        h.Query.Verify(x => x.GetRunIdByManifestIdAsync(
            Scope, ManifestId, It.IsAny<CancellationToken>()), Times.Once);
        h.Query.Verify(x => x.GetManifestSummaryAsync(
            Scope, ManifestId, It.IsAny<CancellationToken>()), Times.Once);
        h.Query.VerifyNoOtherCalls();
        h.Gate.VerifyNoOtherCalls();
        h.Hash.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Unshared_run_is_not_disclosed_and_never_reads_manifest_payload_or_run_detail()
    {
        Harness h = new();
        h.SetupIdentity();
        h.DenyRun();

        IActionResult response = await h.Controller().GetManifestSummary(ManifestId, CancellationToken.None);

        AssertManifestNotFound(response);
        h.Gate.Verify(x => x.EnsureRunReadAllowedAsync(
            It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(),
            Scope, RunId, It.IsAny<CancellationToken>()), Times.Once);
        h.Query.Verify(x => x.GetRunIdByManifestIdAsync(
            Scope, ManifestId, It.IsAny<CancellationToken>()), Times.Once);
        h.Query.Verify(x => x.GetManifestSummaryAsync(
            It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
        h.Query.VerifyNoOtherCalls();
        h.Hash.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Authorized_current_manifest_reuses_pinned_document_without_second_repository_read()
    {
        Harness h = new();
        h.SetupSummary();
        h.AllowRun();
        h.SetupCurrentManifest(Document(ManifestId));

        IActionResult response = await h.Controller().GetManifestSummary(ManifestId, CancellationToken.None);

        ManifestSummaryResponse summary = response.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeOfType<ManifestSummaryResponse>().Subject;
        summary.ManifestId.Should().Be(ManifestId);
        summary.RunId.Should().Be(RunId);
        h.Query.Verify(x => x.GetManifestForSummaryVerificationAsync(
            It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
        h.Hash.Verify(x => x.ComputeHash(It.IsAny<ManifestDocument>()), Times.Once);
    }

    [Fact]
    public async Task Authorized_historical_manifest_verifies_exact_requested_payload_and_current_pin()
    {
        Harness h = new();
        h.SetupSummary();
        h.AllowRun();
        Guid currentId = Guid.NewGuid();
        ManifestDocument historical = Document(ManifestId);
        ManifestDocument current = Document(currentId);
        h.SetupCurrentManifest(current);
        h.Query.Setup(x => x.GetManifestForSummaryVerificationAsync(
                Scope, ManifestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(historical);

        IActionResult response = await h.Controller().GetManifestSummary(ManifestId, CancellationToken.None);

        response.Should().BeOfType<OkObjectResult>();
        h.Query.Verify(x => x.GetManifestForSummaryVerificationAsync(
            Scope, ManifestId, It.IsAny<CancellationToken>()), Times.Once);
        h.Hash.Verify(x => x.ComputeHash(historical), Times.Once);
        h.Hash.Verify(x => x.ComputeHash(current), Times.Once);
    }

    [Theory]
    [InlineData("wrong-identity")]
    [InlineData("wrong-run")]
    [InlineData("wrong-tenant")]
    [InlineData("wrong-hash")]
    [InlineData("missing-requested")]
    public async Task Historical_manifest_with_unverified_binding_fails_closed(string kind)
    {
        Harness h = new();
        h.SetupSummary();
        h.AllowRun();
        h.SetupCurrentManifest(Document(Guid.NewGuid()));
        ManifestDocument document = Document(ManifestId);
        if (kind == "wrong-identity")
            document.ManifestId = Guid.NewGuid();
        if (kind == "wrong-run")
            document.RunId = Guid.NewGuid();
        if (kind == "wrong-tenant")
            document.TenantId = Guid.NewGuid();
        if (kind == "wrong-hash")
            document.ManifestHash = "different-summary-hash";

        h.Query.Setup(x => x.GetManifestForSummaryVerificationAsync(
                Scope, ManifestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(kind == "missing-requested" ? null : document);

        IActionResult response = await h.Controller().GetManifestSummary(ManifestId, CancellationToken.None);

        response.Should().BeOfType<ObjectResult>().Which.StatusCode
            .Should().Be(StatusCodes.Status409Conflict);
        h.Hash.Verify(x => x.ComputeHash(document), Times.Never);
    }

    [Fact]
    public async Task Historical_manifest_with_tampered_payload_hash_fails_closed()
    {
        Harness h = new();
        h.SetupSummary();
        h.AllowRun();
        h.SetupCurrentManifest(Document(Guid.NewGuid()));
        ManifestDocument historical = Document(ManifestId);
        h.Query.Setup(x => x.GetManifestForSummaryVerificationAsync(
                Scope, ManifestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(historical);
        h.Hash.Setup(x => x.ComputeHash(historical)).Returns("tampered-hash");

        IActionResult response = await h.Controller().GetManifestSummary(ManifestId, CancellationToken.None);

        response.Should().BeOfType<ObjectResult>().Which.StatusCode
            .Should().Be(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task Run_header_pinned_manifest_mismatch_fails_closed()
    {
        Harness h = new();
        h.SetupSummary();
        h.AllowRun();
        Guid otherId = Guid.NewGuid();
        h.SetupCurrentManifest(Document(ManifestId), pinnedId: otherId);

        IActionResult response = await h.Controller().GetManifestSummary(ManifestId, CancellationToken.None);

        response.Should().BeOfType<ObjectResult>().Which.StatusCode
            .Should().Be(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task Manifest_linked_to_a_different_run_fails_closed()
    {
        Harness h = new();
        h.SetupSummary();
        h.AllowRun();
        h.SetupCurrentManifest(Document(ManifestId), actualRunId: Guid.NewGuid());

        IActionResult response = await h.Controller().GetManifestSummary(ManifestId, CancellationToken.None);

        response.Should().BeOfType<ObjectResult>().Which.StatusCode
            .Should().Be(StatusCodes.Status409Conflict);
    }

    private static void AssertManifestNotFound(IActionResult action)
    {
        ObjectResult response = action.Should().BeOfType<ObjectResult>().Subject;
        response.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        Microsoft.AspNetCore.Mvc.ProblemDetails details =
            response.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        (details.Detail ?? "").Should().NotContain(RunId.ToString("D"),
            "a denied manifest lookup must not reveal the associated run ID");
    }

    private static ManifestSummaryDto Summary() => new()
    {
        ManifestId = ManifestId,
        RunId = RunId,
        ManifestHash = "sealed-good",
        RuleSetId = "test-rules",
        RuleSetVersion = "1",
        Status = "Committed",
    };

    private static ManifestDocument Document(Guid manifestId) => new()
    {
        ManifestId = manifestId,
        RunId = RunId,
        TenantId = Scope.TenantId,
        WorkspaceId = Scope.WorkspaceId,
        ProjectId = Scope.ProjectId,
        ManifestHash = "sealed-good",
    };

    private sealed class Harness
    {
        internal readonly Mock<IAuthorityQueryService> Query = new(MockBehavior.Strict);
        internal readonly Mock<IArchitectureShareAccessGate> Gate = new(MockBehavior.Strict);
        internal readonly Mock<IManifestHashService> Hash = new(MockBehavior.Strict);
        private readonly Mock<IScopeContextProvider> scopes = new(MockBehavior.Strict);

        internal Harness()
        {
            scopes.Setup(x => x.GetCurrentScope()).Returns(Scope);
            Hash.Setup(x => x.ComputeHash(It.IsAny<ManifestDocument>()))
                .Returns((ManifestDocument m) => m.ManifestHash);
        }

        internal void SetupIdentity() => Query.Setup(x => x.GetRunIdByManifestIdAsync(
                Scope, ManifestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid?)RunId);

        internal void SetupSummary()
        {
            SetupIdentity();
            Query.Setup(x => x.GetManifestSummaryAsync(
                    Scope, ManifestId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(() =>
                {
                    Gate.Verify(x => x.EnsureRunReadAllowedAsync(
                        It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(),
                        Scope, RunId, It.IsAny<CancellationToken>()), Times.Once);
                    return Summary();
                });
        }

        internal void AllowRun() => Gate.Setup(x => x.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(),
                Scope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((IActionResult?)null);

        internal void DenyRun() => Gate.Setup(x => x.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(),
                Scope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new NotFoundResult());

        internal void SetupCurrentManifest(
            ManifestDocument current,
            Guid? pinnedId = null,
            Guid? actualRunId = null)
        {
            Query.Setup(x => x.GetRunDetailForManifestCompareAsync(
                    Scope, RunId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new RunDetailDto
                {
                    Run = new RunRecord
                    {
                        RunId = actualRunId ?? RunId,
                        GoldenManifestId = pinnedId ?? current.ManifestId,
                    },
                    GoldenManifest = current,
                });
        }

        internal AuthorityQueryController Controller()
        {
            AuthorityRunReadHandlers handler = new(
                Query.Object,
                Mock.Of<IAuthorityRunDetailOperatorEnricher>(),
                Mock.Of<IRunRationaleService>(),
                Mock.Of<IRunPipelineAuditTimelineService>(),
                scopes.Object,
                Mock.Of<IProvenanceGraphAccessService>(),
                Mock.Of<IAuditService>(),
                Mock.Of<IActorContext>(),
                Mock.Of<IEffectiveAgentExecutionModeAccessor>(),
                Hash.Object,
                Mock.Of<ILogger<AuthorityRunReadHandlers>>());

            return new AuthorityQueryController(
                Query.Object,
                handler,
                Mock.Of<IAuthorityRunDetailOperatorEnricher>(),
                Mock.Of<IRunRetrievalGroundingService>(),
                scopes.Object,
                Mock.Of<IActorContext>(),
                Mock.Of<IRunOperatorGovernanceDispositionService>(),
                Hash.Object,
                Mock.Of<IRunDetailQueryService>(),
                Mock.Of<IConfiguration>(),
                Mock.Of<IEffectiveAgentExecutionModeAccessor>(),
                Gate.Object,
                Mock.Of<ILogger<AuthorityQueryController>>())
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext()
                }
            };
        }
    }
}
