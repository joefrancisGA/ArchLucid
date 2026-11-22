using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

/// <summary>In-memory hosts: audit framework catalogs are not persisted to SQL.</summary>
public sealed class NoOpAuditFrameworkRepository : IAuditFrameworkRepository
{
    public Task<AuditFrameworkImportResult> ImportAsync(
        Guid tenantId,
        AuditFrameworkRecord framework,
        IReadOnlyList<AuditControlRecord> controls,
        IReadOnlyDictionary<Guid, IReadOnlyDictionary<string, string>> metadataByControlId,
        IReadOnlyList<AuditEvidenceRequirementRecord> requirements,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(new AuditFrameworkImportResult { Succeeded = true, FrameworkId = framework.FrameworkId });
    }

    public Task<AuditFrameworkRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid frameworkId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult<AuditFrameworkRecord?>(null);
    }

    public Task<IReadOnlyList<AuditControlRecord>> ListControlsAsync(
        Guid tenantId,
        Guid frameworkId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult<IReadOnlyList<AuditControlRecord>>(Array.Empty<AuditControlRecord>());
    }
}
