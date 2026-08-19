using ArchLucid.Application.Tenancy;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Suite", "Application")]
public sealed class TrialVerticalWelcomeRequestFactoryTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    [Fact]
    public void Create_without_vertical_returns_default_welcome_request()
    {
        ArchitectureRequest request = TrialVerticalWelcomeRequestFactory.Create(TenantId, industryVertical: null);

        request.SystemName.Should().Be("TrialWelcomeApi");
        request.RequestId.Should().StartWith("trial-welcome-");
    }

    [Theory]
    [InlineData("Healthcare", "MeridianFhirHub")]
    [InlineData("Financial Services", "NorthRiverCoreBankingApi")]
    [InlineData("Retail", "HarborOneCheckout")]
    [InlineData("Government / Public Sector", "BalticCitizenGateway")]
    [InlineData("Technology", "OrbitStackControlPlane")]
    public void Create_maps_known_verticals(string vertical, string expectedSystemName)
    {
        ArchitectureRequest request = TrialVerticalWelcomeRequestFactory.Create(TenantId, vertical);

        request.SystemName.Should().Be(expectedSystemName);
        request.CloudProvider.Should().Be(CloudProvider.Azure);
    }
}
