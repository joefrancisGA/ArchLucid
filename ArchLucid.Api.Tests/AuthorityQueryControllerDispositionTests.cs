using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Support;
using ArchLucid.Application;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Common;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Provenance;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Audit;
using ArchLucid.Provenance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityQueryControllerDispositionTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid RunGuid = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    private readonly Mock<IAuthorityQueryService> _queryService = new();
    private readonly Mock<IRunOperatorGovernanceDispositionService> _dispositionService = new();
    private readonly Mock<IScopeContextProvider> _scopeProvider = new();

    public AuthorityQueryControllerDispositionTests()
    {
        _scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(Scope);
        _queryService
            .Setup(s => s.GetRunDetailAsync(Scope, RunGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto());
    }

    private AuthorityQueryController BuildSut()
    {
        AuthorityRunReadHandlers readHandlers = new(
            _queryService.Object,
            Mock.Of<IAuthorityRunDetailOperatorEnricher>(),
            Mock.Of<IRunRationaleService>(),
            Mock.Of<IRunPipelineAuditTimelineService>(),
            _scopeProvider.Object,
            Mock.Of<IProvenanceGraphAccessService>(),
            Mock.Of<IAuditService>(),
            Mock.Of<IActorContext>(),
            Mock.Of<IEffectiveAgentExecutionModeAccessor>(),
            Mock.Of<IManifestHashService>(),
            Mock.Of<ILogger<AuthorityRunReadHandlers>>());

        return new(
            _queryService.Object,
            readHandlers,
            Mock.Of<IAuthorityRunDetailOperatorEnricher>(),
            Mock.Of<IRunRetrievalGroundingService>(),
            _scopeProvider.Object,
            Mock.Of<IActorContext>(),
            _dispositionService.Object,
            Mock.Of<IManifestHashService>(),
            Mock.Of<IRunDetailQueryService>(),
            Mock.Of<IConfiguration>(),
            Mock.Of<IEffectiveAgentExecutionModeAccessor>(),
            Mock.Of<IArchitectureShareAccessGate>(),
            Mock.Of<ILogger<AuthorityQueryController>>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }

    [Fact]
    public async Task RecordRunOperatorGovernanceDisposition_returns_bad_request_when_rationale_exceeds_max_length()
    {
        string overLimit = new('r', 2001);
        AuthorityQueryController sut = BuildSut();

        IActionResult result = await sut.RecordRunOperatorGovernanceDisposition(
            RunGuid,
            new RecordRunOperatorGovernanceDispositionRequest
            {
                Decision = RunOperatorGovernanceDecision.Rejected,
                Rationale = overLimit,
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        _dispositionService.Verify(
            static s => s.RecordAsync(
                It.IsAny<Guid>(),
                It.IsAny<RecordRunOperatorGovernanceDispositionRequest>(),
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
