using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Repositories;

internal static partial class RunRepositoryCore
{
    /// <summary>
    ///     Mirrors <c>SqlRunRepository.ListWithNullArchitectureIdAsync</c> inline column projection; warning flags are detail-read only.
    /// </summary>
    internal static RunRecord ForNullArchitectureBackfillListProjection(RunRecord source)
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
            ArchitectureRequestId = source.ArchitectureRequestId,
            KnowledgeModelId = source.KnowledgeModelId,
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
