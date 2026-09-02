using ArchLucid.Application.Operations;
using ArchLucid.Application.Planning.AdvisoryDraft;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Operations;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

using FluentValidation;

namespace ArchLucid.Application.Planning;

public sealed class ArchitectureRequestIntakeFacade(
    IArchitectureRequestDraftService architectureRequestDraftService,
    IArchitectureOverviewRewriteService architectureOverviewRewriteService,
    IClarificationAnswerRephraseService clarificationAnswerRephraseService,
    IStructuredBriefSuggestionExplainService structuredBriefSuggestionExplainService,
    IChatIntakeParserService chatIntakeParserService,
    IConnectorIntakeParserService connectorIntakeParserService,
    IValidator<ArchitectureRequest> architectureRequestValidator,
    IAdvisoryDraftOperationStore advisoryDraftOperationStore) : IArchitectureRequestIntakeFacade
{
    private readonly IArchitectureRequestDraftService _architectureRequestDraftService = architectureRequestDraftService ?? throw new ArgumentNullException(nameof(architectureRequestDraftService));
    private readonly IArchitectureOverviewRewriteService _architectureOverviewRewriteService = architectureOverviewRewriteService ?? throw new ArgumentNullException(nameof(architectureOverviewRewriteService));
    private readonly IClarificationAnswerRephraseService _clarificationAnswerRephraseService = clarificationAnswerRephraseService ?? throw new ArgumentNullException(nameof(clarificationAnswerRephraseService));
    private readonly IStructuredBriefSuggestionExplainService _structuredBriefSuggestionExplainService = structuredBriefSuggestionExplainService ?? throw new ArgumentNullException(nameof(structuredBriefSuggestionExplainService));
    private readonly IChatIntakeParserService _chatIntakeParserService = chatIntakeParserService ?? throw new ArgumentNullException(nameof(chatIntakeParserService));
    private readonly IConnectorIntakeParserService _connectorIntakeParserService = connectorIntakeParserService ?? throw new ArgumentNullException(nameof(connectorIntakeParserService));
    private readonly IValidator<ArchitectureRequest> _architectureRequestValidator = architectureRequestValidator ?? throw new ArgumentNullException(nameof(architectureRequestValidator));
    private readonly IAdvisoryDraftOperationStore _advisoryDraftOperationStore = advisoryDraftOperationStore ?? throw new ArgumentNullException(nameof(advisoryDraftOperationStore));

    public Task<DraftArchitectureRequestResponse> DraftAsync(DraftArchitectureRequestInput input, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(input);
        return _architectureRequestDraftService.DraftAsync(input, cancellationToken);
    }

    public AdvisoryDraftOperationQueryResult GetDraftAsyncResult(Guid operationId, ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(scope);
        string opaqueOperationId = OperationIdCodec.ForDraft(operationId);
        if (!_advisoryDraftOperationStore.TryGet(opaqueOperationId, scope, out AdvisoryDraftOperationRecord? record) || record is null)
            return new AdvisoryDraftOperationQueryResult { Outcome = AdvisoryDraftOperationOutcome.NotFound };
        if (record.State is OperationState.Running or OperationState.Pending or OperationState.CancelRequested)
            return new AdvisoryDraftOperationQueryResult { Outcome = AdvisoryDraftOperationOutcome.InProgress };
        if (record.State == OperationState.Failed)
            return new AdvisoryDraftOperationQueryResult { Outcome = AdvisoryDraftOperationOutcome.Failed, ErrorMessage = record.ErrorMessage ?? "Structured brief suggestion failed." };
        if (record.State == OperationState.Canceled)
            return new AdvisoryDraftOperationQueryResult { Outcome = AdvisoryDraftOperationOutcome.Canceled };
        if (record.Result is null)
            return new AdvisoryDraftOperationQueryResult { Outcome = AdvisoryDraftOperationOutcome.ResultUnavailable };
        return new AdvisoryDraftOperationQueryResult { Outcome = AdvisoryDraftOperationOutcome.Success, Result = record.Result };
    }

    public Task<RewriteArchitectureOverviewResponse> RewriteOverviewAsync(RewriteArchitectureOverviewInput input, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(input);
        return _architectureOverviewRewriteService.RewriteAsync(input, cancellationToken);
    }

    public Task<RephraseClarificationAnswersResponse> RephraseClarificationAnswersAsync(RephraseClarificationAnswersInput input, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(input);
        return _clarificationAnswerRephraseService.RephraseAsync(input, cancellationToken);
    }

    public Task<ExplainStructuredBriefSuggestionResponse> ExplainStructuredBriefSuggestionAsync(ExplainStructuredBriefSuggestionInput input, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(input);
        return _structuredBriefSuggestionExplainService.ExplainAsync(input, cancellationToken);
    }

    public async Task<ArchitectureRequestIntakeParseResult> ParseChatIntakeAsync(ChatIntakeRequest input, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(input);
        try { return await ValidateParsedRequestAsync(await _chatIntakeParserService.ParseAsync(input, cancellationToken), cancellationToken); }
        catch (InvalidOperationException ex) { return new ArchitectureRequestIntakeParseResult { Outcome = ArchitectureRequestIntakeOutcome.ParseFailed, ErrorMessage = ex.Message }; }
    }

    public async Task<ArchitectureRequestIntakeParseResult> ParseConnectorIntakeAsync(ConnectorIntakeRequest input, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(input);
        try { return await ValidateParsedRequestAsync(await _connectorIntakeParserService.ParseAsync(input, cancellationToken), cancellationToken); }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException) { return new ArchitectureRequestIntakeParseResult { Outcome = ArchitectureRequestIntakeOutcome.ParseFailed, ErrorMessage = ex.Message }; }
    }

    private async Task<ArchitectureRequestIntakeParseResult> ValidateParsedRequestAsync(ArchitectureRequest parsed, CancellationToken cancellationToken)
    {
        FluentValidation.Results.ValidationResult validationResult = await _architectureRequestValidator.ValidateAsync(parsed, cancellationToken);
        if (validationResult.IsValid) return new ArchitectureRequestIntakeParseResult { Outcome = ArchitectureRequestIntakeOutcome.Success, Request = parsed };
        return new ArchitectureRequestIntakeParseResult { Outcome = ArchitectureRequestIntakeOutcome.ValidationFailed, ValidationErrors = validationResult.Errors.Select(static e => e.ErrorMessage).ToList() };
    }
}
