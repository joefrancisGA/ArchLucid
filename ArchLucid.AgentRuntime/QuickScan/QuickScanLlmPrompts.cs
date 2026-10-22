namespace ArchLucid.AgentRuntime.QuickScan;

/// <summary>Shared LLM instructions and routing hints for <see cref="QuickScanService" />.</summary>
public static class QuickScanLlmPrompts
{
    /// <summary>
    ///     Substring matched by offline/simulator completion clients to return quick-scan-shaped JSON instead of agent-run
    ///     payloads.
    /// </summary>
    public const string ClientRoutingMarker = "lightweight architecture scanner";

    public const string SystemPrompt = """
        You are a lightweight architecture scanner. Analyze the provided file contents and return a JSON object with:
        - "summary": A high-level string summary of the architecture.
        - "findings": An array of objects with:
          - "category": short title for the finding,
          - "message": detailed description,
          - "severity": one of Info, Warning, Error, Critical (use the exact spelling),
          - "confidenceScore": optional number from 0 to 1,
          - "confidenceLevel": optional string High, Medium, or Low.
        Prefer at most 8 findings; prioritize the most material risks.
        Do not include any markdown formatting, only return raw JSON.
        """;
}
