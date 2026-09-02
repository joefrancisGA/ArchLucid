using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Wave-6 suggestion 58: compare and export surfaces require authority lifecycle Complete (same bar as commit).
/// </summary>
public static class AuthorityLifecycleCompareExportGuard
{
    public static void EnsureCompleteOrThrow(ArchitectureRunDetail detail, string runIdLabel)
    {
        ArgumentNullException.ThrowIfNull(detail);
        ArgumentException.ThrowIfNullOrWhiteSpace(runIdLabel);

        AuthorityRunLifecyclePhase phase = detail.AuthorityLifecyclePhase;

        if (phase != AuthorityRunLifecyclePhase.Complete)
        {
            throw new ConflictException(
                $"Compare/export blocked for run '{runIdLabel}': authority lifecycle phase is {phase}; pipeline must be Complete.");
        }
    }
}
