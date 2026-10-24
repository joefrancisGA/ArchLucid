using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Operations;
using ArchLucid.Application.Planning;
using ArchLucid.Application.Planning.AdvisoryDraft;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Async;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Query;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.TestSupport.SealedManifest;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Operations;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.Requests;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Feedback;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using FluentValidation;
using FluentValidation.Results;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using MvcProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunsControllerTests
{
    private static readonly Lazy<string> OverLimitIntakeText = new(
        () => new string('x', DraftIntakeValidation.MaximumFreeTextIntentLength + 1));

    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    [Fact]
    public async Task CreateRun_returns_bad_request_when_body_null()
    {
        RunsController controller = CreateController();

        IActionResult action = await controller.CreateRun(null, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task AcceptCreateRunAsync_returns_bad_request_when_architecture_request_fails_validation()
    {
        Mock<IArchitectureRunAsyncOperationAcceptor> asyncAcceptor = new();

        RunsController controller = CreateController(architectureRequestValidator: new ArchitectureRequestValidator());

        ArchitectureRequest request = new()
        {
            Description = string.Empty,
            SystemName = string.Empty,
        };

        IActionResult action = await controller.AcceptCreateRunAsync(
            request,
            asyncAcceptor.Object,
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        MvcProblemDetails problem = bad.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        problem.Detail.Should().Contain("Description is required.");

        asyncAcceptor.Verify(
            static a => a.AcceptCreateAsync(
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<CreateRunIdempotencyState?>(),
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task AcceptCreateRunAsync_returns_accepted_when_idempotency_key_header_omitted()
    {
        Mock<IArchitectureRunAsyncOperationAcceptor> asyncAcceptor = new();
        asyncAcceptor
            .Setup(a => a.AcceptCreateAsync(
                It.IsAny<ArchitectureRequest>(),
                null,
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("run:async-no-idem");

        RunsController controller = CreateController();

        ArchitectureRequest request = new()
        {
            RequestId = "req-async-no-idem",
            Description = new string('x', 20),
            SystemName = "CreatedArch",
            WorkflowIntent = ArchitectureWorkflowIntent.CreateArchitecture,
        };

        IActionResult action = await controller.AcceptCreateRunAsync(
            request,
            asyncAcceptor.Object,
            CancellationToken.None);

        StatusCodeResult accepted = action.Should().BeOfType<StatusCodeResult>().Subject;
        accepted.StatusCode.Should().Be(StatusCodes.Status202Accepted);

        asyncAcceptor.Verify(
            static a => a.AcceptCreateAsync(
                It.IsAny<ArchitectureRequest>(),
                null,
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task AcceptCreateRunAsync_returns_bad_request_when_idempotency_key_exceeds_max_length()
    {
        Mock<IArchitectureRunAsyncOperationAcceptor> asyncAcceptor = new();
        Mock<IRunLifecycleCommandService> lifecycle = new();
        lifecycle
            .Setup(s => s.ValidateIdempotencyKey(It.IsAny<string?>()))
            .Returns<string?>(raw =>
            {
                if (raw is null)
                    return new IdempotencyKeyValidationResult(true, null, null);

                string trimmed = raw.Trim();

                if (trimmed.Length > ArchitectureRunIdempotencyHashing.MaxIdempotencyKeyLength)
                {
                    return new IdempotencyKeyValidationResult(
                        false,
                        null,
                        $"Idempotency-Key must be at most {ArchitectureRunIdempotencyHashing.MaxIdempotencyKeyLength} characters after trim.");
                }

                return new IdempotencyKeyValidationResult(true, trimmed.Length == 0 ? null : trimmed, null);
            });

        RunsController controller = CreateController(runLifecycleCommandService: lifecycle.Object);

        controller.ControllerContext.HttpContext.Request.Headers["Idempotency-Key"] =
            new string('k', ArchitectureRunIdempotencyHashing.MaxIdempotencyKeyLength + 1);

        ArchitectureRequest request = new()
        {
            RequestId = "req-async-bad-idem",
            Description = new string('x', 20),
            SystemName = "CreatedArch",
            WorkflowIntent = ArchitectureWorkflowIntent.CreateArchitecture,
        };

        IActionResult action = await controller.AcceptCreateRunAsync(
            request,
            asyncAcceptor.Object,
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        asyncAcceptor.Verify(
            static a => a.AcceptCreateAsync(
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<CreateRunIdempotencyState?>(),
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task LookupCreateRunByIdempotencyKey_returns_bad_request_when_idempotency_key_header_missing()
    {
        Mock<IRunLifecycleCommandService> lifecycle = new();

        RunsController controller = CreateController(runLifecycleCommandService: lifecycle.Object);

        IActionResult action = await controller.LookupCreateRunByIdempotencyKey(null, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        lifecycle.Verify(
            static s => s.LookupCreateRunByIdempotencyKeyAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task LookupCreateRunByIdempotencyKey_returns_bad_request_when_idempotency_key_is_whitespace_only()
    {
        Mock<IRunLifecycleCommandService> lifecycle = new();

        RunsController controller = CreateController(runLifecycleCommandService: lifecycle.Object);

        IActionResult action = await controller.LookupCreateRunByIdempotencyKey("   ", CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        lifecycle.Verify(
            static s => s.ValidateIdempotencyKey(It.IsAny<string?>()),
            Times.Never);

        lifecycle.Verify(
            static s => s.LookupCreateRunByIdempotencyKeyAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task LookupCreateRunByIdempotencyKey_returns_bad_request_when_idempotency_key_exceeds_max_length()
    {
        Mock<IRunLifecycleCommandService> lifecycle = new();
        lifecycle
            .Setup(s => s.ValidateIdempotencyKey(It.IsAny<string?>()))
            .Returns<string?>(raw =>
            {
                if (raw is null)
                    return new IdempotencyKeyValidationResult(true, null, null);

                string trimmed = raw.Trim();

                if (trimmed.Length > ArchitectureRunIdempotencyHashing.MaxIdempotencyKeyLength)
                {
                    return new IdempotencyKeyValidationResult(
                        false,
                        null,
                        $"Idempotency-Key must be at most {ArchitectureRunIdempotencyHashing.MaxIdempotencyKeyLength} characters after trim.");
                }

                return new IdempotencyKeyValidationResult(true, trimmed.Length == 0 ? null : trimmed, null);
            });

        RunsController controller = CreateController(runLifecycleCommandService: lifecycle.Object);

        string overlongKey = new string('k', ArchitectureRunIdempotencyHashing.MaxIdempotencyKeyLength + 1);

        IActionResult action = await controller.LookupCreateRunByIdempotencyKey(overlongKey, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        lifecycle.Verify(
            static s => s.LookupCreateRunByIdempotencyKeyAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateRunBatch_proceeds_with_null_idempotency_when_header_is_whitespace_only()
    {
        Mock<IRunLifecycleCommandService> lifecycle = new();
        lifecycle
            .Setup(s => s.ValidateIdempotencyKey(It.IsAny<string?>()))
            .Returns<string?>(raw =>
            {
                if (raw is null)
                    return new IdempotencyKeyValidationResult(true, null, null);

                string trimmed = raw.Trim();
                return new IdempotencyKeyValidationResult(true, trimmed.Length == 0 ? null : trimmed, null);
            });
        lifecycle
            .Setup(s => s.CreateRunBatchAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<IReadOnlyList<ArchitectureRequest>>(),
                null,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new BatchCreateRunOrchestrationResult
            {
                Outcome = BatchCreateRunOutcome.Accepted,
                Items = [],
            });

        RunsController controller = CreateController(runLifecycleCommandService: lifecycle.Object);

        controller.ControllerContext.HttpContext.Request.Headers["Idempotency-Key"] = "   ";

        ArchitectureRequest[] requests =
        [
            new()
            {
                RequestId = "batch-ws-idem",
                Description = new string('x', 20),
                SystemName = "CreatedArch",
            },
        ];

        IActionResult action = await controller.CreateRunBatch(requests, CancellationToken.None);

        action.Should().BeOfType<AcceptedResult>();

        lifecycle.Verify(
            static s => s.CreateRunBatchAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<IReadOnlyList<ArchitectureRequest>>(),
                null,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CreateRunBatch_returns_bad_request_when_idempotency_key_exceeds_max_length()
    {
        Mock<IRunLifecycleCommandService> lifecycle = new();
        lifecycle
            .Setup(s => s.ValidateIdempotencyKey(It.IsAny<string?>()))
            .Returns<string?>(raw =>
            {
                if (raw is null)
                    return new IdempotencyKeyValidationResult(true, null, null);

                string trimmed = raw.Trim();

                if (trimmed.Length > ArchitectureRunIdempotencyHashing.MaxIdempotencyKeyLength)
                {
                    return new IdempotencyKeyValidationResult(
                        false,
                        null,
                        $"Idempotency-Key must be at most {ArchitectureRunIdempotencyHashing.MaxIdempotencyKeyLength} characters after trim.");
                }

                return new IdempotencyKeyValidationResult(true, trimmed.Length == 0 ? null : trimmed, null);
            });

        RunsController controller = CreateController(runLifecycleCommandService: lifecycle.Object);

        controller.ControllerContext.HttpContext.Request.Headers["Idempotency-Key"] =
            new string('k', ArchitectureRunIdempotencyHashing.MaxIdempotencyKeyLength + 1);

        ArchitectureRequest[] requests =
        [
            new()
            {
                RequestId = "batch-bad-idem",
                Description = new string('x', 20),
                SystemName = "CreatedArch",
            },
        ];

        IActionResult action = await controller.CreateRunBatch(requests, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        lifecycle.Verify(
            static s => s.CreateRunBatchAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<IReadOnlyList<ArchitectureRequest>>(),
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateRun_returns_bad_request_when_idempotency_key_exceeds_max_length()
    {
        Mock<IRunLifecycleCommandService> lifecycle = new();
        lifecycle
            .Setup(s => s.ValidateIdempotencyKey(It.IsAny<string?>()))
            .Returns<string?>(raw =>
            {
                if (raw is null)
                    return new IdempotencyKeyValidationResult(true, null, null);

                string trimmed = raw.Trim();

                if (trimmed.Length > ArchitectureRunIdempotencyHashing.MaxIdempotencyKeyLength)
                {
                    return new IdempotencyKeyValidationResult(
                        false,
                        null,
                        $"Idempotency-Key must be at most {ArchitectureRunIdempotencyHashing.MaxIdempotencyKeyLength} characters after trim.");
                }

                return new IdempotencyKeyValidationResult(true, trimmed.Length == 0 ? null : trimmed, null);
            });

        RunsController controller = CreateController(runLifecycleCommandService: lifecycle.Object);

        controller.ControllerContext.HttpContext.Request.Headers["Idempotency-Key"] =
            new string('k', ArchitectureRunIdempotencyHashing.MaxIdempotencyKeyLength + 1);

        ArchitectureRequest request = new()
        {
            RequestId = "req-sync-bad-idem",
            Description = new string('x', 20),
            SystemName = "CreatedArch",
            WorkflowIntent = ArchitectureWorkflowIntent.CreateArchitecture,
        };

        IActionResult action = await controller.CreateRun(request, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        lifecycle.Verify(
            static s => s.CreateRunAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateRun_proceeds_with_null_idempotency_when_header_is_whitespace_only()
    {
        Mock<IRunLifecycleCommandService> lifecycle = new();
        lifecycle
            .Setup(s => s.ValidateIdempotencyKey(It.IsAny<string?>()))
            .Returns<string?>(raw =>
            {
                if (raw is null)
                    return new IdempotencyKeyValidationResult(true, null, null);

                string trimmed = raw.Trim();
                return new IdempotencyKeyValidationResult(true, trimmed.Length == 0 ? null : trimmed, null);
            });
        lifecycle
            .Setup(s => s.CreateRunAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<ArchitectureRequest>(),
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CreateRunCommandResult
            {
                SynthesisResult = new ArchitectureSynthesisGenerateResult
                {
                    RunId = Guid.NewGuid().ToString("N"),
                    PackageOrigin = ArchitecturePackageOrigin.Created,
                },
            });

        RunsController controller = CreateController(runLifecycleCommandService: lifecycle.Object);

        controller.ControllerContext.HttpContext.Request.Headers["Idempotency-Key"] = "   ";

        ArchitectureRequest request = new()
        {
            RequestId = "req-sync-ws-idem",
            Description = new string('x', 20),
            SystemName = "CreatedArch",
            WorkflowIntent = ArchitectureWorkflowIntent.CreateArchitecture,
        };

        IActionResult action = await controller.CreateRun(request, CancellationToken.None);

        action.Should().BeOfType<CreatedAtActionResult>();

        lifecycle.Verify(
            static s => s.CreateRunAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<ArchitectureRequest>(),
                null,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CreateRun_returns_bad_request_when_coordination_rejects_minimal_request()
    {
        Mock<IRunLifecycleCommandService> lifecycle = new();
        lifecycle
            .Setup(s => s.CreateRunAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException(
                "CreateRun failed: SystemName is required.; Description is required."));

        RunsController controller = CreateController(runLifecycleCommandService: lifecycle.Object);

        ArchitectureRequest request = new()
        {
            Description = string.Empty,
            SystemName = string.Empty,
        };

        IActionResult action = await controller.CreateRun(request, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        lifecycle.Verify(
            static s => s.CreateRunAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task DraftRequest_returns_bad_request_when_body_null()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();

        RunsController controller = CreateController();

        IActionResult action = await controller.DraftRequest(null, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task DraftRequestAsync_returns_bad_request_when_body_null()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();
        Mock<IAdvisoryDraftOperationAcceptor> acceptor = new();

        RunsController controller = CreateController();

        IActionResult action = await controller.DraftRequestAsync(
            null,
            intakeFacade.Object,
            acceptor.Object,
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        acceptor.Verify(
            static a => a.AcceptAsync(It.IsAny<DraftArchitectureRequestInput>(), It.IsAny<ScopeContext>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DraftRequest_returns_bad_request_when_description_too_short()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();

        RunsController controller = CreateController();

        DraftArchitectureRequestInput input = new() { FreeTextDescription = "too short" };

        IActionResult action = await controller.DraftRequest(input, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task DraftRequest_calls_intake_facade_when_free_text_is_exactly_minimum_length()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();
        intakeFacade
            .Setup(f => f.DraftAsync(It.IsAny<DraftArchitectureRequestInput>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DraftArchitectureRequestResponse());

        RunsController controller = CreateController();

        DraftArchitectureRequestInput input = new() { FreeTextDescription = new string('a', 20) };

        IActionResult action = await controller.DraftRequest(input, intakeFacade.Object, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();

        intakeFacade.Verify(
            static f => f.DraftAsync(
                It.Is<DraftArchitectureRequestInput>(i => i.FreeTextDescription!.Length == 20),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task DraftRequest_returns_bad_request_when_description_contains_invalid_surrogate()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();

        RunsController controller = CreateController();

        DraftArchitectureRequestInput input = new()
        {
            FreeTextDescription = new string('a', 19) + "\uD800",
        };

        IActionResult action = await controller.DraftRequest(input, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        intakeFacade.Verify(
            static f => f.DraftAsync(It.IsAny<DraftArchitectureRequestInput>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RewriteArchitectureOverview_returns_bad_request_when_body_is_null()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();

        RunsController controller = CreateController();

        IActionResult action = await controller.RewriteArchitectureOverview(null, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        intakeFacade.Verify(
            static f => f.RewriteOverviewAsync(It.IsAny<RewriteArchitectureOverviewInput>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RewriteArchitectureOverview_returns_bad_request_when_current_overview_is_empty()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();

        RunsController controller = CreateController();

        RewriteArchitectureOverviewInput input = new() { CurrentOverview = string.Empty };

        IActionResult action = await controller.RewriteArchitectureOverview(input, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        intakeFacade.Verify(
            static f => f.RewriteOverviewAsync(It.IsAny<RewriteArchitectureOverviewInput>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RewriteArchitectureOverview_returns_bad_request_when_current_overview_is_whitespace_only()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();

        RunsController controller = CreateController();

        RewriteArchitectureOverviewInput input = new() { CurrentOverview = "   " };

        IActionResult action = await controller.RewriteArchitectureOverview(input, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        intakeFacade.Verify(
            static f => f.RewriteOverviewAsync(It.IsAny<RewriteArchitectureOverviewInput>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RewriteArchitectureOverview_returns_bad_request_when_current_overview_is_too_short()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();

        RunsController controller = CreateController();

        RewriteArchitectureOverviewInput input = new() { CurrentOverview = new string('a', 19) };

        IActionResult action = await controller.RewriteArchitectureOverview(input, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        intakeFacade.Verify(
            static f => f.RewriteOverviewAsync(It.IsAny<RewriteArchitectureOverviewInput>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RewriteArchitectureOverview_returns_rewritten_overview_when_valid()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();
        intakeFacade
            .Setup(s => s.RewriteOverviewAsync(It.IsAny<RewriteArchitectureOverviewInput>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RewriteArchitectureOverviewResponse
            {
                RewrittenOverview = "Grounded overview with EU data residency.",
            });

        RunsController controller = CreateController();

        RewriteArchitectureOverviewInput input = new()
        {
            CurrentOverview = "Tenant migration platform with private networking and EU residency goals.",
            StructuredBrief = new ArchitectureDraftStructuredBrief
            {
                ConfirmedConstraints = ["EU data residency"],
            },
        };

        IActionResult action = await controller.RewriteArchitectureOverview(input, intakeFacade.Object, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        RewriteArchitectureOverviewResponse response =
            ok.Value.Should().BeOfType<RewriteArchitectureOverviewResponse>().Subject;

        response.RewrittenOverview.Should().Contain("EU data residency");
    }

    [Fact]
    public async Task ExplainStructuredBriefSuggestion_returns_bad_request_when_body_null()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();

        RunsController controller = CreateController();

        IActionResult action = await controller.ExplainStructuredBriefSuggestion(null, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task ExplainStructuredBriefSuggestion_returns_bad_request_when_source_text_exceeds_chat_intake_max_length()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();

        RunsController controller = CreateController();

        ExplainStructuredBriefSuggestionInput input = new()
        {
            SourceText = OverLimitIntakeText.Value,
            SuggestionKind = StructuredBriefSuggestionKind.Constraint,
            SuggestionText = "EU data residency",
        };

        IActionResult action = await controller.ExplainStructuredBriefSuggestion(input, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task ExplainStructuredBriefSuggestion_returns_bad_request_when_suggestion_text_exceeds_chat_intake_max_length()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();

        RunsController controller = CreateController();

        ExplainStructuredBriefSuggestionInput input = new()
        {
            SourceText = "Tenant migration platform with private networking and EU residency goals.",
            SuggestionKind = StructuredBriefSuggestionKind.Constraint,
            SuggestionText = OverLimitIntakeText.Value,
        };

        IActionResult action = await controller.ExplainStructuredBriefSuggestion(input, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task RephraseClarificationAnswers_returns_bad_request_when_items_collection_is_null()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();

        RunsController controller = CreateController();

        RephraseClarificationAnswersInput input = new() { Items = null! };

        IActionResult action = await controller.RephraseClarificationAnswers(input, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        intakeFacade.Verify(
            static f => f.RephraseClarificationAnswersAsync(It.IsAny<RephraseClarificationAnswersInput>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RephraseClarificationAnswers_returns_bad_request_when_items_collection_contains_null_element()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();

        RunsController controller = CreateController();

        RephraseClarificationAnswersInput input = new()
        {
            Items = [null!],
        };

        IActionResult action = await controller.RephraseClarificationAnswers(input, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        intakeFacade.Verify(
            static f => f.RephraseClarificationAnswersAsync(It.IsAny<RephraseClarificationAnswersInput>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RephraseClarificationAnswers_returns_bad_request_when_question_prompt_exceeds_chat_intake_max_length()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();

        RunsController controller = CreateController();

        RephraseClarificationAnswersInput input = new()
        {
            Items =
            [
                new ClarificationAnswerRephraseItem
                {
                    QuestionKey = "l0.actor.additional-kinds",
                    QuestionPrompt = OverLimitIntakeText.Value,
                    ExtractedAnswer = "Partner integrations and service accounts also call the API.",
                },
            ],
        };

        IActionResult action = await controller.RephraseClarificationAnswers(input, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task RephraseClarificationAnswers_returns_bad_request_when_extracted_answer_exceeds_chat_intake_max_length()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();

        RunsController controller = CreateController();

        RephraseClarificationAnswersInput input = new()
        {
            Items =
            [
                new ClarificationAnswerRephraseItem
                {
                    QuestionKey = "l0.actor.additional-kinds",
                    QuestionPrompt =
                        "Are there other kinds of users (human or machine) that interact with this system besides those already identified?",
                    ExtractedAnswer = OverLimitIntakeText.Value,
                },
            ],
        };

        IActionResult action = await controller.RephraseClarificationAnswers(input, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task RephraseClarificationAnswers_returns_bad_request_when_question_prompt_contains_invalid_surrogate()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();
        RunsController controller = CreateController();

        RephraseClarificationAnswersInput input = new()
        {
            Items =
            [
                new ClarificationAnswerRephraseItem
                {
                    QuestionKey = "l0.actor.additional-kinds",
                    QuestionPrompt = "Are there other kinds of users \uD800 interacting with this system?",
                    ExtractedAnswer = "Partner integrations and service accounts also call the API.",
                },
            ],
        };

        IActionResult action = await controller.RephraseClarificationAnswers(input, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        intakeFacade.Verify(
            static f => f.RephraseClarificationAnswersAsync(It.IsAny<RephraseClarificationAnswersInput>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RephraseClarificationAnswers_returns_bad_request_when_extracted_answer_contains_invalid_surrogate()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();
        RunsController controller = CreateController();

        RephraseClarificationAnswersInput input = new()
        {
            Items =
            [
                new ClarificationAnswerRephraseItem
                {
                    QuestionKey = "l0.actor.additional-kinds",
                    QuestionPrompt =
                        "Are there other kinds of users (human or machine) that interact with this system besides those already identified?",
                    ExtractedAnswer = "\uD800",
                },
            ],
        };

        IActionResult action = await controller.RephraseClarificationAnswers(input, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        intakeFacade.Verify(
            static f => f.RephraseClarificationAnswersAsync(It.IsAny<RephraseClarificationAnswersInput>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ExplainStructuredBriefSuggestion_returns_bad_request_when_suggestion_text_contains_invalid_surrogate()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();
        RunsController controller = CreateController();

        ExplainStructuredBriefSuggestionInput input = new()
        {
            SourceText = "Tenant migration platform with private networking and EU residency goals.",
            SuggestionKind = StructuredBriefSuggestionKind.Constraint,
            SuggestionText = "\uD800",
        };

        IActionResult action = await controller.ExplainStructuredBriefSuggestion(input, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        intakeFacade.Verify(
            static f => f.ExplainStructuredBriefSuggestionAsync(It.IsAny<ExplainStructuredBriefSuggestionInput>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ExplainStructuredBriefSuggestion_calls_intake_facade_when_source_text_is_exactly_minimum_length()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();
        intakeFacade
            .Setup(s => s.ExplainStructuredBriefSuggestionAsync(It.IsAny<ExplainStructuredBriefSuggestionInput>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ExplainStructuredBriefSuggestionResponse { Explanation = "ok" });

        RunsController controller = CreateController();

        ExplainStructuredBriefSuggestionInput input = new()
        {
            SourceText = new string('a', 20),
            SuggestionKind = StructuredBriefSuggestionKind.Constraint,
            SuggestionText = "EU data residency",
        };

        IActionResult action = await controller.ExplainStructuredBriefSuggestion(input, intakeFacade.Object, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();

        intakeFacade.Verify(
            static f => f.ExplainStructuredBriefSuggestionAsync(
                It.Is<ExplainStructuredBriefSuggestionInput>(i => i.SourceText!.Length == 20),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ExplainStructuredBriefSuggestion_returns_explanation_when_valid()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();
        intakeFacade
            .Setup(s => s.ExplainStructuredBriefSuggestionAsync(It.IsAny<ExplainStructuredBriefSuggestionInput>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ExplainStructuredBriefSuggestionResponse
            {
                Explanation = "Your overview mentioned EU customers.",
            });

        RunsController controller = CreateController();

        ExplainStructuredBriefSuggestionInput input = new()
        {
            SourceText = "Tenant migration platform with private networking and EU residency goals.",
            SuggestionKind = StructuredBriefSuggestionKind.Constraint,
            SuggestionText = "EU data residency",
        };

        IActionResult action = await controller.ExplainStructuredBriefSuggestion(input, intakeFacade.Object, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ExplainStructuredBriefSuggestionResponse response =
            ok.Value.Should().BeOfType<ExplainStructuredBriefSuggestionResponse>().Subject;

        response.Explanation.Should().Contain("EU customers");
    }

    [Fact]
    public async Task RephraseClarificationAnswers_calls_intake_facade_when_extracted_answer_is_three_characters()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();
        intakeFacade
            .Setup(s => s.RephraseClarificationAnswersAsync(It.IsAny<RephraseClarificationAnswersInput>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RephraseClarificationAnswersResponse
            {
                RephrasedAnswers = new Dictionary<string, string> { ["q1"] = "ok" },
            });

        RunsController controller = CreateController();

        RephraseClarificationAnswersInput input = new()
        {
            Items =
            [
                new ClarificationAnswerRephraseItem
                {
                    QuestionKey = "q1",
                    QuestionPrompt = new string('a', 10),
                    ExtractedAnswer = "yes",
                },
            ],
        };

        IActionResult action = await controller.RephraseClarificationAnswers(input, intakeFacade.Object, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();

        intakeFacade.Verify(
            static f => f.RephraseClarificationAnswersAsync(
                It.Is<RephraseClarificationAnswersInput>(i => i.Items[0].ExtractedAnswer!.Length == 3),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RephraseClarificationAnswers_returns_bad_request_when_extracted_answer_is_two_characters()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();

        RunsController controller = CreateController();

        RephraseClarificationAnswersInput input = new()
        {
            Items =
            [
                new ClarificationAnswerRephraseItem
                {
                    QuestionKey = "q1",
                    QuestionPrompt = new string('a', 10),
                    ExtractedAnswer = "no",
                },
            ],
        };

        IActionResult action = await controller.RephraseClarificationAnswers(input, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        intakeFacade.Verify(
            static f => f.RephraseClarificationAnswersAsync(It.IsAny<RephraseClarificationAnswersInput>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RephraseClarificationAnswers_calls_intake_facade_when_question_prompt_is_ten_characters()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();
        intakeFacade
            .Setup(s => s.RephraseClarificationAnswersAsync(It.IsAny<RephraseClarificationAnswersInput>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RephraseClarificationAnswersResponse
            {
                RephrasedAnswers = new Dictionary<string, string> { ["q1"] = "ok" },
            });

        RunsController controller = CreateController();

        RephraseClarificationAnswersInput input = new()
        {
            Items =
            [
                new ClarificationAnswerRephraseItem
                {
                    QuestionKey = "q1",
                    QuestionPrompt = new string('a', 10),
                    ExtractedAnswer = "yes",
                },
            ],
        };

        IActionResult action = await controller.RephraseClarificationAnswers(input, intakeFacade.Object, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();

        intakeFacade.Verify(
            static f => f.RephraseClarificationAnswersAsync(
                It.Is<RephraseClarificationAnswersInput>(i => i.Items[0].QuestionPrompt!.Length == 10),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RephraseClarificationAnswers_returns_bad_request_when_question_prompt_is_nine_characters()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();

        RunsController controller = CreateController();

        RephraseClarificationAnswersInput input = new()
        {
            Items =
            [
                new ClarificationAnswerRephraseItem
                {
                    QuestionKey = "q1",
                    QuestionPrompt = new string('a', 9),
                    ExtractedAnswer = "yes",
                },
            ],
        };

        IActionResult action = await controller.RephraseClarificationAnswers(input, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        intakeFacade.Verify(
            static f => f.RephraseClarificationAnswersAsync(It.IsAny<RephraseClarificationAnswersInput>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RephraseClarificationAnswers_calls_intake_facade_when_question_prompt_is_twenty_characters()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();
        intakeFacade
            .Setup(s => s.RephraseClarificationAnswersAsync(It.IsAny<RephraseClarificationAnswersInput>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RephraseClarificationAnswersResponse
            {
                RephrasedAnswers = new Dictionary<string, string> { ["q1"] = "ok" },
            });

        RunsController controller = CreateController();

        RephraseClarificationAnswersInput input = new()
        {
            Items =
            [
                new ClarificationAnswerRephraseItem
                {
                    QuestionKey = "q1",
                    QuestionPrompt = new string('a', 20),
                    ExtractedAnswer = "yes",
                },
            ],
        };

        IActionResult action = await controller.RephraseClarificationAnswers(input, intakeFacade.Object, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();

        intakeFacade.Verify(
            static f => f.RephraseClarificationAnswersAsync(
                It.Is<RephraseClarificationAnswersInput>(i => i.Items[0].QuestionPrompt!.Length == 20),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RephraseClarificationAnswers_returns_rephrased_answers_when_valid()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();
        intakeFacade
            .Setup(s => s.RephraseClarificationAnswersAsync(It.IsAny<RephraseClarificationAnswersInput>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RephraseClarificationAnswersResponse
            {
                RephrasedAnswers = new Dictionary<string, string>
                {
                    ["l0.actor.additional-kinds"] =
                        "Yes — partner integrations and service accounts also call the API.",
                },
            });

        RunsController controller = CreateController();

        RephraseClarificationAnswersInput input = new()
        {
            Items =
            [
                new ClarificationAnswerRephraseItem
                {
                    QuestionKey = "l0.actor.additional-kinds",
                    QuestionPrompt =
                        "Are there other kinds of users (human or machine) that interact with this system besides those already identified?",
                    ExtractedAnswer = "Partner integrations and service accounts also call the API.",
                },
            ],
        };

        IActionResult action = await controller.RephraseClarificationAnswers(input, intakeFacade.Object, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        RephraseClarificationAnswersResponse response =
            ok.Value.Should().BeOfType<RephraseClarificationAnswersResponse>().Subject;

        response.RephrasedAnswers["l0.actor.additional-kinds"].Should().Contain("service accounts");
    }

    [Fact]
    public async Task ConnectorIntake_returns_bad_request_when_source_property_omitted()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();

        RunsController controller = CreateController();

        ConnectorIntakeRequest input = new();

        IActionResult action = await controller.ConnectorIntake(input, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        intakeFacade.Verify(
            static f => f.ParseConnectorIntakeAsync(It.IsAny<ConnectorIntakeRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ConnectorIntake_returns_bad_request_when_source_is_whitespace_only()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();

        RunsController controller = CreateController();

        ConnectorIntakeRequest input = new() { Source = "   " };

        IActionResult action = await controller.ConnectorIntake(input, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        intakeFacade.Verify(
            static f => f.ParseConnectorIntakeAsync(It.IsAny<ConnectorIntakeRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ConnectorIntake_returns_bad_request_when_description_contains_invalid_surrogate()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();

        RunsController controller = CreateController();

        const string terraformJson = """
                                     {
                                       "format_version": "1.0",
                                       "values": {
                                         "root_module": {
                                           "resources": [
                                             { "type": "azurerm_resource_group", "name": "rg" }
                                           ]
                                         }
                                       }
                                     }
                                     """;

        ConnectorIntakeRequest input = new()
        {
            Source = "terraform-show-json",
            TerraformShowJson = terraformJson,
            Description = "Imported connector description \uD800",
        };

        IActionResult action = await controller.ConnectorIntake(input, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        intakeFacade.Verify(
            static f => f.ParseConnectorIntakeAsync(It.IsAny<ConnectorIntakeRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ConnectorIntake_calls_intake_facade_when_description_is_twenty_characters()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();
        intakeFacade
            .Setup(f => f.ParseConnectorIntakeAsync(It.IsAny<ConnectorIntakeRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRequestIntakeParseResult
            {
                Outcome = ArchitectureRequestIntakeOutcome.Success,
                Request = new ArchitectureRequest { RequestId = "connector-intake-desc" },
            });

        RunsController controller = CreateController();

        ConnectorIntakeRequest input = new()
        {
            Source = "manual-connector",
            Description = new string('a', 20),
        };

        IActionResult action = await controller.ConnectorIntake(input, intakeFacade.Object, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();

        intakeFacade.Verify(
            static f => f.ParseConnectorIntakeAsync(
                It.Is<ConnectorIntakeRequest>(r => r.Description!.Length == 20),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ChatIntake_returns_bad_request_when_raw_text_missing()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();

        RunsController controller = CreateController();

        IActionResult action = await controller.ChatIntake(new ChatIntakeRequest(), intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task ChatIntake_returns_bad_request_when_body_is_null()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();

        RunsController controller = CreateController();

        IActionResult action = await controller.ChatIntake(null, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        intakeFacade.Verify(
            static f => f.ParseChatIntakeAsync(It.IsAny<ChatIntakeRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ChatIntake_returns_bad_request_when_raw_text_is_empty_string()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();

        RunsController controller = CreateController();

        ChatIntakeRequest input = new() { RawText = string.Empty };

        IActionResult action = await controller.ChatIntake(input, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        intakeFacade.Verify(
            static f => f.ParseChatIntakeAsync(It.IsAny<ChatIntakeRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ChatIntake_returns_bad_request_when_raw_text_contains_invalid_surrogate()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();

        RunsController controller = CreateController();

        ChatIntakeRequest input = new()
        {
            RawText = new string('a', 19) + "\uD800",
        };

        IActionResult action = await controller.ChatIntake(input, intakeFacade.Object, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        intakeFacade.Verify(
            static f => f.ParseChatIntakeAsync(It.IsAny<ChatIntakeRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ChatIntake_calls_intake_facade_when_raw_text_is_exactly_minimum_length()
    {
        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();
        intakeFacade
            .Setup(f => f.ParseChatIntakeAsync(It.IsAny<ChatIntakeRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRequestIntakeParseResult
            {
                Outcome = ArchitectureRequestIntakeOutcome.Success,
                Request = new ArchitectureRequest { RequestId = "chat-intake-min" },
            });

        RunsController controller = CreateController();

        ChatIntakeRequest input = new() { RawText = new string('a', 20) };

        IActionResult action = await controller.ChatIntake(input, intakeFacade.Object, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();

        intakeFacade.Verify(
            static f => f.ParseChatIntakeAsync(
                It.Is<ChatIntakeRequest>(r => r.RawText!.Length == 20),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task GetRequest_returns_not_found_when_repository_has_no_row()
    {
        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync("missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRequest?)null);

        RunsController controller = CreateController();

        IActionResult action = await controller.GetRequest("missing", requests.Object, Mock.Of<IManifestHashService>(), CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetRequest_returns_architecture_request_when_found()
    {
        ArchitectureRequest request = new() { RequestId = "REQ-100", SystemName = "Core" };

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync("REQ-100", It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ExistsRunForArchitectureRequestInScopeAsync(
                Scope,
                "REQ-100",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        RunsController controller = CreateController(runRepository: runs.Object);

        IActionResult action = await controller.GetRequest("REQ-100", requests.Object, Mock.Of<IManifestHashService>(), CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(request);
    }

    [Fact]
    public async Task GetRequest_returns_not_found_when_request_exists_but_no_run_in_scope()
    {
        ArchitectureRequest request = new() { RequestId = "REQ-100", SystemName = "Core" };

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync("REQ-100", It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ExistsRunForArchitectureRequestInScopeAsync(
                Scope,
                "REQ-100",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        RunsController controller = CreateController(runRepository: runs.Object);

        IActionResult action = await controller.GetRequest("REQ-100", requests.Object, Mock.Of<IManifestHashService>(), CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task ArchiveRequest_returns_not_found_when_request_exists_but_no_run_in_scope()
    {
        ArchitectureRequest request = new() { RequestId = "REQ-100", SystemName = "Core" };

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync("REQ-100", It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ExistsRunForArchitectureRequestInScopeAsync(
                Scope,
                "REQ-100",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        RunsController controller = CreateController(runRepository: runs.Object);

        IActionResult action = await controller.ArchiveRequest(
            "REQ-100",
            requests.Object,
            Mock.Of<IManifestHashService>(),
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        requests.Verify(
            r => r.ArchiveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CloneRequest_returns_not_found_when_source_missing()
    {
        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync("missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRequest?)null);

        RunsController controller = CreateController();

        IActionResult action = await controller.CloneRequest(
            "missing",
            requests.Object,
            Mock.Of<IManifestHashService>(),
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task SubmitAgentResult_returns_not_found_for_whitespace_run_id_like_PinRun()
    {
        Mock<IArchitectureApplicationService> app = new();
        RunsController controller = CreateController(architectureApplicationService: app.Object);

        IActionResult action = await controller.SubmitAgentResult(
            "   ",
            new SubmitAgentResultRequest { Result = new AgentResult { AgentType = AgentType.Topology } },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        app.Verify(
            s => s.SubmitAgentResultAsync(It.IsAny<string>(), It.IsAny<AgentResult>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ExecuteRunAsync_returns_not_found_for_whitespace_run_id_like_ExecuteRun()
    {
        Mock<IArchitectureRunAsyncOperationAcceptor> acceptor = new();
        RunsController controller = CreateController();

        IActionResult action = await controller.ExecuteRunAsync("   ", acceptor.Object, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        acceptor.Verify(
            s => s.AcceptExecuteAsync(
                It.IsAny<string>(),
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ReplayRunAsync_returns_not_found_for_whitespace_run_id_like_ReplayRun()
    {
        Mock<IArchitectureRunAsyncOperationAcceptor> acceptor = new();
        RunsController controller = CreateController();

        IActionResult action = await controller.ReplayRunAsync(
            "   ",
            new ReplayRunRequest(),
            acceptor.Object,
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        acceptor.Verify(
            s => s.AcceptReplayAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<bool>(),
                It.IsAny<string?>(),
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task SubmitAgentResult_returns_bad_request_when_body_null()
    {
        RunsController controller = CreateController();

        IActionResult action = await controller.SubmitAgentResult(
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            null,
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task SubmitAgentResult_returns_ok_when_application_service_succeeds()
    {
        const string runId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        Mock<IArchitectureApplicationService> app = new();
        app
            .Setup(s => s.SubmitAgentResultAsync(runId, It.IsAny<AgentResult>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SubmitResultResult(true, "result-1", null));

        RunsController controller = CreateController(architectureApplicationService: app.Object);

        SubmitAgentResultRequest body = new()
        {
            Result = new AgentResult { AgentType = AgentType.Topology }
        };

        IActionResult action = await controller.SubmitAgentResult(runId, body, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateRun_create_architecture_calls_command_service_synthesis_path()
    {
        Mock<IRunLifecycleCommandService> commands = new();
        commands
            .Setup(s => s.CreateRunAsync(
                Scope,
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CreateRunCommandResult
            {
                SynthesisResult = new ArchitectureSynthesisGenerateResult
                {
                    RunId = Guid.NewGuid().ToString("N"),
                    PackageOrigin = ArchitecturePackageOrigin.Created
                }
            });

        RunsController controller = CreateController(runLifecycleCommandService: commands.Object);

        ArchitectureRequest request = new()
        {
            RequestId = "req-create-arch",
            Description = new string('x', 20),
            SystemName = "CreatedArch",
            WorkflowIntent = ArchitectureWorkflowIntent.CreateArchitecture
        };

        IActionResult action = await controller.CreateRun(request, CancellationToken.None);

        CreatedAtActionResult created = action.Should().BeOfType<CreatedAtActionResult>().Subject;
        created.StatusCode.Should().Be(StatusCodes.Status201Created);
        commands.Verify(
            s => s.CreateRunAsync(
                Scope,
                It.Is<ArchitectureRequest>(r => r.RequestId == "req-create-arch"),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ExecuteRun_with_pilot_try_real_header_does_not_log_started_audit_when_run_not_found()
    {
        Mock<IRunLifecycleCommandService> commands = new();
        commands
            .Setup(s => s.ExecuteRunAsync("missing-run", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new RunNotFoundException("missing-run"));

        Mock<IAuditService> audit = new();
        RunsController controller = CreateController(
            runLifecycleCommandService: commands.Object,
            auditService: audit.Object);
        controller.ControllerContext.HttpContext.Request.Headers[PilotTryRealModeHeaders.PilotTryRealMode] = "1";

        IActionResult action = await controller.ExecuteRun("missing-run", CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.FirstRealValueRunStarted),
                It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.FirstRealValueRunCompleted),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PinRun_returns_not_found_for_invalid_run_id_like_GetRun()
    {
        RunsController controller = CreateController();

        IActionResult action = await controller.PinRun("not-a-guid", null, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task ExecuteRun_returns_not_found_for_whitespace_run_id_like_PinRun()
    {
        Mock<IRunLifecycleCommandService> commands = new();
        RunsController controller = CreateController(runLifecycleCommandService: commands.Object);

        IActionResult action = await controller.ExecuteRun("   ", CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        commands.Verify(
            s => s.ExecuteRunAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ExecuteRunSelective_returns_not_found_for_whitespace_run_id_like_PinRun()
    {
        Mock<IRunLifecycleCommandService> commands = new();
        RunsController controller = CreateController(runLifecycleCommandService: commands.Object);

        IActionResult action = await controller.ExecuteRunSelective(
            "   ",
            new SelectiveExecuteRunRequest(),
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        commands.Verify(
            s => s.ExecuteRunSelectiveAsync(
                It.IsAny<string>(),
                It.IsAny<SelectiveAgentExecuteRequest>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CommitRun_returns_not_found_for_whitespace_run_id_like_PinRun()
    {
        Mock<IRunLifecycleCommandService> commands = new();
        RunsController controller = CreateController(runLifecycleCommandService: commands.Object);

        IActionResult action = await controller.CommitRun("   ", null, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        commands.Verify(
            s => s.CommitRunAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CommitRunRequest>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ReplayRun_returns_not_found_for_whitespace_run_id_like_PinRun()
    {
        Mock<IRunLifecycleCommandService> commands = new();
        RunsController controller = CreateController(runLifecycleCommandService: commands.Object);

        IActionResult action = await controller.ReplayRun(
            "   ",
            new ReplayRunRequest(),
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        commands.Verify(
            s => s.ReplayRunAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<bool>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ReplayRun_unknown_execution_mode_returns_400_like_async_replay()
    {
        const string runId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        Mock<IRunLifecycleCommandService> commands = new();
        commands
            .Setup(s => s.ReplayRunAsync(
                runId,
                "DestroyEverything",
                It.IsAny<bool>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("Unknown execution mode 'DestroyEverything'."));

        RunsController controller = CreateController(runLifecycleCommandService: commands.Object);

        IActionResult action = await controller.ReplayRun(
            runId,
            new ReplayRunRequest { ExecutionMode = "DestroyEverything" },
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            bad.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.ValidationFailed);
    }

    [Fact]
    public async Task GetDraftRequestAsyncResult_failed_operation_returns_422_not_400_validation()
    {
        InMemoryAdvisoryDraftOperationStore store = new();
        AdvisoryDraftOperationRecord record = (await store.CreatePendingAsync(Scope)).Record;
        string opaqueOperationId = OperationIdCodec.ForDraft(record.OperationId);
        await store.MarkFailedAsync(Scope, opaqueOperationId, "LLM timeout");

        Mock<IArchitectureRequestIntakeFacade> intakeFacade = new();
        intakeFacade
            .Setup(f => f.GetDraftAsyncResultAsync(record.OperationId, Scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AdvisoryDraftOperationQueryResult
            {
                Outcome = AdvisoryDraftOperationOutcome.Failed,
                ErrorMessage = "LLM timeout",
            });

        RunsController controller = CreateController();

        IActionResult action = await controller.GetDraftRequestAsyncResult(
            record.OperationId,
            intakeFacade.Object,
            CancellationToken.None);

        ObjectResult problem = action.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status422UnprocessableEntity);

        MvcProblemDetails details = problem.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        details.Type.Should().Be(ProblemTypes.BusinessRuleViolation);
        details.Detail.Should().Be("LLM timeout");
    }

    [Fact]
    public async Task PostFindingFeedback_returns_bad_request_when_comment_contains_invalid_surrogate()
    {
        RunsController controller = CreateController();

        IActionResult action = await controller.PostFindingFeedbackAsync(
            "finding-1",
            new ArchitectureFindingFeedbackPostRequest
            {
                RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                IsHelpful = true,
                Comment = "\uD800",
            },
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task PutAssumptionAcknowledgement_returns_bad_request_when_assumption_id_contains_invalid_surrogate()
    {
        Mock<IRunAssumptionAcknowledgementService> acknowledgementService = new();
        RunsController controller = CreateController();

        IActionResult action = await controller.PutAssumptionAcknowledgement(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            new PutRunAssumptionAcknowledgementRequest { AcknowledgedAssumptionIds = ["\uD800"] },
            acknowledgementService.Object,
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        acknowledgementService.Verify(
            static s => s.PutAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static RunsController CreateController(
        IArchitectureApplicationService? architectureApplicationService = null,
        IRunLifecycleCommandService? runLifecycleCommandService = null,
        IRunRepository? runRepository = null,
        IAuditService? auditService = null,
        IValidator<ArchitectureRequest>? architectureRequestValidator = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("operator@test");

        IValidator<ArchitectureRequest> validator = architectureRequestValidator ?? CreatePermissiveArchitectureRequestValidator();

        return new RunsController(
            runLifecycleCommandService ?? Mock.Of<IRunLifecycleCommandService>(),
            architectureApplicationService ?? Mock.Of<IArchitectureApplicationService>(),
            validator,
            scopeProvider.Object,
            actor.Object,
            auditService ?? Mock.Of<IAuditService>(),
            SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun(),
            Mock.Of<IFindingFeedbackRepository>(),
            new FindingInstrumentationAuditSupport(
                auditService ?? Mock.Of<IAuditService>(),
                NullLogger<FindingInstrumentationAuditSupport>.Instance),
            runRepository ?? Mock.Of<IRunRepository>(),
            SealedManifestHashTestSupport.CreateRunDetailQueryServiceWithoutCommittedRuns(),
            SealedManifestHashTestSupport.CreateManifestHashService(),
            NullLogger<RunsController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
    }

    private static IValidator<ArchitectureRequest> CreatePermissiveArchitectureRequestValidator()
    {
        Mock<IValidator<ArchitectureRequest>> validator = new();
        validator
            .Setup(v => v.ValidateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult());

        return validator.Object;
    }
}
