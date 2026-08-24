using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PilotScorecardBuilderTests
{
    [Fact]
    public async Task BuildAsync_ReadyForCommitRunWithManifest_IsNotCountedAsCommitted()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        DateTime created = new(2026, 4, 15, 12, 0, 0, DateTimeKind.Utc);
        RunRecord readyForCommit = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            CreatedUtc = created,
            LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit),
            CurrentManifestVersion = "v1",
            GoldenManifestId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
        };

        RunRecord committed = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            RunId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
            CreatedUtc = created.AddHours(1),
            LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            CurrentManifestVersion = "v2",
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.ListRecentInScopeAsync(scope, 10_000, It.IsAny<CancellationToken>()))
            .ReturnsAsync([readyForCommit, committed]);

        Mock<IAzureExtractorPackageRepository> extractorPackages = new();
        extractorPackages
            .Setup(r => r.TryGetLatestCollectionTimestampUtcInScopeAsync(scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync((DateTime?)null);

        PilotScorecardBuilder sut = new(
            runs.Object,
            extractorPackages.Object,
            scopeProvider.Object,
            NullLogger<PilotScorecardBuilder>.Instance);

        DateTimeOffset start = new(2026, 4, 15, 0, 0, 0, TimeSpan.Zero);
        DateTimeOffset end = start.AddDays(1);

        PilotScorecardSummary summary = await sut.BuildAsync(start, end, CancellationToken.None);

        summary.RunsInPeriod.Should().Be(2);
        summary.RunsWithCommittedManifest.Should().Be(1);
    }
}
