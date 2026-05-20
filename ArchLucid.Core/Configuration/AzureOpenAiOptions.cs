using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Core.Configuration;

[ExcludeFromCodeCoverage(Justification = "Configuration binding DTO with no logic.")]
public sealed class AzureOpenAiOptions
{
    public const string SectionName = "AzureOpenAI";

    /// <summary>Used when <c>AzureOpenAI:MaxCompletionTokens</c> is omitted or zero.</summary>
    public const int DefaultMaxCompletionTokens = 4096;

    public string Endpoint
    {
        get;
        set;
    } = string.Empty;

    public string ApiKey
    {
        get;
        set;
    } = string.Empty;

    public string DeploymentName
    {
        get;
        set;
    } = string.Empty;

    /// <summary>
    ///     Hard cap on model output tokens per completion (maps to <c>MaxOutputTokenCount</c> on the chat request).
    ///     When unset or zero, <see cref="DefaultMaxCompletionTokens" /> is used so deployments are never unbounded by default.
    /// </summary>
    public int MaxCompletionTokens
    {
        get;
        set;
    }

    /// <summary>
    ///     When <see langword="true" />, agent completions request Azure OpenAI structured outputs using
    ///     <c>json_schema</c> derived from <see cref="ArchLucid.Decisioning.Validation.SchemaValidationOptions.AgentResultSchemaPath" />.
    ///     When the service returns HTTP 400 (unsupported schema or deployment), the client falls back to JSON object mode.
    /// </summary>
    public bool UseJsonSchemaResponseFormat
    {
        get;
        set;
    }

    /// <summary>
    ///     Polly retry attempts for Azure OpenAI completion calls. When zero, falls back to
    ///     <c>AgentExecution:Resilience:LlmCallMaxRetryAttempts</c>.
    /// </summary>
    public int MaxRetries
    {
        get;
        set;
    } = 3;
}
