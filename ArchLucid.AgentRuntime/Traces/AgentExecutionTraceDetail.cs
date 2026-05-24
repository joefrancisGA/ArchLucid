using ArchLucid.Contracts.Agents;

namespace ArchLucid.AgentRuntime.Traces;

/// <summary>
///     Runtime-only forensic fields for one agent LLM call. Merged with <see cref="AgentExecutionTraceSummary" /> when
///     persisting full <see cref="AgentExecutionTrace" /> JSON.
/// </summary>
public sealed class AgentExecutionTraceDetail
{
    public string SystemPrompt
    {
        get;
        set;
    } = string.Empty;

    public string UserPrompt
    {
        get;
        set;
    } = string.Empty;

    public string RawResponse
    {
        get;
        set;
    } = string.Empty;

    public string? ParsedResultJson
    {
        get;
        set;
    }

    public string? ErrorMessage
    {
        get;
        set;
    }

    public string? FailureReasonCode
    {
        get;
        set;
    }

    public string? PromptTemplateId
    {
        get;
        set;
    }

    public string? PromptTemplateVersion
    {
        get;
        set;
    }

    public string? SystemPromptContentSha256
    {
        get;
        set;
    }

    public string? PromptReleaseLabel
    {
        get;
        set;
    }

    public string? FullSystemPromptBlobKey
    {
        get;
        set;
    }

    public string? FullUserPromptBlobKey
    {
        get;
        set;
    }

    public string? FullResponseBlobKey
    {
        get;
        set;
    }

    public string? ModelVersion
    {
        get;
        set;
    }

    public bool? BlobUploadFailed
    {
        get;
        set;
    }

    public bool? InlineFallbackFailed
    {
        get;
        set;
    }

    public string? FullSystemPromptInline
    {
        get;
        set;
    }

    public string? FullUserPromptInline
    {
        get;
        set;
    }

    public string? FullResponseInline
    {
        get;
        set;
    }

    public IEnumerable<Citation>? Citations
    {
        get;
        set;
    }

    public static AgentExecutionTraceDetail FromTrace(AgentExecutionTrace trace)
    {
        ArgumentNullException.ThrowIfNull(trace);

        return new AgentExecutionTraceDetail
        {
            SystemPrompt = trace.SystemPrompt,
            UserPrompt = trace.UserPrompt,
            RawResponse = trace.RawResponse,
            ParsedResultJson = trace.ParsedResultJson,
            ErrorMessage = trace.ErrorMessage,
            FailureReasonCode = trace.FailureReasonCode,
            PromptTemplateId = trace.PromptTemplateId,
            PromptTemplateVersion = trace.PromptTemplateVersion,
            SystemPromptContentSha256 = trace.SystemPromptContentSha256,
            PromptReleaseLabel = trace.PromptReleaseLabel,
            FullSystemPromptBlobKey = trace.FullSystemPromptBlobKey,
            FullUserPromptBlobKey = trace.FullUserPromptBlobKey,
            FullResponseBlobKey = trace.FullResponseBlobKey,
            ModelVersion = trace.ModelVersion,
            BlobUploadFailed = trace.BlobUploadFailed,
            InlineFallbackFailed = trace.InlineFallbackFailed,
            FullSystemPromptInline = trace.FullSystemPromptInline,
            FullUserPromptInline = trace.FullUserPromptInline,
            FullResponseInline = trace.FullResponseInline,
            Citations = trace.Citations,
        };
    }

    public void ApplyTo(AgentExecutionTrace trace)
    {
        ArgumentNullException.ThrowIfNull(trace);

        trace.SystemPrompt = SystemPrompt;
        trace.UserPrompt = UserPrompt;
        trace.RawResponse = RawResponse;
        trace.ParsedResultJson = ParsedResultJson;
        trace.ErrorMessage = ErrorMessage;
        trace.FailureReasonCode = FailureReasonCode;
        trace.PromptTemplateId = PromptTemplateId;
        trace.PromptTemplateVersion = PromptTemplateVersion;
        trace.SystemPromptContentSha256 = SystemPromptContentSha256;
        trace.PromptReleaseLabel = PromptReleaseLabel;
        trace.FullSystemPromptBlobKey = FullSystemPromptBlobKey;
        trace.FullUserPromptBlobKey = FullUserPromptBlobKey;
        trace.FullResponseBlobKey = FullResponseBlobKey;
        trace.ModelVersion = ModelVersion;
        trace.BlobUploadFailed = BlobUploadFailed;
        trace.InlineFallbackFailed = InlineFallbackFailed;
        trace.FullSystemPromptInline = FullSystemPromptInline;
        trace.FullUserPromptInline = FullUserPromptInline;
        trace.FullResponseInline = FullResponseInline;
        trace.Citations = Citations;
    }
}
