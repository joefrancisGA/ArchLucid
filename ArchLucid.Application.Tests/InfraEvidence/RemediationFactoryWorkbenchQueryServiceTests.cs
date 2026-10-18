using ArchLucid.Application.InfraEvidence.RemediationMetrics;
using ArchLucid.Application.InfraEvidence.RemediationWaves;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RemediationFactoryWorkbenchQueryServiceTests
{
    [Fact]
    public async Task GetSummaryAsync_uses_grouped_status_counts_and_wave_member_counts()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        ProjectScopeKey projectScope = scope.ToProjectScopeKey();
        Guid waveId = Guid.NewGuid();

        Mock<IRemediationFactoryMetricsService> metrics = new();
        metrics.Setup(service => service.GetMetricsAsync(scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RemediationFactoryMetrics());

        Mock<IProjectScopedRemediationInstanceRepository> instances = new();
        instances.Setup(repository => repository.CountOpenInstancesByStatusInScopeAsync(projectScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, int>
            {
                ["ChangeImplemented"] = 2,
                ["VerificationFailed"] = 1,
            });

        Mock<IRemediationWaveService> waves = new();
        waves.Setup(service => service.ListWavesAsync(scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new RemediationWaveRecord
                {
                    WaveId = waveId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    Name = "Wave A",
                    Status = RemediationWaveStatus.Active,
                    CreatedByActorKey = "actor",
                    CreatedUtc = DateTime.UtcNow,
                    UpdatedUtc = DateTime.UtcNow,
                },
            ]);
        waves.Setup(service => service.GetMemberCountsByScopeAsync(scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, int> { [waveId] = 4 });

        RemediationFactoryWorkbenchQueryService service = new(
            metrics.Object,
            instances.Object,
            waves.Object);

        RemediationFactoryWorkbenchSummary summary = await service.GetSummaryAsync(scope);

        summary.OpenInstancesByStatus.Should().ContainKey("ChangeImplemented").WhoseValue.Should().Be(2);
        summary.OpenInstancesByStatus.Should().ContainKey("VerificationFailed").WhoseValue.Should().Be(1);
        summary.OpenInstancesByStatus.Should().NotContainKey("Closed");
        summary.Waves.Should().ContainSingle().Which.MemberCount.Should().Be(4);

        instances.Verify(
            repository => repository.ListByScopeAsync(It.IsAny<ProjectScopeKey>(), It.IsAny<CancellationToken>()),
            Times.Never);
        waves.Verify(
            waveService => waveService.GetWaveAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
