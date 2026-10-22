using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Exports;

/// <summary>Wave-35 suggestion 413: board export execution-mode honesty for Fallback, Mixed, and simulator substitution.</summary>
public static class BoardExportExecutionModeNoticeResolver
{
    public static (string? Title, string? Body) TryGetNotice(ArchitectureRun run)
    {
        ArgumentNullException.ThrowIfNull(run);

        if (run.StructuralExecutionMode == StructuralExecutionMode.Simulator)
        {
            return (SimulatorModeExportRehearsalMarkdown.NoticeTitle, SimulatorModeExportRehearsalMarkdown.NoticeBody);
        }

        if (run.StructuralExecutionMode == StructuralExecutionMode.Fallback)
        {
            return (
                "Fallback execution mode — not unqualified live AI",
                "This review recorded fallback from a real model path to simulator substitution. Treat outputs as rehearsal until you validate per-agent traces.");
        }

        if (run.StructuralExecutionMode == StructuralExecutionMode.Mixed)
        {
            return (
                "Mixed execution mode — review per-agent traces",
                "This review used mixed real and simulator agent paths. Review per-agent traces before sponsor send.");
        }

        if (run.RealModeFellBackToSimulator)
        {
            return (
                "Simulator substitution recorded",
                "This run recorded fallback from a real model path. Do not describe outputs as unqualified live-model proof.");
        }

        return (null, null);
    }
}
