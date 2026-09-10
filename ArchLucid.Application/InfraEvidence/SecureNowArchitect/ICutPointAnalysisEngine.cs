using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public interface ICutPointAnalysisEngine
{
    Task<CutPointAnalysisEngineResult> RunAsync(
        ScopeContext scope,
        Guid snapshotId,
        string actorId,
        CancellationToken cancellationToken = default);
}

public sealed class CutPointAnalysisEngineResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }

    public int CutPointsDiscovered
    {
        get;
        init;
    }
}
