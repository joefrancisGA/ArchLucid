using ArchLucid.Application.OperatorHome;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.OperatorHome;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FeaturedCompletedSampleServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid EligibleRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    [Fact]
    public async Task GetSnapshotAsync_returns_unconfigured_when_no_setting()
    {
        FeaturedCompletedSampleService sut = CreateService(
            tenantSettings: CreateTenantSettingsMock(null),
            runs: CreateRunRepositoryMock());

        FeaturedCompletedSampleSnapshot snapshot = await sut.GetSnapshotAsync(CancellationToken.None);

        snapshot.IsConfigured.Should().BeFalse();
        snapshot.IsAvailable.Should().BeFalse();
        snapshot.SelectedRunId.Should().BeNull();
    }

    [Fact]
    public async Task SetSelectedRunIdAsync_persists_eligible_completed_review()
    {
        Mock<ITenantSettingsRepository> tenantSettings = CreateTenantSettingsMock(null);
        Mock<IRunRepository> runs = CreateRunRepositoryMock(CreateEligibleRun());

        FeaturedCompletedSampleService sut = CreateService(tenantSettings, runs);

        FeaturedCompletedSampleSnapshot snapshot =
            await sut.SetSelectedRunIdAsync(EligibleRunId, CancellationToken.None);

        snapshot.IsConfigured.Should().BeTrue();
        snapshot.IsAvailable.Should().BeTrue();
        snapshot.ReviewTitle.Should().Be("Claims intake modernization");
        tenantSettings.Verify(
            repository => repository.UpsertAsync(
                Scope.TenantId,
                ArchLucid.Core.Tenancy.TenantSettingKeys.FeaturedCompletedSampleRunId,
                EligibleRunId.ToString("D"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task GetSnapshotAsync_marks_unavailable_when_selected_review_is_ineligible()
    {
        RunRecord inProgressRun = CreateEligibleRun();
        inProgressRun.GoldenManifestId = null;

        FeaturedCompletedSampleService sut = CreateService(
            tenantSettings: CreateTenantSettingsMock(EligibleRunId.ToString("D")),
            runs: CreateRunRepositoryMock(inProgressRun));

        FeaturedCompletedSampleSnapshot snapshot = await sut.GetSnapshotAsync(CancellationToken.None);

        snapshot.IsConfigured.Should().BeTrue();
        snapshot.IsAvailable.Should().BeFalse();
        snapshot.SelectedRunId.Should().Be(EligibleRunId);
    }

    [Fact]
    public async Task ListEligibleCandidatesAsync_returns_only_completed_non_archived_reviews()
    {
        RunRecord eligible = CreateEligibleRun();
        RunRecord archived = CreateEligibleRun();
        archived.RunId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        archived.ArchivedUtc = DateTime.UtcNow;

        Mock<IRunRepository> runs = new();
        runs
            .Setup(repository => repository.ListRecentInScopeAsync(Scope, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { eligible, archived });

        FeaturedCompletedSampleService sut = CreateService(CreateTenantSettingsMock(null), runs);

        IReadOnlyList<FeaturedCompletedSampleCandidate> candidates =
            await sut.ListEligibleCandidatesAsync(CancellationToken.None);

        candidates.Should().ContainSingle();
        candidates[0].RunId.Should().Be(EligibleRunId);
        candidates[0].IsSampleApproved.Should().BeTrue();
    }

    private static FeaturedCompletedSampleService CreateService(
        Mock<ITenantSettingsRepository> tenantSettings,
        Mock<IRunRepository> runs)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        return new FeaturedCompletedSampleService(scopeProvider.Object, tenantSettings.Object, runs.Object);
    }

    private static Mock<ITenantSettingsRepository> CreateTenantSettingsMock(string? storedValue)
    {
        Mock<ITenantSettingsRepository> repository = new();
        repository
            .Setup(r => r.TryGetAsync(Scope.TenantId, ArchLucid.Core.Tenancy.TenantSettingKeys.FeaturedCompletedSampleRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(storedValue);

        return repository;
    }

    private static Mock<IRunRepository> CreateRunRepositoryMock(RunRecord? run = null)
    {
        Mock<IRunRepository> repository = new();
        repository
            .Setup(r => r.GetByIdAsync(Scope, EligibleRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(run);

        return repository;
    }

    private static RunRecord CreateEligibleRun()
    {
        return new RunRecord
        {
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ScopeProjectId = Scope.ProjectId,
            RunId = EligibleRunId,
            ProjectId = "default",
            Description = "Claims intake modernization",
            CreatedUtc = DateTime.UtcNow.AddDays(-3),
            CompletedUtc = DateTime.UtcNow.AddDays(-1),
            GoldenManifestId = Guid.NewGuid(),
            IsPublicShowcase = true,
        };
    }
}
