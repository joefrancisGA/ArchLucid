using ArchLucid.Api.Controllers.Architecture;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

using FluentAssertions;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>AS-088: grandfathered architectures (RestrictToShares = 0) stay visible to workspace readers.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitecturesControllerGrandfatherShareTests
{
    private const string ActorOid = "operator@test";

    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid GrandfatheredArchitectureId =
        Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    private readonly Mock<IScopeContextProvider> _scopeProvider = new();
    private readonly Mock<IActorContext> _actorContext = new();
    private readonly Mock<IAuditService> _auditService = new();
    private readonly Mock<IArchitectureIdentityService> _service = new();
    private readonly Mock<IArchitectureInventoryBindingService> _bindingService = new();
    private readonly Mock<IArchitectureSealDeltaService> _sealDeltaService = new();
    private readonly Mock<IRunRepository> _runRepository = new();
    private readonly Mock<IGoldenManifestRepository> _goldenManifestRepository = new();

    public ArchitecturesControllerGrandfatherShareTests()
    {
        _scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(Scope);
        _actorContext.Setup(static s => s.GetActorId()).Returns(ActorOid);
    }

    [Fact]
    public void ListArchitectures_RequiresReadAuthority_ForWorkspaceReaders()
    {
        AuthorizeAttribute? attribute = typeof(ArchitecturesController)
            .GetMethod(nameof(ArchitecturesController.ListArchitectures))
            ?.GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
            .Cast<AuthorizeAttribute>()
            .FirstOrDefault();

        attribute.Should().NotBeNull();
        attribute!.Policy.Should().Be(ArchLucidPolicies.ReadAuthority);
    }

    [Fact]
    public async Task ListArchitectures_IncludesGrandfatheredWorkspaceVisibleArchitecture()
    {
        ArchitectureIdentityListPage page = new()
        {
            Items =
            [
                new ArchitectureIdentityListItem
                {
                    ArchitectureId = GrandfatheredArchitectureId,
                    DisplayName = "Legacy package",
                },
            ],
            TotalCount = 1,
            Page = 1,
            PageSize = 50,
        };

        _service
            .Setup(s => s.ListIdentitiesAsync(
                Scope,
                1,
                50,
                false,
                ActorOid,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(page);

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.ListArchitectures(cancellationToken: CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ArchitectureIdentityListPage response = ok.Value.Should().BeOfType<ArchitectureIdentityListPage>().Subject;
        response.Items.Should().ContainSingle(item => item.ArchitectureId == GrandfatheredArchitectureId);
    }

    [Fact]
    public async Task GetArchitecture_Returns200_ForGrandfatheredWorkspaceVisibleArchitecture()
    {
        ArchitectureIdentityDetail detail = new()
        {
            ArchitectureId = GrandfatheredArchitectureId,
            DisplayName = "Legacy package",
        };

        _service
            .Setup(s => s.GetIdentityAsync(
                Scope,
                GrandfatheredArchitectureId,
                ActorOid,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.GetArchitecture(GrandfatheredArchitectureId, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ArchitectureIdentityDetail response = ok.Value.Should().BeOfType<ArchitectureIdentityDetail>().Subject;
        response.ArchitectureId.Should().Be(GrandfatheredArchitectureId);
    }

    private ArchitecturesController BuildSut() =>
        ArchitecturesControllerTestSupport.BuildController(
            _scopeProvider,
            _actorContext,
            _service,
            _bindingService,
            _sealDeltaService,
            _auditService,
            _runRepository,
            _goldenManifestRepository);
}
