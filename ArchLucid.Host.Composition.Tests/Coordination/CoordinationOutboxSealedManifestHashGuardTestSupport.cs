using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.DependencyInjection;

using Moq;

namespace ArchLucid.Host.Composition.Tests.Coordination;

/// <summary>
///     Wires <see cref="IManifestHashService" /> and manifest-compare query mocks required by wave-33/34 outbox sealed-hash guards.
/// </summary>
internal static class CoordinationOutboxSealedManifestHashGuardTestSupport
{
    public static ManifestDocument CreateGoldenManifest(Guid runId, string manifestHash = "sealed-outbox-test-hash")
    {
        return new ManifestDocument
        {
            ManifestId = Guid.NewGuid(),
            RunId = runId,
            ManifestHash = manifestHash,
        };
    }

    public static void RegisterSealedManifestGuardServices(
        ServiceCollection services,
        Guid runId,
        string manifestHash = "sealed-outbox-test-hash")
    {
        ManifestDocument goldenManifest = CreateGoldenManifest(runId, manifestHash);

        Mock<IAuthorityQueryService> authority = new();
        SetupManifestCompareForGuard(authority, runId, goldenManifest);

        Mock<IManifestHashService> manifestHashService = new();
        manifestHashService
            .Setup(service => service.ComputeHash(It.IsAny<ManifestDocument>()))
            .Returns(manifestHash);

        services.AddScoped(_ => authority.Object);
        services.AddScoped(_ => manifestHashService.Object);
    }

    public static void SetupManifestCompareForGuard(
        Mock<IAuthorityQueryService> authorityQuery,
        Guid runId,
        ManifestDocument goldenManifest)
    {
        authorityQuery
            .Setup(query => query.GetRunDetailForManifestCompareAsync(
                It.IsAny<ScopeContext>(),
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = runId },
                GoldenManifest = goldenManifest,
            });
    }

    public static void RegisterManifestHashService(
        ServiceCollection services,
        string manifestHash = "sealed-outbox-test-hash")
    {
        Mock<IManifestHashService> manifestHashService = new();
        manifestHashService
            .Setup(service => service.ComputeHash(It.IsAny<ManifestDocument>()))
            .Returns(manifestHash);

        services.AddScoped(_ => manifestHashService.Object);
    }
}
