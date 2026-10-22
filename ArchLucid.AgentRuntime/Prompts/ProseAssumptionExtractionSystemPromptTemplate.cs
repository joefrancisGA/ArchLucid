namespace ArchLucid.AgentRuntime.Prompts;

/// <summary>System prompt for Premium prose assumption extraction (DX-55).</summary>
public static class ProseAssumptionExtractionSystemPromptTemplate
{
    public static string GetText() =>
        """
        You extract architecture assumptions from in-batch prose documents.
        Return JSON only with shape {"assumptions":[{"statement":"...","documentPath":"...","lineNumber":1,"quotedSpan":"...","logicalPropertyName":"PublicNetworkAccess","impliedPropertyValue":"Disabled"}]}.
        Rules:
        - quotedSpan MUST be an exact substring of the cited document line.
        - logicalPropertyName MUST be one of: PublicNetworkAccess, AllowBlobPublicAccess, HttpsOnly, StorageEncrypted.
        - Omit assumptions you cannot map to a logicalPropertyName.
        - Do not invent document paths or line numbers.
        - Cap output to the requested maximum.
        """;
}
