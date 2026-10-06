using System.Security.Claims;

using ArchLucid.Core.Authorization;
using ArchLucid.Host.Core.Auth.Services;

using FluentAssertions;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Api.Tests.Security;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ScopeIdentityBindingValidatorTests
{
    [SkippableFact]
    public void Validate_succeeds_when_claim_and_header_match()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [new Claim("tenant_id", tenantId.ToString("D"))],
                "Bearer"))
        };
        http.Request.Headers["x-tenant-id"] = tenantId.ToString("D");

        ScopeIdentityBindingValidator.ScopeIdentityBindingResult result =
            ScopeIdentityBindingValidator.Validate(http.User, http.Request.Headers);

        result.IsValid.Should().BeTrue();
    }

    [SkippableFact]
    public void Validate_fails_when_claim_and_header_disagree()
    {
        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [new Claim("tenant_id", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")],
                "Bearer"))
        };
        http.Request.Headers["x-tenant-id"] = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

        ScopeIdentityBindingValidator.ScopeIdentityBindingResult result =
            ScopeIdentityBindingValidator.Validate(http.User, http.Request.Headers);

        result.IsValid.Should().BeFalse();
        result.FailureMessage.Should().Contain("x-tenant-id");
    }

    [SkippableFact]
    public void ValidateHeaderOnlyScopeEscalation_rejects_workspace_header_without_claim_for_bearer()
    {
        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [new Claim("tenant_id", Guid.NewGuid().ToString("D"))],
                "Bearer"))
        };
        http.Request.Headers["x-workspace-id"] = Guid.NewGuid().ToString("D");

        ScopeIdentityBindingValidator.ScopeIdentityBindingResult result =
            ScopeIdentityBindingValidator.ValidateHeaderOnlyScopeEscalation(http.User, http.Request.Headers, "Bearer");

        result.IsValid.Should().BeFalse();
        result.FailureMessage.Should().Contain("x-workspace-id");
    }

    [SkippableFact]
    public void ValidateHeaderOnlyScopeEscalation_rejects_project_header_without_claim_for_scim_bearer()
    {
        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [new Claim("tenant_id", Guid.NewGuid().ToString("D"))],
                ScimBearerDefaults.AuthenticationScheme))
        };
        http.Request.Headers["x-project-id"] = Guid.NewGuid().ToString("D");

        ScopeIdentityBindingValidator.ScopeIdentityBindingResult result =
            ScopeIdentityBindingValidator.ValidateHeaderOnlyScopeEscalation(
                http.User,
                http.Request.Headers,
                ScimBearerDefaults.AuthenticationScheme);

        result.IsValid.Should().BeFalse();
        result.FailureMessage.Should().Contain("x-project-id");
    }

    [SkippableFact]
    public void ValidateHeaderOnlyScopeEscalation_rejects_duplicate_workspace_headers_without_claim_for_saml2()
    {
        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [new Claim("tenant_id", Guid.NewGuid().ToString("D"))],
                "Saml2"))
        };
        http.Request.Headers.Append("x-workspace-id", Guid.NewGuid().ToString("D"));
        http.Request.Headers.Append("x-workspace-id", Guid.NewGuid().ToString("D"));

        ScopeIdentityBindingValidator.ScopeIdentityBindingResult result =
            ScopeIdentityBindingValidator.ValidateHeaderOnlyScopeEscalation(http.User, http.Request.Headers, "Saml2");

        result.IsValid.Should().BeFalse();
        result.FailureMessage.Should().Contain("x-workspace-id");
    }

    [SkippableFact]
    public void ValidateHeaderOnlyScopeEscalation_rejects_workspace_header_without_claim_for_saml2()
    {
        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [new Claim("tenant_id", Guid.NewGuid().ToString("D"))],
                "Saml2"))
        };
        http.Request.Headers["x-workspace-id"] = Guid.NewGuid().ToString("D");

        ScopeIdentityBindingValidator.ScopeIdentityBindingResult result =
            ScopeIdentityBindingValidator.ValidateHeaderOnlyScopeEscalation(http.User, http.Request.Headers, "Saml2");

        result.IsValid.Should().BeFalse();
        result.FailureMessage.Should().Contain("x-workspace-id");
    }

    [SkippableFact]
    public void ValidateHeaderOnlyScopeEscalation_rejects_duplicate_tenant_headers_without_claim_for_saml2()
    {
        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [new Claim("workspace_id", Guid.NewGuid().ToString("D"))],
                "Saml2"))
        };
        http.Request.Headers.Append("x-tenant-id", Guid.NewGuid().ToString("D"));
        http.Request.Headers.Append("x-tenant-id", Guid.NewGuid().ToString("D"));

        ScopeIdentityBindingValidator.ScopeIdentityBindingResult result =
            ScopeIdentityBindingValidator.ValidateHeaderOnlyScopeEscalation(http.User, http.Request.Headers, "Saml2");

        result.IsValid.Should().BeFalse();
        result.FailureMessage.Should().Contain("x-tenant-id");
    }

    [SkippableFact]
    public void ValidateHeaderOnlyScopeEscalation_rejects_duplicate_workspace_headers_without_claim_for_scim_bearer()
    {
        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [new Claim("tenant_id", Guid.NewGuid().ToString("D"))],
                ScimBearerDefaults.AuthenticationScheme))
        };
        http.Request.Headers.Append("x-workspace-id", Guid.NewGuid().ToString("D"));
        http.Request.Headers.Append("x-workspace-id", Guid.NewGuid().ToString("D"));

        ScopeIdentityBindingValidator.ScopeIdentityBindingResult result =
            ScopeIdentityBindingValidator.ValidateHeaderOnlyScopeEscalation(
                http.User,
                http.Request.Headers,
                ScimBearerDefaults.AuthenticationScheme);

        result.IsValid.Should().BeFalse();
        result.FailureMessage.Should().Contain("x-workspace-id");
    }

    [SkippableFact]
    public void ValidateHeaderOnlyScopeEscalation_rejects_duplicate_project_headers_without_claim_for_scim_bearer()
    {
        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [new Claim("tenant_id", Guid.NewGuid().ToString("D"))],
                ScimBearerDefaults.AuthenticationScheme))
        };
        http.Request.Headers.Append("x-project-id", Guid.NewGuid().ToString("D"));
        http.Request.Headers.Append("x-project-id", Guid.NewGuid().ToString("D"));

        ScopeIdentityBindingValidator.ScopeIdentityBindingResult result =
            ScopeIdentityBindingValidator.ValidateHeaderOnlyScopeEscalation(
                http.User,
                http.Request.Headers,
                ScimBearerDefaults.AuthenticationScheme);

        result.IsValid.Should().BeFalse();
        result.FailureMessage.Should().Contain("x-project-id");
    }

    [SkippableFact]
    public void ValidateHeaderOnlyScopeEscalation_rejects_duplicate_tenant_headers_without_claim_for_scim_bearer()
    {
        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [new Claim("workspace_id", Guid.NewGuid().ToString("D"))],
                ScimBearerDefaults.AuthenticationScheme))
        };
        http.Request.Headers.Append("x-tenant-id", Guid.NewGuid().ToString("D"));
        http.Request.Headers.Append("x-tenant-id", Guid.NewGuid().ToString("D"));

        ScopeIdentityBindingValidator.ScopeIdentityBindingResult result =
            ScopeIdentityBindingValidator.ValidateHeaderOnlyScopeEscalation(
                http.User,
                http.Request.Headers,
                ScimBearerDefaults.AuthenticationScheme);

        result.IsValid.Should().BeFalse();
        result.FailureMessage.Should().Contain("x-tenant-id");
    }

    [SkippableFact]
    public void ValidateHeaderOnlyScopeEscalation_rejects_duplicate_tenant_headers_without_claim_for_api_key()
    {
        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [new Claim(ClaimTypes.Name, "ApiKeyAdmin")],
                "ApiKey"))
        };
        http.Request.Headers.Append("x-tenant-id", Guid.NewGuid().ToString("D"));
        http.Request.Headers.Append("x-tenant-id", Guid.NewGuid().ToString("D"));

        ScopeIdentityBindingValidator.ScopeIdentityBindingResult result =
            ScopeIdentityBindingValidator.ValidateHeaderOnlyScopeEscalation(http.User, http.Request.Headers, "ApiKey");

        result.IsValid.Should().BeFalse();
        result.FailureMessage.Should().Contain("x-tenant-id");
    }

    [SkippableFact]
    public void ValidateHeaderOnlyScopeEscalation_rejects_duplicate_tenant_headers_without_claim_for_bearer()
    {
        Guid tenantId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [new Claim(ClaimTypes.Name, "JwtUser")],
                "Bearer"))
        };
        http.Request.Headers.Append("x-tenant-id", tenantId.ToString("D"));
        http.Request.Headers.Append("x-tenant-id", Guid.NewGuid().ToString("D"));

        ScopeIdentityBindingValidator.ScopeIdentityBindingResult result =
            ScopeIdentityBindingValidator.ValidateHeaderOnlyScopeEscalation(http.User, http.Request.Headers, "Bearer");

        result.IsValid.Should().BeFalse();
        result.FailureMessage.Should().Contain("x-tenant-id");
    }

    [SkippableFact]
    public void Validate_rejects_conflicting_tenant_header_when_find_first_claim_disagrees_with_later_claim()
    {
        Guid firstTenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid secondTenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        DefaultHttpContext http = new();
        ClaimsIdentity identity = new("Bearer");
        identity.AddClaim(new Claim("tenant_id", firstTenantId.ToString("D")));
        identity.AddClaim(new Claim("tenant_id", secondTenantId.ToString("D")));
        http.User = new ClaimsPrincipal(identity);
        http.Request.Headers["x-tenant-id"] = secondTenantId.ToString("D");

        ScopeIdentityBindingValidator.ScopeIdentityBindingResult result =
            ScopeIdentityBindingValidator.Validate(http.User, http.Request.Headers);

        result.IsValid.Should().BeFalse();
    }

    [SkippableFact]
    public void Validate_allows_matching_tenant_header_when_only_find_first_claim_is_considered_for_scope_binding()
    {
        Guid firstTenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid secondTenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        DefaultHttpContext http = new();
        ClaimsIdentity identity = new("Bearer");
        identity.AddClaim(new Claim("tenant_id", firstTenantId.ToString("D")));
        identity.AddClaim(new Claim("tenant_id", secondTenantId.ToString("D")));
        http.User = new ClaimsPrincipal(identity);
        http.Request.Headers["x-tenant-id"] = firstTenantId.ToString("D");

        ScopeIdentityBindingValidator.ScopeIdentityBindingResult result =
            ScopeIdentityBindingValidator.Validate(http.User, http.Request.Headers);

        result.IsValid.Should().BeTrue();
    }

    [SkippableFact]
    public void ValidateHeaderOnlyScopeEscalation_skips_header_guard_for_unknown_authenticated_scheme()
    {
        DefaultHttpContext http = new();
        http.User = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(ClaimTypes.Name, "custom-auth-user")],
            "CustomIntegrationScheme"));
        http.Request.Headers["x-tenant-id"] = Guid.NewGuid().ToString("D");

        ScopeIdentityBindingValidator.ScopeIdentityBindingResult result =
            ScopeIdentityBindingValidator.ValidateHeaderOnlyScopeEscalation(http.User, http.Request.Headers, "CustomIntegrationScheme");

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void ValidateHeaderOnlyScopeEscalation_rejects_tenant_header_without_claim_for_lowercase_bearer_auth_type()
    {
        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [new Claim(ClaimTypes.Name, "JwtUser")],
                "bearer"))
        };
        http.Request.Headers["x-tenant-id"] = Guid.NewGuid().ToString("D");

        ScopeIdentityBindingValidator.ScopeIdentityBindingResult result =
            ScopeIdentityBindingValidator.ValidateHeaderOnlyScopeEscalation(http.User, http.Request.Headers, "bearer");

        result.IsValid.Should().BeFalse();
        result.FailureMessage.Should().Contain("x-tenant-id");
    }

    [SkippableFact]
    public void ValidateHeaderOnlyScopeEscalation_skips_workspace_header_guard_for_development_bypass_auth_type()
    {
        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [new Claim("tenant_id", Guid.NewGuid().ToString("D"))],
                "DevelopmentBypass"))
        };
        http.Request.Headers["x-workspace-id"] = Guid.NewGuid().ToString("D");

        ScopeIdentityBindingValidator.ScopeIdentityBindingResult result =
            ScopeIdentityBindingValidator.ValidateHeaderOnlyScopeEscalation(
                http.User,
                http.Request.Headers,
                "DevelopmentBypass");

        result.IsValid.Should().BeTrue();
    }

    [SkippableFact]
    public void ValidateHeaderOnlyScopeEscalation_rejects_duplicate_workspace_headers_without_claim_for_api_key()
    {
        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [new Claim("tenant_id", Guid.NewGuid().ToString("D"))],
                "ApiKey"))
        };
        http.Request.Headers.Append("x-workspace-id", Guid.NewGuid().ToString("D"));
        http.Request.Headers.Append("x-workspace-id", Guid.NewGuid().ToString("D"));

        ScopeIdentityBindingValidator.ScopeIdentityBindingResult result =
            ScopeIdentityBindingValidator.ValidateHeaderOnlyScopeEscalation(http.User, http.Request.Headers, "ApiKey");

        result.IsValid.Should().BeFalse();
        result.FailureMessage.Should().Contain("x-workspace-id");
    }

    [SkippableFact]
    public void ValidateHeaderOnlyScopeEscalation_rejects_duplicate_project_headers_without_claim_for_bearer()
    {
        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [new Claim("tenant_id", Guid.NewGuid().ToString("D"))],
                "Bearer"))
        };
        http.Request.Headers.Append("x-project-id", Guid.NewGuid().ToString("D"));
        http.Request.Headers.Append("x-project-id", Guid.NewGuid().ToString("D"));

        ScopeIdentityBindingValidator.ScopeIdentityBindingResult result =
            ScopeIdentityBindingValidator.ValidateHeaderOnlyScopeEscalation(http.User, http.Request.Headers, "Bearer");

        result.IsValid.Should().BeFalse();
        result.FailureMessage.Should().Contain("x-project-id");
    }

    [SkippableFact]
    public void ValidateHeaderOnlyScopeEscalation_rejects_duplicate_project_headers_without_claim_for_api_key()
    {
        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [new Claim("tenant_id", Guid.NewGuid().ToString("D"))],
                "ApiKey"))
        };
        http.Request.Headers.Append("x-project-id", Guid.NewGuid().ToString("D"));
        http.Request.Headers.Append("x-project-id", Guid.NewGuid().ToString("D"));

        ScopeIdentityBindingValidator.ScopeIdentityBindingResult result =
            ScopeIdentityBindingValidator.ValidateHeaderOnlyScopeEscalation(http.User, http.Request.Headers, "ApiKey");

        result.IsValid.Should().BeFalse();
        result.FailureMessage.Should().Contain("x-project-id");
    }

    [SkippableFact]
    public void Validate_rejects_conflicting_workspace_header_for_development_bypass_principal()
    {
        Guid workspaceId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [
                    new Claim("tenant_id", Guid.NewGuid().ToString("D")),
                    new Claim("workspace_id", workspaceId.ToString("D")),
                ],
                "DevelopmentBypass"))
        };
        http.Request.Headers["x-workspace-id"] = Guid.NewGuid().ToString("D");

        ScopeIdentityBindingValidator.ScopeIdentityBindingResult result =
            ScopeIdentityBindingValidator.Validate(http.User, http.Request.Headers);

        result.IsValid.Should().BeFalse();
        result.FailureMessage.Should().Contain("x-workspace-id");
    }
}
