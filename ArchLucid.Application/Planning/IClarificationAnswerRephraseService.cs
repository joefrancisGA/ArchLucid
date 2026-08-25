using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Planning;

public interface IClarificationAnswerRephraseService
{
    Task<RephraseClarificationAnswersResponse> RephraseAsync(
        RephraseClarificationAnswersInput input,
        CancellationToken cancellationToken);
}
