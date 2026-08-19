using System.Linq;

using ArchLucid.Contracts.Agents;

using ArchLucid.Contracts.Common;



namespace ArchLucid.Application.Agents;



/// <summary>Projects redacted invocation rows from persisted agent execution traces (TB-110).</summary>

public static class RunToolInvocationForensicsBuilder

{

    private const int ArgsPreviewMaxChars = 160;



    private const string TraceDerivedDisclaimer =

        "Rows are derived from persisted LLM execution traces, not a structured tool-call ledger. " +

        "Argument previews are truncated user-turn prompts; do not treat them as external API payloads.";



    private const string StructuredDisclaimer =

        "Rows are loaded from the structured tool-invocation ledger captured at trace persistence time.";



    public static RunToolInvocationForensicsResponse Build(

        string runId,

        IReadOnlyList<AgentExecutionTrace> traces,

        IReadOnlyList<AgentToolInvocationRecord>? structuredRecords = null)

    {

        if (string.IsNullOrWhiteSpace(runId))

            throw new ArgumentException("runId is required.", nameof(runId));



        ArgumentNullException.ThrowIfNull(traces);



        if (structuredRecords is { Count: > 0 })

            return BuildFromStructured(runId, structuredRecords, traces);



        return BuildFromTraces(runId, traces);

    }



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

                    AgentType = trace.AgentType.ToString(),

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



    private static string InferAgentTypeLabel(string toolName)

    {

        if (toolName.EndsWith("-agent", StringComparison.Ordinal))

            return toolName[..^6];



        return toolName;

    }



    private static string FormatToolName(AgentType agentType) => agentType switch

    {

        AgentType.Topology => "topology-agent",

        AgentType.Cost => "cost-agent",

        AgentType.Compliance => "compliance-agent",

        AgentType.Critic => "critic-agent",

        _ => $"{agentType}-agent",

    };



    private static string TruncatePreview(string? raw)

    {

        if (string.IsNullOrWhiteSpace(raw))

            return "—";



        string trimmed = raw.Trim().ReplaceLineEndings(" ");



        if (trimmed.Length <= ArgsPreviewMaxChars)

            return trimmed;



        return trimmed[..ArgsPreviewMaxChars] + "…";

    }



    private static string? BuildCompletenessNote(AgentExecutionTrace trace)

    {

        if (trace.BlobUploadFailed == true)

            return "Full prompt/response blobs may be missing (blobUploadFailed).";



        if (trace.InlineFallbackFailed == true)

            return "Inline SQL fallback for full trace text failed or was incomplete.";



        if (!trace.ParseSucceeded && !string.IsNullOrWhiteSpace(trace.ErrorMessage))

            return trace.ErrorMessage.Trim();



        return null;

    }

}


