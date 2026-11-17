using ArchLucid.Application.Notifications.Email;

using FluentAssertions;

using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Tests.SponsorDigest;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SponsorDigestUnsubscribeTokenFactoryTests
{
    [Fact]
    public void Round_trips_tenant_id()
    {
        ServiceCollection services = [];
        services.AddDataProtection();
        ServiceProvider sp = services.BuildServiceProvider();
        IDataProtectionProvider provider = sp.GetRequiredService<IDataProtectionProvider>();
        SponsorDigestUnsubscribeTokenFactory factory = new(provider);

        Guid tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        string token = factory.CreateToken(tenantId);

        bool ok = factory.TryParseTenant(token, out Guid parsed);

        ok.Should().BeTrue();
        parsed.Should().Be(tenantId);
    }

    [Fact]
    public void TryParseTenant_rejects_valid_token_with_trailing_vertical_tab()
    {
        ServiceCollection services = [];
        services.AddDataProtection();
        ServiceProvider sp = services.BuildServiceProvider();
        IDataProtectionProvider provider = sp.GetRequiredService<IDataProtectionProvider>();
        SponsorDigestUnsubscribeTokenFactory factory = new(provider);

        Guid tenantId = Guid.Parse("cccccccc-dddd-eeee-ffff-000000000001");
        string token = factory.CreateToken(tenantId) + "\u000B";

        bool ok = factory.TryParseTenant(token, out Guid parsed);

        ok.Should().BeFalse();
        parsed.Should().Be(Guid.Empty);
    }
}
