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

    [Fact]
    public void Create_with_other_vertical_and_specification_includes_other_text_in_description()
    {
        ArchitectureRequest request = TrialVerticalWelcomeRequestFactory.Create(
            TenantId,
            "Other",
            "Regional utilities cooperative");

        request.SystemName.Should().Be("TrialWelcomeApi");
        request.Description.Should().Contain("Regional utilities cooperative");
    }

    [Fact]
    public void Create_with_other_vertical_without_specification_returns_default_welcome_request()
    {
        ArchitectureRequest withOtherOnly = TrialVerticalWelcomeRequestFactory.Create(TenantId, "Other");
        ArchitectureRequest withoutVertical = TrialVerticalWelcomeRequestFactory.Create(TenantId, industryVertical: null);

        withOtherOnly.Description.Should().Be(withoutVertical.Description);
        withOtherOnly.SystemName.Should().Be(withoutVertical.SystemName);
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
