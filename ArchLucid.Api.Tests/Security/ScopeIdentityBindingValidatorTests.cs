using System.Security.Claims;

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
}
