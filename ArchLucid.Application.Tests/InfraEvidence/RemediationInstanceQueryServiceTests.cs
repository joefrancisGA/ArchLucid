using ArchLucid.Application.InfraEvidence.RemediationInstances;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using ArchLucid.Decisioning.Interfaces;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RemediationInstanceQueryServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid CloudResourceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid FindingId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    [Fact]
    public async Task ListInstancesAsync_without_filter_uses_tenant_list()
    {
        Mock<IRemediationInstanceRepository> repository = new();
        repository
            .Setup(repo => repo.ListByTenantAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([CreateInstance(Guid.Parse("11111111-1111-1111-1111-111111111111"), null)]);

        RemediationInstanceQueryService service = CreateService(repository.Object);

        IReadOnlyList<RemediationInstanceSummary> instances =
            await service.ListInstancesAsync(Scope, cloudResourceId: null, findingId: null, CancellationToken.None);

        instances.Should().ContainSingle();
        repository.Verify(
            repo => repo.ListByTenantAsync(Scope.TenantId, It.IsAny<CancellationToken>()),
            Times.Once);
        repository.Verify(
            repo => repo.ListByCloudResourceIdPagedAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ListInstancesAsync_with_cloudResourceId_uses_resource_scoped_query()
    {
        Mock<IRemediationInstanceRepository> repository = new();
        repository
            .Setup(repo => repo.ListByCloudResourceIdPagedAsync(
                Scope.TenantId,
                CloudResourceId,
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(([CreateInstance(Guid.Parse("22222222-2222-2222-2222-222222222222"), CloudResourceId)], 1));

        RemediationInstanceQueryService service = CreateService(repository.Object);

        IReadOnlyList<RemediationInstanceSummary> instances =
            await service.ListInstancesAsync(Scope, CloudResourceId, findingId: null, CancellationToken.None);

        instances.Should().ContainSingle();
        instances[0].CloudResourceId.Should().Be(CloudResourceId);
        repository.Verify(
            repo => repo.ListByTenantAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ListInstancesAsync_with_findingId_uses_finding_scoped_query()
    {
        Mock<IRemediationInstanceRepository> repository = new();
        repository
            .Setup(repo => repo.ListByFindingIdAsync(Scope.TenantId, FindingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([CreateInstance(Guid.Parse("33333333-3333-3333-3333-333333333333"), CloudResourceId, FindingId)]);

        RemediationInstanceQueryService service = CreateService(repository.Object);

        IReadOnlyList<RemediationInstanceSummary> instances =
            await service.ListInstancesAsync(Scope, cloudResourceId: CloudResourceId, findingId: FindingId, CancellationToken.None);

        instances.Should().ContainSingle();
        instances[0].FindingId.Should().Be(FindingId);
        repository.Verify(
            repo => repo.ListByFindingIdAsync(Scope.TenantId, FindingId, It.IsAny<CancellationToken>()),
            Times.Once);
        repository.Verify(
            repo => repo.ListByCloudResourceIdPagedAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ListInstancesAsync_with_findingId_and_cloudResourceId_excludes_other_resources()
    {
        Guid otherResourceId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        Mock<IRemediationInstanceRepository> repository = new();
        repository
            .Setup(repo => repo.ListByFindingIdAsync(Scope.TenantId, FindingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([CreateInstance(Guid.Parse("33333333-3333-3333-3333-333333333333"), otherResourceId, FindingId)]);

        RemediationInstanceQueryService service = CreateService(repository.Object);

        IReadOnlyList<RemediationInstanceSummary> instances =
            await service.ListInstancesAsync(Scope, cloudResourceId: CloudResourceId, findingId: FindingId, CancellationToken.None);

        instances.Should().BeEmpty();
    }

    private static RemediationInstanceQueryService CreateService(IRemediationInstanceRepository repository) =>
        new(
            repository,
            new Mock<IOperationalSecurityFindingRepository>().Object,
            new Mock<IRemediationPatternMatchRepository>().Object,
            new Mock<IAuditManualEvidenceRepository>().Object,
            new Mock<IAuthorityQueryService>().Object,
            new Mock<IManifestHashService>().Object);

    private static RemediationInstanceRecord CreateInstance(Guid instanceId, Guid? cloudResourceId, Guid? findingId = null) =>
        new()
        {
            InstanceId = instanceId,
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ProjectId = Scope.ProjectId,
            FindingId = findingId ?? Guid.Parse("33333333-3333-3333-3333-333333333333"),
            PatternId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            PatternVersionId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
            PatternKey = "storage.encrypt-at-rest",
            FrozenPatternVersion = "1.0.0",
            AutomationLevel = RemediationAutomationLevel.Guided,
            Status = RemediationInstanceStatus.Classified,
            CloudResourceId = cloudResourceId,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };
}
