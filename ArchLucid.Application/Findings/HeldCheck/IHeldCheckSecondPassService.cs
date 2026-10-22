using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Findings.HeldCheck;

/// <summary>Regenerates findings after inventory ingest when a run is still pre-commit (DX-60).</summary>
public interface IHeldCheckSecondPassService
{
    Task<HeldCheckSecondPassResult> TryRunAsync(
        ScopeContext scope,
        Guid runId,
        HeldCheckInputCode inputCode,
        Guid ingestedPackageId,
        CancellationToken cancellationToken);
}
