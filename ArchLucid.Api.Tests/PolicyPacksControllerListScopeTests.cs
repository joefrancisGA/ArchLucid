using System.Text.Json;

using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Api.Serialization;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tenant preflight for policy pack reads and mutations (ghost tenant must not return HTTP 200).
/// </summary>
[Trait("Category", "Unit")]
public sealed class PolicyPacksControllerListScopeTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task List_returns_not_found_when_workspace_missing()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        httpFacade
            .Setup(f => f.ListVisiblePacksAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackHttpResult<IReadOnlyList<PolicyPack>>.ScopeNotFound());

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

        IActionResult result = await sut.List(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        httpFacade.VerifyAll();
    }

    [Fact]
    public async Task List_returns_not_found_when_tenant_missing()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        PolicyPacksControllerTestSupport.SetupScopeNotFoundDefaults(httpFacade);

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

        IActionResult result = await sut.List(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task List_returns_packs_when_tenant_exists()
    {
        PolicyPack pack = new()
        {
            PolicyPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            Name = "baseline",
        };

        Mock<IPolicyPackHttpFacade> httpFacade = new();
        httpFacade
            .Setup(f => f.ListVisiblePacksAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackHttpResult<IReadOnlyList<PolicyPack>>.Success(new List<PolicyPack> { pack }));

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

        IActionResult result = await sut.List(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeAssignableTo<IReadOnlyList<PolicyPack>>();
    }

    [Fact]
    public async Task GetPageBundle_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.GetPageBundle(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetEffective_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.GetEffective(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task ListCatalog_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.ListCatalog(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetCatalogEntry_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.GetCatalogEntry(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetCatalogEntry_returns_bad_request_when_route_id_empty()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        PolicyPacksController sut = CreateSut(httpFacade, tenantExists: true);

        IActionResult result = await sut.GetCatalogEntry(Guid.Empty, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        httpFacade.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ListWorkspaceSelection_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.ListWorkspaceSelection(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task ExplainPack_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.ExplainPack(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public void CreatePolicyPackRequest_deserialization_rejects_missing_initial_content_json()
    {
        Action act = () => JsonSerializer.Deserialize<CreatePolicyPackRequest>(
            """{"name":"baseline","packType":"TenantCustom"}""",
            ArchLucidApiJsonSerializerOptions.Web);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void AssignPolicyPackRequest_deserialization_rejects_missing_is_pinned()
    {
        Action act = () => JsonSerializer.Deserialize<AssignPolicyPackRequest>(
            """{"version":"1.0.0"}""",
            ArchLucidApiJsonSerializerOptions.Web);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public async Task Create_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.Create(
            new CreatePolicyPackRequest
            {
                Name = "baseline",
                Description = "desc",
                PackType = "TenantCustom",
                InitialContentJson = "{}",
            },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Simulate_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.Simulate(
            new PolicyPackSimulateRequest
            {
                RunId = "dddddddd-dddd-dddd-dddd-dddddddddddd",
                Content = new PolicyPackContentDocument(),
            },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task SimulateBulk_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: false);

        Guid packId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        IActionResult result = await sut.SimulateBulk(
            packId,
            new PolicyPackSimulateBulkRequest { RunIds = ["dddddddd-dddd-dddd-dddd-dddddddddddd"] },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Validate_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: false);

        JsonElement body = JsonDocument.Parse("""{"name":"baseline"}""").RootElement;

        IActionResult result = await sut.Validate(body, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Validate_returns_bad_request_when_content_is_not_deserializable_and_tenant_missing()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        PolicyPacksControllerTestSupport.SetupScopeNotFoundDefaults(httpFacade);

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

        JsonElement body = JsonDocument.Parse("""{"complianceRuleIds":"not-an-array"}""").RootElement;

        IActionResult result = await sut.Validate(body, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        httpFacade.Verify(
            f => f.ValidateContentAsync(It.IsAny<JsonElement>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Publish_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.Publish(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            new PublishPolicyPackVersionRequest
            {
                Version = "2.0.0",
                ContentJson = """{"complianceRuleIds":[]}""",
            },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Assign_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.Assign(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            new AssignPolicyPackRequest
            {
                Version = "1.0.0",
                ScopeLevel = "Project",
                IsPinned = false,
            },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task ArchiveAssignment_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.ArchiveAssignment(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task DeletePack_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.DeletePack(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task DuplicatePack_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.DuplicatePack(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public void SetAssignmentEnabledRequest_deserialization_rejects_missing_is_enabled()
    {
        Action act = () => JsonSerializer.Deserialize<SetPolicyPackAssignmentEnabledRequest>(
            "{}",
            ArchLucidApiJsonSerializerOptions.Web);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void PublishPolicyPackVersionRequest_deserialization_rejects_missing_content_json()
    {
        Action act = () => JsonSerializer.Deserialize<PublishPolicyPackVersionRequest>(
            """{"version":"1.0.0"}""",
            ArchLucidApiJsonSerializerOptions.Web);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public async Task SetAssignmentEnabled_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.SetAssignmentEnabled(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            new SetPolicyPackAssignmentEnabledRequest { IsEnabled = false },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task PromoteCatalogEntry_returns_bad_request_when_source_policy_pack_id_is_empty()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: true);

        IActionResult result = await sut.PromoteCatalogEntry(
            new PromotePolicyPackCatalogEntryRequest
            {
                SourcePolicyPackId = Guid.Empty,
                Version = "1.0.0",
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task PromoteCatalogEntry_returns_bad_request_when_version_is_whitespace_only()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: true);

        IActionResult result = await sut.PromoteCatalogEntry(
            new PromotePolicyPackCatalogEntryRequest
            {
                SourcePolicyPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                Version = "   ",
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task PromoteCatalogEntry_returns_bad_request_when_version_exceeds_max_length()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: true);

        IActionResult result = await sut.PromoteCatalogEntry(
            new PromotePolicyPackCatalogEntryRequest
            {
                SourcePolicyPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                Version = new string('1', PolicyPackRequestValidationRules.PackVersionMaxLength + 1),
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task PromoteCatalogEntry_returns_bad_request_when_version_is_not_semver()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: true);

        IActionResult result = await sut.PromoteCatalogEntry(
            new PromotePolicyPackCatalogEntryRequest
            {
                SourcePolicyPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                Version = "latest",
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task PromoteCatalogEntry_returns_bad_request_when_snapshot_exceeds_catalog_limits()
    {
        Guid sourcePackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        httpFacade
            .Setup(f => f.PromoteCatalogEntryAsync(
                It.Is<PolicyPackPromoteCatalogBody>(body => body.SourcePolicyPackId == sourcePackId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPackHttpResult<PolicyPackCatalogEntryDetail>
                {
                    Outcome = PolicyPackHttpOutcome.ValidationFailed,
                    Message =
                        $"Policy pack name must be at most {PolicyPackCatalogEntryLimits.DisplayNameMaxLength} characters for catalog promotion.",
                });

        PolicyPacksController sut = CreateSut(httpFacade, tenantExists: true);

        IActionResult result = await sut.PromoteCatalogEntry(
            new PromotePolicyPackCatalogEntryRequest
            {
                SourcePolicyPackId = sourcePackId,
                Version = "1.0.0",
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        httpFacade.VerifyAll();
    }

    [Fact]
    public async Task PromoteCatalogEntry_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.PromoteCatalogEntry(
            new PromotePolicyPackCatalogEntryRequest
            {
                SourcePolicyPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                Version = "1.0.0",
            },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task PromoteCatalogEntry_returns_bad_request_when_version_is_not_semver_and_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.PromoteCatalogEntry(
            new PromotePolicyPackCatalogEntryRequest
            {
                SourcePolicyPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                Version = "latest",
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task DemoteCatalogEntry_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.DemoteCatalogEntry(
            new DemotePolicyPackCatalogEntryRequest
            {
                PolicyPackCatalogEntryId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task ListVersions_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.ListVersions(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task ListVersions_returns_bad_request_when_route_id_empty()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        PolicyPacksController sut = CreateSut(httpFacade, tenantExists: true);

        IActionResult result = await sut.ListVersions(Guid.Empty, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        httpFacade.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetVersion_returns_not_found_when_tenant_missing()
    {
        PolicyPacksController sut = CreateSut(
            httpFacade: new Mock<IPolicyPackHttpFacade>(MockBehavior.Strict),
            tenantExists: false);

        IActionResult result = await sut.GetVersion(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            "1.0.0",
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetVersion_returns_bad_request_when_route_id_empty()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        PolicyPacksController sut = CreateSut(httpFacade, tenantExists: true);

        IActionResult result = await sut.GetVersion(Guid.Empty, "1.0.0", CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        httpFacade.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetVersion_returns_bad_request_when_pack_version_exceeds_max_length()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        PolicyPacksController sut = CreateSut(httpFacade, tenantExists: true);

        IActionResult result = await sut.GetVersion(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            new string('1', PolicyPackRequestValidationRules.PackVersionMaxLength + 1),
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        httpFacade.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetVersion_returns_bad_request_when_pack_version_is_not_semver()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        PolicyPacksController sut = CreateSut(httpFacade, tenantExists: true);

        IActionResult result = await sut.GetVersion(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            "latest",
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        httpFacade.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ExplainPack_returns_bad_request_when_route_id_empty()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        PolicyPacksController sut = CreateSut(httpFacade, tenantExists: true);

        IActionResult result = await sut.ExplainPack(Guid.Empty, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        httpFacade.VerifyNoOtherCalls();
    }

    private static PolicyPacksController CreateSut(
        Mock<IPolicyPackHttpFacade> httpFacade,
        bool tenantExists)
    {
        if (!tenantExists)
            PolicyPacksControllerTestSupport.SetupScopeNotFoundDefaults(httpFacade);

        return PolicyPacksControllerTestSupport.CreateController(httpFacade);
    }
}
