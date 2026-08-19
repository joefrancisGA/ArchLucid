using System.Text.RegularExpressions;

using ArchLucid.Core.Llm.Redaction;

namespace ArchLucid.Retrieval.FineTuning.Redaction;

/// <summary>
///     Applies deny-list redaction plus GUID tokenization so manifest exports do not leak raw tenant identifiers.
/// </summary>
public sealed class AcceptedManifestTrainingRedactor(IPromptRedactor promptRedactor) : IAcceptedManifestTrainingRedactor
{
    private static readonly Regex GuidPattern = new(
        @"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b",
        RegexOptions.CultureInvariant | RegexOptions.Compiled,
        TimeSpan.FromMilliseconds(250));

    private readonly IPromptRedactor _promptRedactor =
        promptRedactor ?? throw new ArgumentNullException(nameof(promptRedactor));

    /// <inheritdoc />
    public string RedactManifestText(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        PromptRedactionOutcome outcome = _promptRedactor.RedactAlways(input);
        string redacted = outcome.Text;

        return GuidPattern.Replace(redacted, "[GUID]");
    }
}
