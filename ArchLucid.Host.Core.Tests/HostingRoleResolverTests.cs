using ArchLucid.Host.Core.Hosting;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Host.Core.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class HostingRoleResolverTests
{
    [Fact]
    public void Resolve_returns_Combined_when_key_missing()
    {
        ConfigurationManager configuration = new();

        ArchLucidHostingRole role = HostingRoleResolver.Resolve(configuration);

        role.Should().Be(ArchLucidHostingRole.Combined);
    }

    [Fact]
    public void Resolve_maps_Api_Worker_and_unknown()
    {
        ConfigurationManager api = new();
        api["Hosting:Role"] = "Api";

        ConfigurationManager worker = new();
        worker["Hosting:Role"] = "WORKER";

        ConfigurationManager nonsense = new();
        nonsense["Hosting:Role"] = "Other";

        HostingRoleResolver.Resolve(api).Should().Be(ArchLucidHostingRole.Api);
        HostingRoleResolver.Resolve(worker).Should().Be(ArchLucidHostingRole.Worker);
        HostingRoleResolver.Resolve(nonsense).Should().Be(ArchLucidHostingRole.Combined);
    }

    [Fact]
    public void Resolve_throws_when_configuration_null()
    {
        Action act = () => HostingRoleResolver.Resolve(null!);

        act.Should().Throw<ArgumentNullException>();
    }
}
