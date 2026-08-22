namespace ArchLucid.Application.Clarifications;

/// <summary>Formats operator-asserted clarification answers into durable assumption strings.</summary>
public static class OperatorAssertedClarificationAnswerFormatter
{
    public const string Prefix = "[finding-clarification]";

    public static string Format(string questionId, string answer)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(questionId);
        ArgumentException.ThrowIfNullOrWhiteSpace(answer);

        return $"{Prefix} {answer.Trim()} [q={questionId.Trim()}]";
    }
}
