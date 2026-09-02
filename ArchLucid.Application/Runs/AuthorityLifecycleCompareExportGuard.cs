using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Wave-6 suggestion 58 / wave-7 suggestion 64: compare and export surfaces require authority lifecycle Complete.
/// </summary>
public static class AuthorityLifecycleCompareExportGuard
{
    public static void EnsureCompleteOrThrow(ArchitectureRunDetail detail, string runIdLabel)
    {
        ArgumentNullException.ThrowIfNull(detail);
        EnsureCompleteOrThrow(detail.AuthorityLifecyclePhase, runIdLabel);
    }

    public static void EnsureCompleteOrThrow(AuthorityRunLifecyclePhase phase, string runIdLabel)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runIdLabel);

        if (phase != AuthorityRunLifecyclePhase.Complete)
        {
            throw new ConflictException(
                $"Compare/export blocked for run '{runIdLabel}': authority lifecycle phase is {phase}; pipeline must be Complete.");
        }
    }
}
