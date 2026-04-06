namespace ArchLucid.AgentRuntime;

/// <summary>
/// How outbound LLM HTTP calls are authenticated. Does not carry secrets — only describes the scheme for operators and future routing.
/// </summary>
public enum LlmProviderAuthScheme
{
    /// <summary>Unspecified or not yet classified.</summary>
    Unknown = 0,

    /// <summary>No network (echo, fake, deterministic simulator) or anonymous local endpoint.</summary>
    None = 1,

    /// <summary>API key in header (Azure OpenAI, many hosted APIs).</summary>
    ApiKey = 2,

    /// <summary>OAuth2 bearer token.</summary>
    Bearer = 3,

    /// <summary>AWS Signature Version 4 (e.g. Amazon Bedrock).</summary>
    AwsSigV4 = 4,
}
