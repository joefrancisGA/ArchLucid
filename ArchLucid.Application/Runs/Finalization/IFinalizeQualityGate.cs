using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Runs.Finalization;

/// <summary>Server-side finalize quality scorecard gate (TB-2321); throws <c>ConflictException</c> when blocked.</summary>
public interface IFinalizeQualityGate
{
    Task EnsurePassOrThrowAsync(
        ScopeContext scope,
        ArchitectureRequest request,
        FindingsSnapshot findings,
        CancellationToken cancellationToken = default);
}
