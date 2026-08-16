using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>Pre-commit output integrity checks (TB-2226 / TB-2227).</summary>
public interface ICommitOutputIntegrityService
{
    Task EnsurePassOrThrowAsync(
        ArchitectureRun run,
        string runId,
        FindingsSnapshot findings,
        ArchitectureRequest architectureRequest,
        IReadOnlyList<string>? acknowledgedAssumptionIds,
        CancellationToken cancellationToken = default);
}
