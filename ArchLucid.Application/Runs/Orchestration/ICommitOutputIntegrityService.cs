using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>Pre-commit output integrity checks (TB-2226 / TB-2227).</summary>
public interface ICommitOutputIntegrityService
{
    Task EnsurePassOrThrowAsync(
        ArchitectureRun run,
        string runId,
        FindingsSnapshot findings,
        CancellationToken cancellationToken = default);
}
