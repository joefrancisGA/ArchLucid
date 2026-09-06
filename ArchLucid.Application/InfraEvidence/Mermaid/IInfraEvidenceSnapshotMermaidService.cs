using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

public interface IInfraEvidenceSnapshotMermaidService
{
    Task<InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidPreviewResponse>> TryGetPreviewAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default);

    Task<InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidRenderResponse>> TryGetMermaidAsync(
        ScopeContext scope,
        Guid snapshotId,
        string? mode,
        string? fallbackKey,
        string? seedNodeId,
        CancellationToken cancellationToken = default);

    Task<InfraEvidenceMermaidServiceResult<byte[]>> TryExportPngAsync(
        ScopeContext scope,
        Guid snapshotId,
        string? mode,
        string? fallbackKey,
        string? seedNodeId,
        CancellationToken cancellationToken = default);
}

public sealed class InfraEvidenceMermaidServiceResult<T>
{
    public bool Succeeded
    {
        get;
        init;
    }

    public T? Value
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }

    public bool IsNotFound
    {
        get;
        init;
    }

    public bool IsBadRequest
    {
        get;
        init;
    }
}
