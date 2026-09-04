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
    public async Task SaveAttestationAsync_preserves_existing_notes_when_partial_body_omits_them()
    {
        string existingPayload = JsonSerializer.Serialize(new
        {
            AttestedIncidentsAvoided = 3,
            AttestedRevenueOrRetentionImpact = "Q2 uplift",
            AttestedReviewerTimeSavedNote = "saved 4h",
        });

        string? capturedJson = null;
        Mock<ITenantSettingsRepository> repo = new();
        repo.Setup(r => r.TryGetAsync(
                TenantId,
                $"{TenantSettingKeys.RealizedValueAttestation}.{WorkspaceId:D}",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingPayload);
        repo.Setup(r => r.UpsertAsync(
                TenantId,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Callback<Guid, string, string, CancellationToken>((_, _, json, _) => capturedJson = json)
            .Returns(Task.CompletedTask);

        RealizedValueAttestationService sut = new(repo.Object);
        await sut.SaveAttestationAsync(
            TenantId,
            WorkspaceId,
            new UpsertRealizedValueAttestationRequest { AttestedIncidentsAvoided = 5 },
            CancellationToken.None);

        capturedJson.Should().NotBeNull();
        using JsonDocument document = JsonDocument.Parse(capturedJson!);
        JsonElement root = document.RootElement;

        root.GetProperty("AttestedIncidentsAvoided").GetInt32().Should().Be(5);
        root.GetProperty("AttestedRevenueOrRetentionImpact").GetString().Should().Be("Q2 uplift");
        root.GetProperty("AttestedReviewerTimeSavedNote").GetString().Should().Be("saved 4h");
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

    [Fact]
    public async Task SaveAttestationAsync_throws_when_attested_incidents_negative()
    {
        RealizedValueAttestationService sut = new(Mock.Of<ITenantSettingsRepository>());

        UpsertRealizedValueAttestationRequest request = new()
        {
            AttestedIncidentsAvoided = -1,
        };

        Func<Task> act = () => sut.SaveAttestationAsync(TenantId, WorkspaceId, request, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*non-negative*");
    }

    [Fact]
    public async Task SaveAttestationAsync_throws_when_note_exceeds_max_length()
    {
        RealizedValueAttestationService sut = new(Mock.Of<ITenantSettingsRepository>());

        UpsertRealizedValueAttestationRequest request = new()
        {
            AttestedReviewerTimeSavedNote = new string('x', RealizedValueAttestationUpsertValidation.NoteMaxLength + 1),
        };

        Func<Task> act = () => sut.SaveAttestationAsync(TenantId, WorkspaceId, request, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage($"*at most {RealizedValueAttestationUpsertValidation.NoteMaxLength}*");
    }
}
