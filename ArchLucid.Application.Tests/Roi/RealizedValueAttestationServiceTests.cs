using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RealizedValueAttestationServiceTests
{
    [Fact]
    public async Task GetAttestationAsync_returns_empty_when_missing()
    {
        Mock<ITenantSettingsRepository> repo = new();
        repo.Setup(r => r.TryGetAsync(It.IsAny<Guid>(), TenantSettingKeys.RealizedValueAttestation, It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        RealizedValueAttestationService sut = new(repo.Object);
        RealizedValueAttestationResponse response = await sut.GetAttestationAsync(Guid.NewGuid());

        response.HasAttestation.Should().BeFalse();
    }
}
