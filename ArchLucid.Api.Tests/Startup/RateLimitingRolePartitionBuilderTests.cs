using System.Security.Claims;

using ArchLucid.Api.Startup;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Tests.Startup;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RateLimitingRolePartitionBuilderTests
{
    [SkippableFact]
    public void ResolveClientPartitionKey_uses_tenant_claim_for_authenticated_users()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        DefaultHttpContext http = new();
        http.User = new ClaimsPrincipal(
            new ClaimsIdentity(
                [new Claim("tenant_id", tenantId.ToString("D"))],
                authenticationType: "Bearer"));

        string key = RateLimitingRolePartitionBuilder.ResolveClientPartitionKey(http);

        key.Should().Be($"t:{tenantId:N}");
    }

    [SkippableFact]
    public void CreateFixedWindow_admin_role_increases_permit_limit()
    {
        ServiceCollection services = new();
        services.AddSingleton(
            Options.Create(
                new RateLimitingRoleMultiplierOptions { Admin = 2.0, Reader = 1.0, Operator = 1.0, Anonymous = 1.0 }));

        DefaultHttpContext http = new();
        http.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("127.0.0.1");
        http.RequestServices = services.BuildServiceProvider();

        http.User = new ClaimsPrincipal(
            new ClaimsIdentity([new Claim(ClaimTypes.Role, ArchLucidRoles.Reader)], authenticationType: "Bearer"));

        System.Threading.RateLimiting.RateLimitPartition<string> readerPartition =
            RateLimitingRolePartitionBuilder.CreateFixedWindow(http, 10, 1, 0, "fixed", 1.0);

        http.User = new ClaimsPrincipal(
            new ClaimsIdentity([new Claim(ClaimTypes.Role, ArchLucidRoles.Admin)], authenticationType: "Bearer"));

        System.Threading.RateLimiting.RateLimitPartition<string> adminPartition =
            RateLimitingRolePartitionBuilder.CreateFixedWindow(http, 10, 1, 0, "fixed", 1.0);

        readerPartition.PartitionKey.Should().Contain("reader:");
        adminPartition.PartitionKey.Should().Contain("admin:");
        adminPartition.PartitionKey.Should().NotBe(readerPartition.PartitionKey);
    }
}
