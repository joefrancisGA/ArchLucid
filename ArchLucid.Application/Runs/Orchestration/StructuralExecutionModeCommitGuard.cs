using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Wave-3 suggestion 30: blocks decision-grade commit when structural execution mode is not Real or Simulator-only.
/// </summary>
public static class StructuralExecutionModeCommitGuard
{
    public static IReadOnlyList<string> GetBlockingReasons(StructuralExecutionMode mode)
    {
        if (mode is StructuralExecutionMode.Mixed or StructuralExecutionMode.Fallback)
        {
            return
            [
                $"StructuralExecutionMode is {mode}; decision-grade golden manifest commit requires Simulator or Real-only execution.",
            ];
        }

        return [];
    }
}
