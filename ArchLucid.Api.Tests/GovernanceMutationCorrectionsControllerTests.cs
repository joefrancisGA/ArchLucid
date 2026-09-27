using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;
using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class GovernanceMutationCorrectionsControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private const string ValidRationale = "Operator recorded a correction after reviewing the approval trail.";

    [Fact]
    public async Task RecordGovernanceMutationCorrection_returns_bad_request_when_run_id_exceeds_max_length()
    {
        string overlongRunId = new string('r', GovernanceRequestValidationRules.RunIdMaxLength + 1);
        Mock<IGovernanceMutationCorrectionService> mutationCorrections = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(mutationCorrections.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.RecordGovernanceMutationCorrection(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.QuickApprove,
                SubjectId = "apr-1",
                RunId = overlongRunId,
                Rationale = new string('x', FindingDispositionValidation.MinimumRationaleLength),
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        mutationCorrections.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RecordGovernanceMutationCorrection_returns_bad_request_when_subject_id_exceeds_max_length()
    {
        string overlongSubjectId = new string('s', GovernanceRequestValidationRules.FindingIdMaxLength + 1);
        Mock<IGovernanceMutationCorrectionService> mutationCorrections = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(mutationCorrections.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.RecordGovernanceMutationCorrection(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.QuickApprove,
                SubjectId = overlongSubjectId,
                RunId = Guid.NewGuid().ToString("D"),
                Rationale = new string('x', FindingDispositionValidation.MinimumRationaleLength),
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        mutationCorrections.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RecordGovernanceMutationCorrection_returns_bad_request_when_rationale_exceeds_max_length()
    {
        Mock<IGovernanceMutationCorrectionService> mutationCorrections = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(mutationCorrections.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.RecordGovernanceMutationCorrection(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.QuickApprove,
                SubjectId = "apr-1",
                RunId = Guid.NewGuid().ToString("D"),
                Rationale = new string('x', FindingDispositionValidation.MaximumRationaleLength + 1),
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        mutationCorrections.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RecordGovernanceMutationCorrection_returns_bad_request_when_run_id_is_empty_guid_and_tenant_missing()
    {
        Mock<IGovernanceMutationCorrectionService> mutationCorrections = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            mutationCorrections.Object,
            tenantRepository: TenantMissingRepository());
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.RecordGovernanceMutationCorrection(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.QuickApprove,
                SubjectId = "apr-1",
                RunId = Guid.Empty.ToString("D"),
                Rationale = ValidRationale,
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        mutationCorrections.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RecordGovernanceMutationCorrection_returns_bad_request_when_run_id_is_not_valid_and_tenant_missing()
    {
        Mock<IGovernanceMutationCorrectionService> mutationCorrections = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            mutationCorrections.Object,
            tenantRepository: TenantMissingRepository());
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.RecordGovernanceMutationCorrection(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.QuickApprove,
                SubjectId = "apr-1",
                RunId = "not-a-guid",
                Rationale = ValidRationale,
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        mutationCorrections.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RecordGovernanceMutationCorrection_returns_conflict_when_padded_run_id_has_sealed_manifest_hash_drift()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string paddedRunId = $"  {runId:D}  ";
        const string storedHash = "stored-manifest-hash";
        const string computedHash = "recomputed-manifest-hash";

        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        authority
            .Setup(service => service.GetRunDetailAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                GoldenManifest = new ManifestDocument
                {
                    RunId = runId,
                    ManifestHash = storedHash,
                },
            });

        Mock<IManifestHashService> manifestHash = new(MockBehavior.Strict);
        manifestHash
            .Setup(service => service.ComputeHash(It.IsAny<ManifestDocument>()))
            .Returns(computedHash);

        Mock<IGovernanceMutationCorrectionService> mutationCorrections = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            mutationCorrections.Object,
            authorityQueryService: authority.Object,
            manifestHashService: manifestHash.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.RecordGovernanceMutationCorrection(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.QuickApprove,
                SubjectId = "apr-1",
                RunId = paddedRunId,
                Rationale = ValidRationale,
            },
            CancellationToken.None);

        ObjectResult conflict = result.Should().BeOfType<ObjectResult>().Subject;
        conflict.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        conflict.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>()
            .Which.Type.Should().Be(ProblemTypes.Conflict);
        mutationCorrections.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RecordGovernanceMutationCorrection_returns_bad_request_when_mutation_kind_is_unsupported_and_tenant_missing()
    {
        Mock<IGovernanceMutationCorrectionService> mutationCorrections = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            mutationCorrections.Object,
            tenantRepository: TenantMissingRepository());
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.RecordGovernanceMutationCorrection(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = "not-a-supported-kind",
                SubjectId = "apr-1",
                RunId = Guid.NewGuid().ToString("D"),
                Rationale = ValidRationale,
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        mutationCorrections.VerifyNoOtherCalls();
    }

    private static GovernanceController CreateController(
        IGovernanceMutationCorrectionService mutationCorrectionService,
        ITenantRepository? tenantRepository = null,
        IAuthorityQueryService? authorityQueryService = null,
        IManifestHashService? manifestHashService = null)
    {
        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("operator@test");

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);

        return GovernanceControllerTestFactory.Create(
            actorContext: actor.Object,
            scopeContextProvider: scope.Object,
            mutationCorrectionService: mutationCorrectionService,
            tenantRepository: tenantRepository ?? TenantExistsRepository(),
            authorityQueryService: authorityQueryService,
            manifestHashService: manifestHashService);
    }

    private static ITenantRepository TenantMissingRepository() =>
        Mock.Of<ITenantRepository>(repository => repository.GetByIdAsync(
            Scope.TenantId,
            It.IsAny<CancellationToken>()) == Task.FromResult<TenantRecord?>(null));

    private static ITenantRepository TenantExistsRepository()
    {
        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(repository => repository.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        return tenants.Object;
    }
}
