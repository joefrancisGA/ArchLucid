using ArchLucid.Contracts.Agents;

namespace ArchLucid.Application.Agents;

public static partial class RunToolInvocationForensicsBuilder
{
    private static RunToolInvocationForensicsResponse BuildFromStructured(
        string runId,
        IReadOnlyList<AgentToolInvocationRecord> structuredRecords,
        IReadOnlyList<AgentExecutionTrace> traces)
    {
        List<RunToolInvocationForensicRow> rows = structuredRecords
            .OrderBy(static r => r.InvokedAtUtc)
            .ThenBy(static r => r.SortOrder)
            .ThenBy(static r => r.TraceId, StringComparer.Ordinal)
            .Select(
                static r => new RunToolInvocationForensicRow
                {
                    TraceId = r.TraceId,
                    TaskId = r.TaskId,
                    AgentType = InferAgentTypeLabel(r.ToolName),
                    ToolName = r.ToolName,
                    ArgsPreview = r.ArgsPreview,
                    Outcome = r.Outcome,
                    DurationMs = r.DurationMs,
                    BlobUploadFailed = r.BlobUploadFailed,
                    CompletenessNote = r.CompletenessNote,
                    InvokedAtUtc = r.InvokedAtUtc,
                })
            .ToList();

        bool blobFailed = rows.Exists(static r => r.BlobUploadFailed == true)
            || traces.Any(static t => t.BlobUploadFailed == true);

        return new RunToolInvocationForensicsResponse
        {
            RunId = runId.Trim(),
            HasStructuredToolCallLog = true,
            HasTraceBlobPersistenceFailure = blobFailed,
            CompletenessDisclaimer = StructuredDisclaimer,
            Rows = rows,
        };
    }
}
