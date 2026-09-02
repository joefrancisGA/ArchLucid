using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Wave-4 suggestion 39: fail closed at run create / draft spawn when structural mode cannot seal.
/// </summary>
public static class StructuralExecutionModeAdmittanceGuard
{
    public static IReadOnlyList<string> GetBlockingReasons(StructuralExecutionMode mode)
    {
        return StructuralExecutionModeCommitGuard.GetBlockingReasons(mode);
    }

    public static void EnsureAdmittableOrThrow(StructuralExecutionMode mode)
    {
        IReadOnlyList<string> reasons = GetBlockingReasons(mode);

        if (reasons.Count == 0)
            return;

        throw new InvalidOperationException(string.Join("; ", reasons));
    }
}
