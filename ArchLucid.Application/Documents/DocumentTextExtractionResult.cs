namespace ArchLucid.Application.Documents;

/// <summary>Outcome of <see cref="IDocumentTextExtractionService.ExtractAsync" />.</summary>
public sealed class DocumentTextExtractionResult
{
    public bool Succeeded { get; init; }

    public string FileName { get; init; } = string.Empty;

    public string ContentType { get; init; } = string.Empty;

    public string Text { get; init; } = string.Empty;

    public int CharacterCount { get; init; }

    public bool Truncated { get; init; }

    public string? FailureDetail { get; init; }

    public static DocumentTextExtractionResult Fail(string failureDetail)
    {
        return new DocumentTextExtractionResult
        {
            Succeeded = false,
            FailureDetail = failureDetail,
        };
    }
}
