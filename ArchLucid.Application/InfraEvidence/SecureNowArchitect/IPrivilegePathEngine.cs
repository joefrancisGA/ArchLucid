using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public interface IPrivilegePathEngine
{
    Task<PrivilegePathEngineResult> RunAsync(
        ScopeContext scope,
        Guid snapshotId,
        string actorId,
        CancellationToken cancellationToken = default,
        SecureNowArchitectEngineRunScope? runScope = null);
}

public sealed class PrivilegePathEngineResult
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

    public int PathsDiscovered
    {
        get;
        init;
    }

    public int PathsPersisted
    {
        get;
        init;
    }

    public int FindingsIngested
    {
        get;
        init;
    }

    public int FindingsDeduplicated
    {
        get;
        init;
    }
}
