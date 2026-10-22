using ArchLucid.Application;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using Moq;

namespace ArchLucid.TestSupport.SealedManifest;

/// <summary>
///     Authority/manifest-hash doubles so sealed-manifest guards pass in unit tests.
/// </summary>
public static class SealedManifestHashTestSupport
{
    public const string DefaultHash = "sealed-manifest-hash-for-unit-tests";

    public static IAuthorityQueryService CreateAuthorityQueryServiceForAnyRun(string? computedHash = null)
    {
        string hash = computedHash ?? DefaultHash;

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(query => query.GetRunDetailForManifestCompareAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, Guid runId, CancellationToken _) =>
            {
                Guid manifestId = Guid.NewGuid();

                return new RunDetailDto
                {
                    Run = new RunRecord
                    {
                        RunId = runId,
                        GoldenManifestId = manifestId,
                        LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                    },
                    GoldenManifest = new ManifestDocument
                    {
                        ManifestId = manifestId,
                        RunId = runId,
                        ManifestHash = hash,
                    },
                };
            });

        authority
            .Setup(query => query.GetRunDetailAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<bool>()))
            .ReturnsAsync((ScopeContext _, Guid runId, CancellationToken _, bool _) =>
            {
                Guid manifestId = Guid.NewGuid();

                return new RunDetailDto
                {
                    Run = new RunRecord
                    {
                        RunId = runId,
                        GoldenManifestId = manifestId,
                        LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                    },
                    GoldenManifest = new ManifestDocument
                    {
                        ManifestId = manifestId,
                        RunId = runId,
                        ManifestHash = hash,
                    },
                };
            });

        return authority.Object;
    }

    public static IManifestHashService CreateManifestHashService(string? computedHash = null)
    {
        string hash = computedHash ?? DefaultHash;

        Mock<IManifestHashService> manifestHash = new();
        manifestHash
            .Setup(service => service.ComputeHash(It.IsAny<ManifestDocument>()))
            .Returns(hash);

        return manifestHash.Object;
    }

    public static IRunDetailQueryService CreateRunDetailQueryServiceWithoutCommittedRuns()
    {
        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(service => service.ListRunSummariesKeysetAsync(
                It.IsAny<string?>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((Array.Empty<RunSummary>(), false, (string?)null));

        return runDetails.Object;
    }
}
