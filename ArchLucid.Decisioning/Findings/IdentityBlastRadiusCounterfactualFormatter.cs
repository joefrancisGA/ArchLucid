using ArchLucid.Core.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>Deterministic counterfactual sentence for identity-blast-radius findings (DX-26).</summary>
public static class IdentityBlastRadiusCounterfactualFormatter
{
    public static string? Format(string actorLabel, string roleName, string datastoreLabel, int hopCount)
    {
        if (string.IsNullOrWhiteSpace(actorLabel)
            || string.IsNullOrWhiteSpace(roleName)
            || string.IsNullOrWhiteSpace(datastoreLabel)
            || hopCount < 0)
        {
            return null;
        }

        return
            $"If {actorLabel.Trim()} lost {roleName.Trim()} on {datastoreLabel.Trim()}, the write/admin path ({hopCount} hops) would be removed.";
    }

    public static string? FormatTraceNote(string actorLabel, string roleName, string datastoreLabel, int hopCount)
    {
        string? sentence = Format(actorLabel, roleName, datastoreLabel, hopCount);

        if (sentence is null)
        {
            return null;
        }

        return $"{FindingCounterfactualNotes.NotePrefix}{sentence}";
    }

    public static string? TryParseFromNotes(IEnumerable<string>? notes) =>
        FindingCounterfactualNotes.TryParseSentence(notes);
}
