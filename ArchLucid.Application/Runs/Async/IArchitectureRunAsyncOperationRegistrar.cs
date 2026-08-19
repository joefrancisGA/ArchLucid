using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Runs.Async;

/// <summary>Tracks accepted async operations so duplicate accepts fail closed (TB-2075).</summary>
public interface IArchitectureRunAsyncOperationRegistrar
{
    /// <summary>Returns <see langword="false" /> when the same scope/run/kind is already in flight.</summary>
    bool TryRegister(
        ScopeContext scope,
        string runId,
        ArchitectureRunAsyncOperationKind kind);

    void Release(ScopeContext scope, string runId, ArchitectureRunAsyncOperationKind kind);
}
