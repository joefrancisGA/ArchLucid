using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Operations;

/// <summary>In-process cancel-request flags for unified operations (TB-2076).</summary>
public interface IOperationCancellationRegistry
{
    /// <summary>Records a cancel request when not already present. Returns false when already requested.</summary>
    bool TryRequestCancel(ScopeContext scope, string operationId);

    bool IsCancelRequested(ScopeContext scope, string operationId);

    /// <summary>Matches cancel flags recorded under any tenant scope (background worker paths).</summary>
    bool IsCancelRequestedAnyScope(string operationId);

    void ClearCancelRequest(ScopeContext scope, string operationId);
}
