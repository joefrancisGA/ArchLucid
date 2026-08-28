using System.Text.RegularExpressions;

namespace ArchLucid.AgentRuntime.Planning;

/// <summary>
///     Mirrors <see cref="Application.Planning.InferredClarificationAnswerQuality" /> for simulator completions.
/// </summary>
internal static class InferredClarificationAnswerQualitySimulator
{
    private static readonly Regex ActorsTableHeaderPattern =
        new(@"Actors\s+Actor\s+How they touch", RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static readonly Regex DiagramCaptionPattern =
        new(@"Diagram\s*[—\-]", RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    internal static bool IsDumpLike(string answer)
    {
        if (string.IsNullOrWhiteSpace(answer))
            return true;

        string trimmed = answer.Trim();

        return ActorsTableHeaderPattern.IsMatch(trimmed)
               || DiagramCaptionPattern.IsMatch(trimmed)
               || trimmed.EndsWith('—')
               || trimmed.EndsWith('-');
    }
}
