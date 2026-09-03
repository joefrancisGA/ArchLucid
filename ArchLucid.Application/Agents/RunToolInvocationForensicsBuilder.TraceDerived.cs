using ArchLucid.Contracts.Agents;

namespace ArchLucid.Application.Agents;

public static partial class RunToolInvocationForensicsBuilder
{
    private static RunToolInvocationForensicsResponse BuildFromTraces(string runId, IReadOnlyList<AgentExecutionTrace> traces)
    {
        List<AgentExecutionTrace> ordered = traces
            .OrderBy(static t => t.CreatedUtc)
            .ThenBy(static t => t.TraceId, StringComparer.Ordinal)
            .ToList();

        DateTime? priorUtc = null;
        List<RunToolInvocationForensicRow> rows = new(ordered.Count);

        foreach (AgentExecutionTrace trace in ordered)
        {
            int? durationMs = null;

            if (priorUtc.HasValue)
            {
                double deltaMs = (trace.CreatedUtc - priorUtc.Value).TotalMilliseconds;

                if (deltaMs >= 0 && deltaMs <= int.MaxValue)
                    durationMs = (int)Math.Round(deltaMs);
            }

            priorUtc = trace.CreatedUtc;

            rows.Add(
                new RunToolInvocationForensicRow
                {
                    TraceId = trace.TraceId,
                    TaskId = trace.TaskId,
                    AgentType = InferAgentTypeLabel(FormatToolName(trace.AgentType)),
                    ToolName = FormatToolName(trace.AgentType),
                    ArgsPreview = TruncatePreview(trace.UserPrompt),
                    Outcome = trace.ParseSucceeded ? "Succeeded" : "Failed",
                    DurationMs = durationMs,
                    BlobUploadFailed = trace.BlobUploadFailed == true,
                    CompletenessNote = BuildCompletenessNote(trace),
                    InvokedAtUtc = trace.CreatedUtc,
                });
        }

        bool blobFailed = ordered.Exists(static t => t.BlobUploadFailed == true);

        return new RunToolInvocationForensicsResponse
        {
            RunId = runId.Trim(),
            HasStructuredToolCallLog = false,
            HasTraceBlobPersistenceFailure = blobFailed,
            CompletenessDisclaimer = TraceDerivedDisclaimer,
            Rows = rows,
        };
    }
}
