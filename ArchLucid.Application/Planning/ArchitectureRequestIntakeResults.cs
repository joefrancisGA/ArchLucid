using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Planning;

public enum ArchitectureRequestIntakeOutcome { Success, ParseFailed, ValidationFailed }
public enum AdvisoryDraftOperationOutcome { Success, NotFound, InProgress, Failed, Canceled, ResultUnavailable }

public sealed record ArchitectureRequestIntakeParseResult
{
    public required ArchitectureRequestIntakeOutcome Outcome { get; init; }
    public ArchitectureRequest? Request { get; init; }
    public string? ErrorMessage { get; init; }
    public IReadOnlyList<string>? ValidationErrors { get; init; }
}

public sealed record AdvisoryDraftOperationQueryResult
{
    public required AdvisoryDraftOperationOutcome Outcome { get; init; }
    public DraftArchitectureRequestResponse? Result { get; init; }
    public string? ErrorMessage { get; init; }
}
