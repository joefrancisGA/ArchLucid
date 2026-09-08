namespace ArchLucid.Core.Findings;

/// <summary>Shared counterfactual note prefix parsing for path-engine findings (DX-26).</summary>
public static class FindingCounterfactualNotes
{
    public const string NotePrefix = "counterfactual:";

    public static string? TryParseSentence(IEnumerable<string>? notes)
    {
        if (notes is null)
        {
            return null;
        }

        foreach (string note in notes)
        {
            if (string.IsNullOrWhiteSpace(note))
            {
                continue;
            }

            if (note.StartsWith(NotePrefix, StringComparison.OrdinalIgnoreCase))
            {
                string sentence = note[NotePrefix.Length..].Trim();

                return sentence.Length > 0 ? sentence : null;
            }
        }

        return null;
    }

    public static string? ToPrefixedWireValue(IEnumerable<string>? notes)
    {
        string? sentence = TryParseSentence(notes);

        if (sentence is null)
        {
            return null;
        }

        return $"{NotePrefix}{sentence}";
    }
}
