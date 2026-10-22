using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Repositories;

internal static partial class RunRepositoryCore
{
    /// <summary>
    ///     Mirrors <c>SqlRunRepository.ListByArchitectureIdAsync</c> inline column projection; warning flags are detail-read only.
    /// </summary>
    internal static RunRecord ForArchitectureListProjection(RunRecord source)
    {
        ArgumentNullException.ThrowIfNull(source);

        return new RunRecord
        {
            RunId = source.RunId,
            TenantId = source.TenantId,
            WorkspaceId = source.WorkspaceId,
            ScopeProjectId = source.ScopeProjectId,
            ProjectId = source.ProjectId,
            Description = source.Description,
            PackageOrigin = source.PackageOrigin,
            ArchitectureId = source.ArchitectureId,
            ArchitectureVersionId = source.ArchitectureVersionId,
            CreatedUtc = source.CreatedUtc,
            ArchivedUtc = source.ArchivedUtc,
            LegacyRunStatus = source.LegacyRunStatus,
            CurrentManifestVersion = source.CurrentManifestVersion,
            GoldenManifestId = source.GoldenManifestId,
            HasWarnings = false,
            HasGovernanceWarnings = false,
        };
    }
}
