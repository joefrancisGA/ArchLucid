using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Scope binding for <c>POST /v1/policy-packs/{id}/simulate-bulk</c> (tenant/workspace/project vs pack row).
/// </summary>
[Trait("Category", "Unit")]
public sealed class PolicyPacksControllerSimulateBulkScopeTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task SimulateBulk_returns_bad_request_when_run_ids_is_null()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);

        PolicyPacksController sut = CreateController(httpFacade);

        PolicyPackSimulateBulkRequest request = new() { RunIds = null! };

        IActionResult result = await sut.SimulateBulk(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            request,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        httpFacade.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SimulateBulk_returns_bad_request_when_all_run_ids_are_whitespace()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);

        PolicyPacksController sut = CreateController(httpFacade);

        PolicyPackSimulateBulkRequest request = new() { RunIds = ["", "  "] };

        IActionResult result = await sut.SimulateBulk(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            request,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        httpFacade.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SimulateBulk_returns_bad_request_when_run_id_is_not_a_guid()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);

        PolicyPacksController sut = CreateController(httpFacade);

        PolicyPackSimulateBulkRequest request = new()
        {
            RunIds =
            [
                Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").ToString("D"),
                "not-a-guid",
            ],
        };

        IActionResult result = await sut.SimulateBulk(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            request,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        httpFacade.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SimulateBulk_returns_bad_request_when_run_id_is_empty_guid()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);

        PolicyPacksController sut = CreateController(httpFacade);

        PolicyPackSimulateBulkRequest request = new() { RunIds = [Guid.Empty.ToString("D")] };

        IActionResult result = await sut.SimulateBulk(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            request,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        httpFacade.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SimulateBulk_returns_bad_request_when_run_id_exceeds_max_length()
    {
        string overlongRunId = new string('r', GovernanceRequestValidationRules.RunIdMaxLength + 1);
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);

        PolicyPacksController sut = CreateController(httpFacade);

        PolicyPackSimulateBulkRequest request = new() { RunIds = [overlongRunId] };

        IActionResult result = await sut.SimulateBulk(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            request,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        httpFacade.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SimulateBulk_returns_bad_request_for_count_cap_when_fifty_one_ids_include_malformed_trailer()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);

        PolicyPacksController sut = CreateController(httpFacade);

        List<string> runIds = Enumerable
            .Range(0, 50)
            .Select(static i => Guid.Parse($"aaaaaaaa-aaaa-aaaa-aaaa-{i:x12}").ToString("D"))
            .Append("not-a-guid")
            .ToList();

        PolicyPackSimulateBulkRequest request = new() { RunIds = runIds };

        IActionResult result = await sut.SimulateBulk(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            request,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        badRequest.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>()
            .Which.Detail.Should().Contain("At most 50 run ids");
        httpFacade.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SimulateBulk_returns_bad_request_when_more_than_fifty_run_ids()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);

        PolicyPacksController sut = CreateController(httpFacade);

        List<string> runIds = Enumerable
            .Range(0, 51)
            .Select(static i => Guid.Parse($"bbbbbbbb-bbbb-bbbb-bbbb-{i:x12}").ToString("D"))
            .ToList();

        PolicyPackSimulateBulkRequest request = new() { RunIds = runIds };

        IActionResult result = await sut.SimulateBulk(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            request,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        badRequest.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>()
            .Which.Detail.Should().Contain("At most 50 run ids");
        httpFacade.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SimulateBulk_returns_bad_request_when_block_commit_minimum_severity_out_of_range_and_tenant_missing()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);

        PolicyPacksController sut = CreateController(httpFacade, tenantExists: false);

        string runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D");
        PolicyPackSimulateBulkRequest request = new()
        {
            RunIds = [runId],
            BlockCommitMinimumSeverity = 99,
        };

        IActionResult result = await sut.SimulateBulk(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            request,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        httpFacade.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SimulateBulk_returns_not_found_when_pack_belongs_to_another_tenant()
    {
        Guid foreignPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        httpFacade
            .Setup(f => f.SimulateBulkAsync(
                foreignPackId,
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<bool?>(),
                It.IsAny<int?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackHttpResult<PolicyPackSimulateBulkSummary>
            {
                Outcome = PolicyPackHttpOutcome.ResourceNotFound,
            });

        PolicyPacksController sut = CreateController(httpFacade);

        string runId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").ToString("D");
        PolicyPackSimulateBulkRequest request = new() { RunIds = [runId] };

        IActionResult result = await sut.SimulateBulk(foreignPackId, request, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task SimulateBulk_evaluates_runs_when_pack_is_in_caller_scope()
    {
        Guid packId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string runId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").ToString("D");

        PolicyPackSimulateBulkSummary summary = new()
        {
            PolicyPackId = packId,
            PolicyPackVersion = "1.0.0",
            RequestedRunCount = 1,
            EvaluatedRunCount = 1,
            Results =
            [
                new PolicyPackSimulateBulkRunOutcome
                {
                    RunId = runId,
                    Found = true,
                    WouldBlockCommit = false,
                    Detail = new PolicyPackGovernanceDryRunResult
                    {
                        ResolvedRunId = runId,
                        GateResult = PreCommitGateResult.Allowed(),
                    },
                },
            ],
        };

        Mock<IPolicyPackHttpFacade> httpFacade = new();
        httpFacade
            .Setup(f => f.SimulateBulkAsync(
                packId,
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<bool?>(),
                It.IsAny<int?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackHttpResult<PolicyPackSimulateBulkSummary>.Success(summary));

        PolicyPacksController sut = CreateController(httpFacade);

        PolicyPackSimulateBulkRequest request = new() { RunIds = [runId] };

        IActionResult result = await sut.SimulateBulk(packId, request, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeOfType<PolicyPackSimulateBulkSummaryResponse>();
    }

    private static PolicyPacksController CreateController(
        Mock<IPolicyPackHttpFacade> httpFacade,
        bool tenantExists = true)
    {
        if (!tenantExists)
            PolicyPacksControllerTestSupport.SetupScopeNotFoundDefaults(httpFacade);

        return PolicyPacksControllerTestSupport.CreateController(httpFacade);
    }
}
