namespace ArchLucid.Decisioning.Interfaces;

/// <summary>
///     Minimal JSON completion seam for typed finding payload generation and remediation retries.
/// </summary>
public interface IFindingPayloadJsonCompletionClient
{
    Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken);
}
