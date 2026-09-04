using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Application.Runs;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Coordination.Compare;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Unit tests for <see cref="AuthorityCompareController" /> problem responses (no full host).
/// </summary>
[Trait("Category", "Unit")]
public sealed class AuthorityCompareControllerTests
{
    [SkippableFact]
    public async Task CompareManifests_returns_409_when_manifests_exist_in_different_scopes()
    {
        Guid leftManifestId = Guid.NewGuid();
        Guid rightManifestId = Guid.NewGuid();
        Guid leftRunId = Guid.NewGuid();
        Guid rightRunId = Guid.NewGuid();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid()
        };

        byte[] pin = [0x01, 0x02, 0x03];
        List<CommittedArtifactInventoryEntry> inventory =
        [
            new()
            {
                ArtifactName = "decision-trace",
                ContentHashSha256 = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
                ContentType = "application/json",
                Producer = "test",
                CapturedUtc = DateTime.UtcNow,
            },
        ];

        ManifestDocument leftManifest = new()
        {
            ManifestId = leftManifestId,
            RunId = leftRunId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            CommittedArtifactInventory = inventory,
        };

        ManifestDocument rightManifest = new()
        {
            ManifestId = rightManifestId,
            RunId = rightRunId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            CommittedArtifactInventory = inventory,
        };

        RunRecord leftHeader = CreatePinnedRunHeader(leftRunId, pin);
        RunRecord rightHeader = CreatePinnedRunHeader(rightRunId, pin);

        Mock<IAuthorityCompareService> compare = new();
        compare
            .Setup(c => c.CompareManifestsAsync(scope, leftManifestId, rightManifestId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Cannot compare manifests across different scopes."));

        Mock<IGoldenManifestRepository> manifests = new();
        manifests
            .Setup(m => m.GetByIdAsync(scope, leftManifestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(leftManifest);
        manifests
            .Setup(m => m.GetByIdAsync(scope, rightManifestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(rightManifest);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(scope, leftRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(leftHeader);
        runs
            .Setup(r => r.GetByIdAsync(scope, rightRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(rightHeader);

        Mock<IScopeContextProvider> scopes = new();
        scopes.Setup(s => s.GetCurrentScope()).Returns(scope);

        AuthorityCompareController controller = new(
            compare.Object,
            manifests.Object,
            runs.Object,
            scopes.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult action =
            await controller.CompareManifests(leftManifestId, rightManifestId, CancellationToken.None);

        ObjectResult obj = action.Should().BeOfType<ObjectResult>().Subject;
        obj.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }

    private static RunRecord CreatePinnedRunHeader(Guid runId, byte[] pin) =>
        new()
        {
            RunId = runId,
            PinnedPolicyPackIdsHashSha256 = pin,
            PinnedEvidencePackagePinsHashSha256 = pin,
            PinnedArchitectureVersionContentHashSha256 = pin,
            PinnedKnowledgeModelContentHashSha256 = pin,
        };
}
