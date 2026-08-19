namespace ArchLucid.Application.Architecture;

/// <summary>
///     System prompt text mirrored from <c>ArchLucid.AgentRuntime.QuickScan.QuickScanLlmPrompts</c> for token estimation.
/// </summary>
internal static class QuickScanLlmSystemPrompt
{
    internal const string Text = """
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
