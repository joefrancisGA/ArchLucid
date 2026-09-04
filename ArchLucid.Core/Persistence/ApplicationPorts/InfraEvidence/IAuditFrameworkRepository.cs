using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AuditFrameworkImportResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public bool WasIdempotentReplay
    {
        get;
        init;
    }

    public Guid? FrameworkId
    {
        get;
        init;
    }

    public string? ErrorCode
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }
}

public interface IAuditFrameworkRepository
{
    Task<AuditFrameworkImportResult> ImportAsync(
        Guid tenantId,
        AuditFrameworkRecord framework,
        IReadOnlyList<AuditControlRecord> controls,
        IReadOnlyDictionary<Guid, IReadOnlyDictionary<string, string>> metadataByControlId,
        CancellationToken cancellationToken = default);

    Task<AuditFrameworkRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid frameworkId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditControlRecord>> ListControlsAsync(
        Guid tenantId,
        Guid frameworkId,
        CancellationToken cancellationToken = default);
}
