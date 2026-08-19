using ArchLucid.Application.Notifications.Email;

using FluentAssertions;

using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Tests.ExecDigest;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ExecDigestSponsorDeepLinkTokenFactoryTests
{
    private const string IsoWeekKey = "2026-W33";
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private const string RunIdHex = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    [Fact]
    public void Dashboard_token_round_trips_claims()
    {
        ExecDigestSponsorDeepLinkTokenFactory factory = CreateFactory();
        string token = factory.CreateDashboardToken(TenantId, IsoWeekKey);

        bool ok = factory.TryParse(token, out ExecDigestSponsorDeepLinkClaims claims);

        ok.Should().BeTrue();
        claims.Target.Should().Be(ExecDigestSponsorDeepLinkTarget.Dashboard);
        claims.TenantId.Should().Be(TenantId);
        claims.IsoWeekKey.Should().Be(IsoWeekKey);
        claims.RunIdHex.Should().BeNull();
    }

    [Fact]
    public void Run_collateral_token_round_trips_claims()
    {
        ExecDigestSponsorDeepLinkTokenFactory factory = CreateFactory();
        string token = factory.CreateRunCollateralToken(TenantId, RunIdHex, IsoWeekKey);

        bool ok = factory.TryParse(token, out ExecDigestSponsorDeepLinkClaims claims);

        ok.Should().BeTrue();
        claims.Target.Should().Be(ExecDigestSponsorDeepLinkTarget.RunCollateral);
        claims.TenantId.Should().Be(TenantId);
        claims.IsoWeekKey.Should().Be(IsoWeekKey);
        claims.RunIdHex.Should().Be(RunIdHex.ToUpperInvariant());
    }

    private static ExecDigestSponsorDeepLinkTokenFactory CreateFactory()
    {
        ServiceCollection services = [];
        services.AddDataProtection();
        ServiceProvider sp = services.BuildServiceProvider();
        IDataProtectionProvider provider = sp.GetRequiredService<IDataProtectionProvider>();
        return new ExecDigestSponsorDeepLinkTokenFactory(provider);
    }
}
