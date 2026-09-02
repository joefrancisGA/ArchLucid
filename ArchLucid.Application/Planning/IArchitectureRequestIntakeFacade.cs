using ArchLucid.Application.Planning.AdvisoryDraft;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Planning;

public interface IArchitectureRequestIntakeFacade
{
    Task<DraftArchitectureRequestResponse> DraftAsync(DraftArchitectureRequestInput input, CancellationToken cancellationToken = default);
    AdvisoryDraftOperationQueryResult GetDraftAsyncResult(Guid operationId, ScopeContext scope);
    Task<RewriteArchitectureOverviewResponse> RewriteOverviewAsync(RewriteArchitectureOverviewInput input, CancellationToken cancellationToken = default);
    Task<RephraseClarificationAnswersResponse> RephraseClarificationAnswersAsync(RephraseClarificationAnswersInput input, CancellationToken cancellationToken = default);
    Task<ExplainStructuredBriefSuggestionResponse> ExplainStructuredBriefSuggestionAsync(ExplainStructuredBriefSuggestionInput input, CancellationToken cancellationToken = default);
    Task<ArchitectureRequestIntakeParseResult> ParseChatIntakeAsync(ChatIntakeRequest input, CancellationToken cancellationToken = default);
    Task<ArchitectureRequestIntakeParseResult> ParseConnectorIntakeAsync(ConnectorIntakeRequest input, CancellationToken cancellationToken = default);
}
