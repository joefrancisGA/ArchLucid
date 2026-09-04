using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class GovernanceControllerSimulateTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Lazy<string> OverLimitPolicyPackAdvisoryText = new(
        () => new string('x', DraftIntakeValidation.MaximumFreeTextIntentLength + 1));

    [Fact]
    public async Task Simulate_returns_bad_request_when_run_id_missing()
    {
        GovernanceController sut = CreateController();

        IActionResult action = await sut.Simulate(
            new PolicyPackSimulateRequest
            {
                RunId = null!,
                Content = new(),
            },
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task Simulate_returns_bad_request_when_run_id_is_empty_guid()
    {
        Mock<IPolicyPackGovernanceDryRunService> dryRun = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(governanceDryRunService: dryRun.Object);

        IActionResult action = await sut.Simulate(
            new PolicyPackSimulateRequest
            {
                RunId = Guid.Empty.ToString("D"),
                Content = new(),
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        dryRun.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Simulate_returns_bad_request_when_run_id_exceeds_max_length()
    {
        string overlongRunId = new string('r', GovernanceRequestValidationRules.RunIdMaxLength + 1);
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(policyPackHttpFacade: httpFacade.Object);

        IActionResult action = await sut.Simulate(
            new PolicyPackSimulateRequest
            {
                RunId = overlongRunId,
                Content = new(),
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        httpFacade.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Simulate_returns_not_found_when_tenant_missing()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        httpFacade
            .Setup(f => f.SimulateAsync(
                It.IsAny<PolicyPackContentDocument>(),
                It.IsAny<string>(),
                It.IsAny<bool?>(),
                It.IsAny<int?>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackHttpResult<PolicyPackGovernanceDryRunResult>.ScopeNotFound());

        GovernanceController sut = CreateController(
            policyPackHttpFacade: httpFacade.Object,
            tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.Simulate(
            new PolicyPackSimulateRequest
            {
                RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D"),
                Content = new(),
            },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        httpFacade.VerifyAll();
    }

    [Fact]
    public async Task Simulate_returns_bad_request_when_block_commit_minimum_severity_out_of_range_and_tenant_missing()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            policyPackHttpFacade: httpFacade.Object,
            tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.Simulate(
            new PolicyPackSimulateRequest
            {
                RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D"),
                Content = new(),
                BlockCommitMinimumSeverity = 99,
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        httpFacade.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DryRunProposedPolicyPack_returns_bad_request_when_target_run_id_is_not_a_guid()
    {
        Mock<IPolicyPackGovernanceDryRunService> dryRun = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(governanceDryRunService: dryRun.Object);

        IActionResult action = await sut.DryRunProposedPolicyPack(
            new PolicyPackGovernanceDryRunRequest
            {
                PolicyPackContentJson = "{}",
                TargetRunId = "not-a-guid",
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        dryRun.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DryRunProposedPolicyPack_returns_bad_request_when_target_run_id_is_empty_guid()
    {
        Mock<IPolicyPackGovernanceDryRunService> dryRun = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(governanceDryRunService: dryRun.Object);

        IActionResult action = await sut.DryRunProposedPolicyPack(
            new PolicyPackGovernanceDryRunRequest
            {
                PolicyPackContentJson = "{}",
                TargetRunId = Guid.Empty.ToString("D"),
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        dryRun.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DryRunProposedPolicyPack_returns_bad_request_when_target_run_id_exceeds_max_length()
    {
        string overlongRunId = new string('r', GovernanceRequestValidationRules.RunIdMaxLength + 1);
        Mock<IPolicyPackGovernanceDryRunService> dryRun = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(governanceDryRunService: dryRun.Object);

        IActionResult action = await sut.DryRunProposedPolicyPack(
            new PolicyPackGovernanceDryRunRequest
            {
                PolicyPackContentJson = "{}",
                TargetRunId = overlongRunId,
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        dryRun.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DryRunProposedPolicyPack_returns_bad_request_when_target_manifest_id_is_empty_guid()
    {
        Mock<IPolicyPackGovernanceDryRunService> dryRun = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(governanceDryRunService: dryRun.Object);

        IActionResult action = await sut.DryRunProposedPolicyPack(
            new PolicyPackGovernanceDryRunRequest
            {
                PolicyPackContentJson = "{}",
                TargetManifestId = Guid.Empty,
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        dryRun.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DryRunProposedPolicyPack_returns_bad_request_when_block_commit_minimum_severity_out_of_range_and_tenant_missing()
    {
        Mock<IPolicyPackGovernanceDryRunService> dryRun = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            governanceDryRunService: dryRun.Object,
            tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.DryRunProposedPolicyPack(
            new PolicyPackGovernanceDryRunRequest
            {
                PolicyPackContentJson = "{}",
                TargetRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D"),
                BlockCommitMinimumSeverity = 99,
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        dryRun.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DryRunProposedPolicyPack_returns_not_found_when_tenant_missing()
    {
        Mock<IPolicyPackGovernanceDryRunService> dryRun = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            governanceDryRunService: dryRun.Object,
            tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.DryRunProposedPolicyPack(
            new PolicyPackGovernanceDryRunRequest
            {
                PolicyPackContentJson = "{}",
                TargetRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D"),
            },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        dryRun.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DryRunPolicyPack_returns_bad_request_when_policy_pack_id_is_empty()
    {
        Mock<IPolicyPackDryRunService> dryRun = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(dryRunService: dryRun.Object);

        IActionResult action = await sut.DryRunPolicyPack(
            Guid.Empty,
            new PolicyPackDryRunRequest
            {
                EvaluateAgainstRunIds = [Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D")],
            },
            pageSize: null,
            page: null,
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        dryRun.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DryRunPolicyPack_returns_bad_request_when_proposed_thresholds_is_null()
    {
        Mock<IPolicyPackDryRunService> dryRun = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(dryRunService: dryRun.Object);

        PolicyPackDryRunRequest request = new()
        {
            ProposedThresholds = null!,
            EvaluateAgainstRunIds = [Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D")],
        };

        IActionResult action = await sut.DryRunPolicyPack(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            request,
            pageSize: null,
            page: null,
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        dryRun.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DryRunPolicyPack_returns_bad_request_when_evaluate_against_run_ids_is_null()
    {
        Mock<IPolicyPackDryRunService> dryRun = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(dryRunService: dryRun.Object);

        IActionResult action = await sut.DryRunPolicyPack(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            new PolicyPackDryRunRequest { EvaluateAgainstRunIds = null! },
            pageSize: null,
            page: null,
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        dryRun.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DryRunPolicyPack_returns_bad_request_when_all_evaluate_against_run_ids_are_whitespace()
    {
        Mock<IPolicyPackDryRunService> dryRun = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(dryRunService: dryRun.Object);

        IActionResult action = await sut.DryRunPolicyPack(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            new PolicyPackDryRunRequest { EvaluateAgainstRunIds = ["", "  "] },
            pageSize: null,
            page: null,
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        dryRun.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DryRunPolicyPack_returns_bad_request_when_more_than_fifty_evaluate_against_run_ids()
    {
        Mock<IPolicyPackDryRunService> dryRun = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(dryRunService: dryRun.Object);

        List<string> runIds = Enumerable.Range(0, 51).Select(static i => $"run-{i}").ToList();

        IActionResult action = await sut.DryRunPolicyPack(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            new PolicyPackDryRunRequest { EvaluateAgainstRunIds = runIds },
            pageSize: null,
            page: null,
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        dryRun.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DryRunPolicyPack_returns_bad_request_when_evaluate_against_run_id_is_not_a_guid()
    {
        Mock<IPolicyPackDryRunService> dryRun = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(dryRunService: dryRun.Object);

        IActionResult action = await sut.DryRunPolicyPack(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            new PolicyPackDryRunRequest
            {
                EvaluateAgainstRunIds =
                [
                    Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D"),
                    "not-a-guid",
                ],
            },
            pageSize: null,
            page: null,
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        dryRun.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DryRunPolicyPack_returns_bad_request_when_evaluate_against_run_id_is_empty_guid()
    {
        Mock<IPolicyPackDryRunService> dryRun = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(dryRunService: dryRun.Object);

        IActionResult action = await sut.DryRunPolicyPack(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            new PolicyPackDryRunRequest
            {
                EvaluateAgainstRunIds = [Guid.Empty.ToString("D")],
            },
            pageSize: null,
            page: null,
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        dryRun.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DryRunPolicyPack_returns_bad_request_when_evaluate_against_run_id_exceeds_max_length()
    {
        string overlongRunId = new string('r', GovernanceRequestValidationRules.RunIdMaxLength + 1);
        Mock<IPolicyPackDryRunService> dryRun = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(dryRunService: dryRun.Object);

        IActionResult action = await sut.DryRunPolicyPack(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            new PolicyPackDryRunRequest
            {
                EvaluateAgainstRunIds = [overlongRunId],
            },
            pageSize: null,
            page: null,
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        dryRun.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DryRunPolicyPack_delegates_page_size_to_service_for_documented_server_side_clamp()
    {
        Guid policyPackId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        string runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D");

        Mock<IPolicyPackDryRunService> dryRun = new();
        dryRun
            .Setup(s => s.EvaluateAsync(
                policyPackId,
                It.IsAny<IReadOnlyDictionary<string, string>>(),
                It.IsAny<IReadOnlyList<string>>(),
                500,
                1,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackDryRunResponse
            {
                PolicyPackId = policyPackId,
                PageSize = IPolicyPackDryRunService.MaxPageSize,
                Page = 1,
            });

        GovernanceController sut = CreateController(dryRunService: dryRun.Object);

        IActionResult action = await sut.DryRunPolicyPack(
            policyPackId,
            new PolicyPackDryRunRequest { EvaluateAgainstRunIds = [runId] },
            pageSize: 500,
            page: 1,
            CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
        dryRun.VerifyAll();
    }

    [Fact]
    public async Task DryRunPolicyPack_returns_not_found_when_tenant_missing()
    {
        Mock<IPolicyPackDryRunService> dryRun = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            dryRunService: dryRun.Object,
            tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.DryRunPolicyPack(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            new PolicyPackDryRunRequest
            {
                EvaluateAgainstRunIds = [Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D")],
            },
            pageSize: null,
            page: null,
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        dryRun.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DraftPolicyPackRule_returns_not_found_when_tenant_missing()
    {
        Mock<IPolicyPackDraftService> draft = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            draftService: draft.Object,
            tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.DraftPolicyPackRule(
            new DraftPolicyPackInput { FreeTextIntent = "Require encryption on all storage accounts." },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        draft.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GeneratePolicyPack_returns_not_found_when_tenant_missing()
    {
        Mock<IPolicyPackGeneratorService> generator = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            generatorService: generator.Object,
            tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.GeneratePolicyPack(
            new GeneratePolicyPackRequest { Prompt = "Draft a baseline security policy pack for retail workloads." },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        generator.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DraftPolicyPackRule_returns_bad_request_when_free_text_intent_exceeds_max_length()
    {
        Mock<IPolicyPackDraftService> draft = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(draftService: draft.Object);

        IActionResult action = await sut.DraftPolicyPackRule(
            new DraftPolicyPackInput { FreeTextIntent = OverLimitPolicyPackAdvisoryText.Value },
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        draft.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GeneratePolicyPack_returns_bad_request_when_prompt_exceeds_max_length()
    {
        Mock<IPolicyPackGeneratorService> generator = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(generatorService: generator.Object);

        IActionResult action = await sut.GeneratePolicyPack(
            new GeneratePolicyPackRequest { Prompt = OverLimitPolicyPackAdvisoryText.Value },
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        generator.VerifyNoOtherCalls();
    }

    private static ITenantRepository TenantMissingRepository() =>
        Mock.Of<ITenantRepository>(repository => repository.GetByIdAsync(
            Scope.TenantId,
            It.IsAny<CancellationToken>()) == Task.FromResult<TenantRecord?>(null));

    private static GovernanceController CreateController(
        IPolicyPackGovernanceDryRunService? governanceDryRunService = null,
        IPolicyPackHttpFacade? policyPackHttpFacade = null,
        IPolicyPackDryRunService? dryRunService = null,
        IPolicyPackDraftService? draftService = null,
        IPolicyPackGeneratorService? generatorService = null,
        ITenantRepository? tenantRepository = null)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);

        GovernanceController controller = GovernanceControllerTestFactory.Create(
            scopeContextProvider: scope.Object,
            policyPackDryRunService: dryRunService ?? Mock.Of<IPolicyPackDryRunService>(),
            policyPackGovernanceDryRunService: governanceDryRunService ?? Mock.Of<IPolicyPackGovernanceDryRunService>(),
            policyPackHttpFacade: policyPackHttpFacade ?? Mock.Of<IPolicyPackHttpFacade>(),
            policyPackDraftService: draftService ?? Mock.Of<IPolicyPackDraftService>(),
            policyPackGeneratorService: generatorService ?? Mock.Of<IPolicyPackGeneratorService>(),
            tenantRepository: tenantRepository ?? Mock.Of<ITenantRepository>(repository => repository.GetByIdAsync(
                Scope.TenantId,
                It.IsAny<CancellationToken>()) == Task.FromResult<TenantRecord?>(new TenantRecord { Id = Scope.TenantId, Name = "contoso" })));

        return controller;
    }
}
