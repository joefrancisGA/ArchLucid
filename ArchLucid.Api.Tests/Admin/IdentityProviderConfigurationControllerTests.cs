using System.Data;
using System.Security.Claims;
using System.Text.Json;

using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Auth.Services;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests.Admin;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class IdentityProviderConfigurationControllerTests
{
    [Fact]
    public void TestLogin_rejects_issuer_uri_with_embedded_zero_width_character()
    {
        IdentityProviderConfigurationController controller = CreateController();

        IActionResult result = controller.TestLogin(
            new IdentityProviderTestLoginRequest
            {
                Protocol = "oidc",
                IssuerUri = "https://idp.example/\u200B",
                ClaimMapping = ValidClaimMapping(),
                SampleClaimValues = ["al-admins"],
            });

        ObjectResult objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        objectResult.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>();
    }

    [Fact]
    public void TestLogin_rejects_invisible_unicode_only_role_claim_name()
    {
        IdentityProviderConfigurationController controller = CreateController(
            testLoginService: new SsoWizardTestLoginService());

        IActionResult result = controller.TestLogin(
            new IdentityProviderTestLoginRequest
            {
                Protocol = "oidc",
                IssuerUri = "https://idp.example/",
                ClaimMapping = new IdentityClaimRoleMappingRequest
                {
                    RoleClaimName = "\u200B",
                    Mappings =
                    [
                        new IdentityClaimRoleMappingEntryRequest
                        {
                            IdpValue = "al-admins",
                            ArchLucidRole = "Admin",
                        },
                    ],
                },
                SampleClaimValues = ["al-admins"],
            });

        OkObjectResult okResult = result.Should().BeOfType<OkObjectResult>().Subject;

        IdentityProviderTestLoginResponse body =
            okResult.Value.Should().BeOfType<IdentityProviderTestLoginResponse>().Subject;

        body.Success.Should().BeFalse();
        body.DiagnosticSummary.Should().Contain("RoleClaimName");
    }

    [Fact]
    public async Task ActivateAsync_audit_logs_persisted_protocol_not_raw_request_protocol()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        TenantIdentityProviderConfigurationRecord activated = new()
        {
            TenantId = tenantId,
            Protocol = TenantIdentityProtocol.Oidc,
            IssuerUri = "https://idp.example/oidc",
            IsActive = true,
            UpdatedUtc = DateTimeOffset.UtcNow,
        };

        Mock<IIdentityProviderActivationService> activation = new();
        activation
            .Setup(s => s.ActivateAsync(tenantId, "actor@test", It.IsAny<IdentityProviderActivateRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(activated);

        AuditEvent? captured = null;
        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((evt, _) => captured = evt)
            .Returns(Task.CompletedTask);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActorId()).Returns("actor@test");

        IdentityProviderConfigurationController controller = CreateController(
            activationService: activation.Object,
            actorContext: actor.Object,
            auditService: audit.Object);

        await controller.ActivateAsync(
            new IdentityProviderActivateRequest
            {
                Protocol = "  OIDC  ",
                IssuerUri = "https://idp.example/oidc",
                ClaimMapping = ValidClaimMapping(),
            },
            CancellationToken.None);

        captured.Should().NotBeNull();
        using JsonDocument document = JsonDocument.Parse(captured!.DataJson!);
        document.RootElement.GetProperty("protocol").GetString().Should().Be("oidc");
    }

    [Fact]
    public async Task ActivateAsync_audit_logs_trimmed_actor_user_id_matching_persisted_row()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        InMemoryTenantIdentityProviderConfigurationRepository repository = new();
        IdentityProviderActivationService activation = new(repository);

        AuditEvent? captured = null;
        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((evt, _) => captured = evt)
            .Returns(Task.CompletedTask);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActorId()).Returns("  admin@test  ");

        IdentityProviderConfigurationController controller = CreateController(
            activationService: activation,
            configurationRepository: repository,
            actorContext: actor.Object,
            auditService: audit.Object);

        await controller.ActivateAsync(
            new IdentityProviderActivateRequest
            {
                Protocol = "oidc",
                IssuerUri = "https://idp.example/",
                ClaimMapping = ValidClaimMapping(),
            },
            CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.ActorUserId.Should().Be("admin@test");

        TenantIdentityProviderConfigurationRecord? loaded =
            await repository.TryGetAsync(tenantId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.UpdatedByActorId.Should().Be("admin@test");
        captured.ActorUserId.Should().Be(loaded.UpdatedByActorId);
    }

    [Fact]
    public async Task ActivateAsync_persisted_audit_keeps_jwt_actor_id_when_name_identifier_differs()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        InMemoryTenantIdentityProviderConfigurationRepository repository = new();
        IdentityProviderActivationService activation = new(repository);

        AuditEvent? captured = null;
        Mock<IAuditRepository> auditRepository = new();
        auditRepository
            .Setup(repo => repo.AppendAsync(
                It.IsAny<AuditEvent>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<IDbConnection?>(),
                It.IsAny<IDbTransaction?>()))
            .Callback<AuditEvent, CancellationToken, IDbConnection?, IDbTransaction?>((auditEvent, _, _, _) => captured = auditEvent)
            .Returns(Task.CompletedTask);

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(scope);

        DefaultHttpContext httpContext = new()
        {
            User = new ClaimsPrincipal(
                new ClaimsIdentity(
                    [
                        new Claim("tid", "tenant-guid"),
                        new Claim("oid", "obj-guid"),
                        new Claim(ClaimTypes.NameIdentifier, "obj-guid"),
                        new Claim(ClaimTypes.Name, "Admin User"),
                    ],
                    authenticationType: "Bearer")),
        };

        Mock<IHttpContextAccessor> httpAccessor = new();
        httpAccessor.Setup(accessor => accessor.HttpContext).Returns(httpContext);

        IdentityProviderConfigurationController controller = new(
            Mock.Of<IIdentityProviderDiscoveryService>(),
            new SsoWizardTestLoginService(),
            activation,
            repository,
            scopeProvider.Object,
            new HttpActorContext(httpAccessor.Object),
            new AuditService(auditRepository.Object, httpAccessor.Object, scopeProvider.Object))
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext },
        };

        await controller.ActivateAsync(
            new IdentityProviderActivateRequest
            {
                Protocol = "oidc",
                IssuerUri = "https://idp.example/",
                ClaimMapping = ValidClaimMapping(),
            },
            CancellationToken.None);

        TenantIdentityProviderConfigurationRecord? loaded =
            await repository.TryGetAsync(tenantId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.UpdatedByActorId.Should().Be("jwt:tenant-guid:obj-guid");
        captured.Should().NotBeNull();
        captured!.ActorUserId.Should().Be(loaded.UpdatedByActorId);
    }

    [Fact]
    public async Task ActivateAsync_returns_success_when_audit_logging_fails()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        TenantIdentityProviderConfigurationRecord activated = new()
        {
            TenantId = tenantId,
            Protocol = TenantIdentityProtocol.Oidc,
            IssuerUri = "https://idp.example/",
            IsActive = true,
            UpdatedUtc = DateTimeOffset.UtcNow,
        };

        Mock<IIdentityProviderActivationService> activation = new();
        activation
            .Setup(s => s.ActivateAsync(tenantId, "actor@test", It.IsAny<IdentityProviderActivateRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(activated);

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("audit store unavailable"));

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActorId()).Returns("actor@test");

        IdentityProviderConfigurationController controller = CreateController(
            activationService: activation.Object,
            actorContext: actor.Object,
            auditService: audit.Object);

        IActionResult result = await controller.ActivateAsync(
            new IdentityProviderActivateRequest
            {
                Protocol = "oidc",
                IssuerUri = "https://idp.example/",
                ClaimMapping = ValidClaimMapping(),
            },
            CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        IdentityProviderActivateResponse body =
            ok.Value.Should().BeOfType<IdentityProviderActivateResponse>().Subject;
        body.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task GetConfigurationAsync_returns_canonical_issuer_uri_for_stored_row()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        InMemoryTenantIdentityProviderConfigurationRepository repository = new();

        await repository.UpsertAsync(
            new TenantIdentityProviderConfigurationRecord
            {
                TenantId = tenantId,
                Protocol = TenantIdentityProtocol.Oidc,
                IssuerUri = "https://idp.example:443/oidc",
                ClaimMappingJson = """{"roleClaimName":"groups","mappings":[]}""",
                UpdatedUtc = DateTimeOffset.UtcNow,
                UpdatedByActorId = "admin@test",
                IsActive = true,
            },
            CancellationToken.None);

        IdentityProviderConfigurationController controller = CreateController(configurationRepository: repository);

        IActionResult result = await controller.GetConfigurationAsync(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        TenantIdentityProviderConfigurationRecord body =
            ok.Value.Should().BeOfType<TenantIdentityProviderConfigurationRecord>().Subject;

        body.IssuerUri.Should().Be("https://idp.example/oidc");
    }

    [Fact]
    public async Task DiscoverAsync_returns_canonical_issuer_and_jwks_uris()
    {
        Mock<IIdentityProviderDiscoveryService> discovery = new();
        discovery
            .Setup(d => d.DiscoverAsync(It.IsAny<IdentityProviderDiscoverRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IdentityProviderDiscoverResponse
            {
                Protocol = "oidc",
                IssuerUri = "https://idp.example:443/oidc",
                JwksUri = "https://idp.example:443/oidc/jwks",
                DiscoverySucceeded = true,
                DiagnosticSummary = "ok",
            });

        IdentityProviderConfigurationController controller = CreateController(discoveryService: discovery.Object);

        IActionResult result = await controller.DiscoverAsync(
            new IdentityProviderDiscoverRequest
            {
                Protocol = "oidc",
                MetadataUrl = "https://idp.example/.well-known/openid-configuration",
            },
            CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        IdentityProviderDiscoverResponse body =
            ok.Value.Should().BeOfType<IdentityProviderDiscoverResponse>().Subject;

        body.IssuerUri.Should().Be("https://idp.example/oidc");
        body.JwksUri.Should().Be("https://idp.example/oidc/jwks");
    }

    [Fact]
    public void TestLogin_passes_canonical_issuer_uri_to_sandbox_service()
    {
        IdentityProviderTestLoginRequest? captured = null;

        Mock<ISsoWizardTestLoginService> testLogin = new();
        testLogin
            .Setup(s => s.Execute(It.IsAny<IdentityProviderTestLoginRequest>(), It.IsAny<ScopeContext>()))
            .Callback<IdentityProviderTestLoginRequest, ScopeContext>((req, _) => captured = req)
            .Returns(new IdentityProviderTestLoginResponse
            {
                Success = true,
                MappedRoles = ["Admin"],
                DiagnosticSummary = "ok",
            });

        IdentityProviderConfigurationController controller = CreateController(testLoginService: testLogin.Object);

        controller.TestLogin(
            new IdentityProviderTestLoginRequest
            {
                Protocol = "oidc",
                IssuerUri = "https://idp.example:443/oidc",
                ClaimMapping = ValidClaimMapping(),
                SampleClaimValues = ["al-admins"],
            });

        captured.Should().NotBeNull();
        captured!.IssuerUri.Should().Be("https://idp.example/oidc");
    }

    [Theory]
    [InlineData("")]
    [InlineData("oauth")]
    [InlineData("   ")]
    public void TestLogin_rejects_invalid_protocol(string protocol)
    {
        IdentityProviderConfigurationController controller = CreateController(
            testLoginService: new SsoWizardTestLoginService());

        IActionResult result = controller.TestLogin(
            new IdentityProviderTestLoginRequest
            {
                Protocol = protocol,
                IssuerUri = "https://idp.example/",
                ClaimMapping = ValidClaimMapping(),
                SampleClaimValues = ["al-admins"],
            });

        ObjectResult objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        objectResult.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>();

        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            (Microsoft.AspNetCore.Mvc.ProblemDetails)objectResult.Value!;

        problem.Type.Should().Be(ProblemTypes.ValidationFailed);
        problem.Detail.Should().Contain("oidc or saml");
    }

    [Fact]
    public void TestLogin_passes_normalized_protocol_token_to_sandbox_service()
    {
        IdentityProviderTestLoginRequest? captured = null;

        Mock<ISsoWizardTestLoginService> testLogin = new();
        testLogin
            .Setup(s => s.Execute(It.IsAny<IdentityProviderTestLoginRequest>(), It.IsAny<ScopeContext>()))
            .Callback<IdentityProviderTestLoginRequest, ScopeContext>((req, _) => captured = req)
            .Returns(new IdentityProviderTestLoginResponse
            {
                Success = true,
                MappedRoles = ["Admin"],
                DiagnosticSummary = "ok",
            });

        IdentityProviderConfigurationController controller = CreateController(testLoginService: testLogin.Object);

        controller.TestLogin(
            new IdentityProviderTestLoginRequest
            {
                Protocol = "  SAML  ",
                IssuerUri = "https://idp.example/saml",
                ClaimMapping = ValidClaimMapping(),
                SampleClaimValues = ["al-admins"],
            });

        captured.Should().NotBeNull();
        captured!.Protocol.Should().Be("saml");
    }

    [Theory]
    [InlineData("file:///etc/passwd")]
    [InlineData("javascript:alert('xss')")]
    public void TestLogin_rejects_non_http_scheme_issuer_uri(string issuerUri)
    {
        IdentityProviderConfigurationController controller = CreateController();

        IActionResult result = controller.TestLogin(
            new IdentityProviderTestLoginRequest
            {
                Protocol = "oidc",
                IssuerUri = issuerUri,
                ClaimMapping = ValidClaimMapping(),
                SampleClaimValues = ["al-admins"],
            });

        ObjectResult objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        objectResult.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>();

        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            (Microsoft.AspNetCore.Mvc.ProblemDetails)objectResult.Value!;

        problem.Type.Should().Be(ProblemTypes.ValidationFailed);
        problem.Detail.Should().Contain("HTTP(S)");
    }

    private static IdentityProviderConfigurationController CreateController(
        ISsoWizardTestLoginService? testLoginService = null,
        IIdentityProviderActivationService? activationService = null,
        IActorContext? actorContext = null,
        IAuditService? auditService = null,
        IIdentityProviderDiscoveryService? discoveryService = null,
        ITenantIdentityProviderConfigurationRepository? configurationRepository = null)
    {
        Mock<IScopeContextProvider> scopeContextProvider = new();
        scopeContextProvider
            .Setup(static p => p.GetCurrentScope())
            .Returns(new ScopeContext
            {
                TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            });

        IdentityProviderConfigurationController controller = new(
            discoveryService ?? Mock.Of<IIdentityProviderDiscoveryService>(),
            testLoginService ?? new SsoWizardTestLoginService(),
            activationService ?? Mock.Of<IIdentityProviderActivationService>(),
            configurationRepository ?? Mock.Of<ITenantIdentityProviderConfigurationRepository>(),
            scopeContextProvider.Object,
            actorContext ?? Mock.Of<IActorContext>(),
            auditService ?? Mock.Of<IAuditService>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        return controller;
    }

    private static IdentityClaimRoleMappingRequest ValidClaimMapping() => new()
    {
        RoleClaimName = "groups",
        Mappings =
        [
            new IdentityClaimRoleMappingEntryRequest
            {
                IdpValue = "al-admins",
                ArchLucidRole = "Admin",
            },
        ],
    };
}
