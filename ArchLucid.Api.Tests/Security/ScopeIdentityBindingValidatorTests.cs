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
}
