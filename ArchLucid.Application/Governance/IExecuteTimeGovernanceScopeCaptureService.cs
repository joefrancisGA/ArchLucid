using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Governance;

/// <summary>Persists execute-time effective governance scope onto <c>dbo.Runs.GovernanceScopeJson</c>.</summary>
public interface IExecuteTimeGovernanceScopeCaptureService
{
    Task TryCaptureAndPersistAsync(
        string runId,
        ArchitectureRequest request,
        CancellationToken cancellationToken = default);
}
