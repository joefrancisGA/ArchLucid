using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;

internal static class SecureNowPackQuestionAnswerCodes
{
    internal static IReadOnlyList<string> ForElicitation(ElicitationAnswerKind answerKind) =>
        answerKind switch
        {
            ElicitationAnswerKind.Bool => ["Yes", "No", "NotSure"],
            _ => ["Yes", "No", "NotSure"],
        };
}
