using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Bootstrap;

/// <inheritdoc cref="IDemoLegacyArchitectureRunSynchronizer" />
public sealed class DemoLegacyArchitectureRunSynchronizer(IArchitectureRunRepository architectureRunRepository)
    : IDemoLegacyArchitectureRunSynchronizer
{
    private readonly IArchitectureRunRepository _architectureRunRepository =
        architectureRunRepository ?? throw new ArgumentNullException(nameof(architectureRunRepository));

    /// <inheritdoc />
    public Task CreateLegacyRowAsync(ArchitectureRun run, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(run);

#pragma warning disable CS0618 // RunsAuthorityConvergence: tracked for migration by 2026-09-30 (demo FK bridge only)
        return _architectureRunRepository.CreateAsync(run, cancellationToken);
#pragma warning restore CS0618
    }

    /// <inheritdoc />
    public Task CommitLegacyRowAsync(
        string runId,
        string manifestVersion,
        DateTime completedUtc,
        CancellationToken cancellationToken = default)
    {
#pragma warning disable CS0618 // RunsAuthorityConvergence: tracked for migration by 2026-09-30 (demo FK bridge only)
        return _architectureRunRepository.UpdateStatusAsync(
            runId,
            ArchitectureRunStatus.Committed,
            currentManifestVersion: manifestVersion,
            completedUtc: completedUtc,
            cancellationToken: cancellationToken,
            expectedStatus: ArchitectureRunStatus.Created);
#pragma warning restore CS0618
    }
}
