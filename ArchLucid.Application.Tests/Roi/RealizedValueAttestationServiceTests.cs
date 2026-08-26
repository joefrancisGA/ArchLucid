using System.Text.Json;

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
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid ForeignWorkspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    [Fact]
    public async Task GetAttestationAsync_returns_empty_when_workspace_scoped_setting_missing()
    {
        Mock<ITenantSettingsRepository> repo = new();
        repo.Setup(r => r.TryGetAsync(
                TenantId,
                $"{TenantSettingKeys.RealizedValueAttestation}.{WorkspaceId:D}",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        RealizedValueAttestationService sut = new(repo.Object);
        RealizedValueAttestationResponse response = await sut.GetAttestationAsync(TenantId, WorkspaceId);

        response.HasAttestation.Should().BeFalse();
    }

    [Fact]
    public async Task GetAttestationAsync_does_not_read_foreign_workspace_attestation()
    {
        string foreignPayload = JsonSerializer.Serialize(new
        {
            AttestedIncidentsAvoided = 9,
            AttestedRevenueOrRetentionImpact = "foreign",
        });

        Mock<ITenantSettingsRepository> repo = new();
        repo.Setup(r => r.TryGetAsync(
                TenantId,
                $"{TenantSettingKeys.RealizedValueAttestation}.{WorkspaceId:D}",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);
        repo.Setup(r => r.TryGetAsync(
                TenantId,
                $"{TenantSettingKeys.RealizedValueAttestation}.{ForeignWorkspaceId:D}",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(foreignPayload);
        repo.Setup(r => r.TryGetAsync(
                TenantId,
                TenantSettingKeys.RealizedValueAttestation,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(foreignPayload);

        RealizedValueAttestationService sut = new(repo.Object);
        RealizedValueAttestationResponse response = await sut.GetAttestationAsync(TenantId, WorkspaceId);

        response.HasAttestation.Should().BeFalse();
        repo.Verify(
            r => r.TryGetAsync(
                TenantId,
                $"{TenantSettingKeys.RealizedValueAttestation}.{WorkspaceId:D}",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task SaveAttestationAsync_persists_workspace_scoped_setting_key()
    {
        string? capturedKey = null;
        Mock<ITenantSettingsRepository> repo = new();
        repo.Setup(r => r.UpsertAsync(
                TenantId,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Callback<Guid, string, string, CancellationToken>((_, key, _, _) => capturedKey = key)
            .Returns(Task.CompletedTask);

        RealizedValueAttestationService sut = new(repo.Object);
        await sut.SaveAttestationAsync(
            TenantId,
            WorkspaceId,
            new UpsertRealizedValueAttestationRequest { AttestedIncidentsAvoided = 3 },
            CancellationToken.None);

        capturedKey.Should().Be($"{TenantSettingKeys.RealizedValueAttestation}.{WorkspaceId:D}");
    }
}
