using System.Security.Claims;

using ArchLucid.Host.Core.Auth.Services;
using ArchLucid.Host.Core.Http;
using ArchLucid.Host.Core.Services.Delivery;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;

using Polly;

namespace ArchLucid.Host.Core.Tests;

/// <summary>
///     RC28 package-coverage batch: scope identity binding validation and outbound HTTP retry policy factories.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCorePackageCoverageBatchRc28Tests
{
    [Fact]
    public void ScopeIdentityBindingValidator_Ok_when_claim_and_header_match()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        ClaimsPrincipal user = CreatePrincipal(("tenant_id", tenantId.ToString("D")));
        HeaderDictionary headers = new() { ["x-tenant-id"] = tenantId.ToString("D") };

        ScopeIdentityBindingValidator.ScopeIdentityBindingResult result =
            ScopeIdentityBindingValidator.Validate(user, headers);

        result.IsValid.Should().BeTrue();
        result.FailureMessage.Should().BeNull();
    }

    [Fact]
    public void ScopeIdentityBindingValidator_Forbidden_when_tenant_header_mismatches_claim()
    {
        Guid claimTenant = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid headerTenant = Guid.Parse("22222222-2222-2222-2222-222222222222");
        ClaimsPrincipal user = CreatePrincipal(("tenant_id", claimTenant.ToString("D")));
        HeaderDictionary headers = new() { ["x-tenant-id"] = headerTenant.ToString("D") };

        ScopeIdentityBindingValidator.ScopeIdentityBindingResult result =
            ScopeIdentityBindingValidator.Validate(user, headers);

        result.IsValid.Should().BeFalse();
        result.FailureMessage.Should().Contain("x-tenant-id");
    }

    [Fact]
    public void ScopeIdentityBindingValidator_Ok_when_only_claim_or_only_header_present()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        ClaimsPrincipal user = CreatePrincipal(("tenant_id", tenantId.ToString("D")));

        ScopeIdentityBindingValidator.Validate(user, new HeaderDictionary()).IsValid.Should().BeTrue();
        ScopeIdentityBindingValidator.Validate(null, new HeaderDictionary
        {
            ["x-tenant-id"] = tenantId.ToString("D"),
        }).IsValid.Should().BeTrue();
    }

    [Fact]
    public void ScopeIdentityBindingValidator_result_factories()
    {
        ScopeIdentityBindingValidator.ScopeIdentityBindingResult.Ok().IsValid.Should().BeTrue();
        ScopeIdentityBindingValidator.ScopeIdentityBindingResult.Forbidden("nope").FailureMessage.Should().Be("nope");
    }

    [Fact]
    public void WebhookOutboundHttpRetryPolicy_Create_builds_policy()
    {
        IAsyncPolicy<HttpResponseMessage> policy = WebhookOutboundHttpRetryPolicy.Create(_ => TimeSpan.Zero);

        policy.Should().NotBeNull();
        WebhookOutboundHttpRetryPolicy.ProductionRetryAttempts.Should().Be(3);
    }

    [Fact]
    public void WebhookOutboundHttpRetryPolicy_Create_rejects_null_sleep_provider()
    {
        FluentActions
            .Invoking(() => WebhookOutboundHttpRetryPolicy.Create(null!))
            .Should()
            .Throw<ArgumentNullException>();
    }

    [Fact]
    public void AzureRmAndRetailPricesHttpRetryPolicy_Create_builds_policy()
    {
        IAsyncPolicy<HttpResponseMessage> policy =
            AzureRmAndRetailPricesHttpRetryPolicy.Create(NullLogger.Instance, _ => TimeSpan.Zero);

        policy.Should().NotBeNull();
        AzureRmAndRetailPricesHttpRetryPolicy.MaxRetryAttempts.Should().Be(3);
    }

    [Theory]
    [InlineData(System.Net.HttpStatusCode.RequestTimeout, true)]
    [InlineData(System.Net.HttpStatusCode.TooManyRequests, true)]
    [InlineData(System.Net.HttpStatusCode.ServiceUnavailable, true)]
    [InlineData(System.Net.HttpStatusCode.OK, false)]
    [InlineData(System.Net.HttpStatusCode.BadRequest, false)]
    public void AzureRmAndRetailPricesHttpRetryPolicy_ShouldRetryHttpResponse(System.Net.HttpStatusCode status, bool expected)
    {
        using HttpResponseMessage response = new(status);

        AzureRmAndRetailPricesHttpRetryPolicy.ShouldRetryHttpResponse(response).Should().Be(expected);
    }

    private static ClaimsPrincipal CreatePrincipal(params (string Type, string Value)[] claims)
    {
        ClaimsIdentity identity = new(claims.Select(c => new Claim(c.Type, c.Value)), authenticationType: "test");

        return new ClaimsPrincipal(identity);
    }
}
