using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IRemediationPatternService
{
    Task<RemediationPatternOperationResult> CreateDraftAsync(
        ScopeContext scope,
        RemediationPatternDraftRequest request,
        string actorKey,
        CancellationToken cancellationToken = default);

    Task<RemediationPatternOperationResult> SubmitForReviewAsync(
        ScopeContext scope,
        Guid patternId,
        string version,
        string actorKey,
        CancellationToken cancellationToken = default);

    Task<RemediationPatternOperationResult> ApproveAsync(
        ScopeContext scope,
        Guid patternId,
        string version,
        string approverActorKey,
        CancellationToken cancellationToken = default);

    Task<RemediationPatternOperationResult> DeprecateAsync(
        ScopeContext scope,
        Guid patternId,
        string version,
        string actorKey,
        CancellationToken cancellationToken = default);

    Task<RemediationPatternOperationResult> RetireAsync(
        ScopeContext scope,
        Guid patternId,
        string version,
        string actorKey,
        CancellationToken cancellationToken = default);

    Task<RemediationPatternDetailResult> TryGetDetailAsync(
        ScopeContext scope,
        Guid patternId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationPatternRecord>> ListPatternsAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default);

    Task<RemediationPatternImportResult> ImportFromJsonAsync(
        ScopeContext scope,
        string json,
        string actorKey,
        CancellationToken cancellationToken = default);

    Task<RemediationPatternImportResult> ImportFromYamlAsync(
        ScopeContext scope,
        string yaml,
        string actorKey,
        CancellationToken cancellationToken = default);

    Task<RemediationPatternBulkImportResult> ImportBulkAsync(
        ScopeContext scope,
        IReadOnlyList<RemediationPatternDraftRequest> items,
        string actorKey,
        CancellationToken cancellationToken = default);
}

public sealed class RemediationPatternDraftRequest
{
    public string PatternKey
    {
        get;
        init;
    } = string.Empty;

    public string DisplayName
    {
        get;
        init;
    } = string.Empty;

    public string? Description
    {
        get;
        init;
    }

    public string Version
    {
        get;
        init;
    } = "1.0.0";

    public RemediationPatternVersionContent Content
    {
        get;
        init;
    } = new();

    public RemediationPatternMatchCriteria MatchCriteria
    {
        get;
        init;
    } = new();

    public RemediationAutomationLevel AutomationLevel
    {
        get;
        init;
    } = RemediationAutomationLevel.Manual;
}

public sealed class RemediationPatternOperationResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public Guid? PatternId
    {
        get;
        init;
    }

    public string? Version
    {
        get;
        init;
    }

    public RemediationPatternStatus? Status
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }
}

public sealed class RemediationPatternDetailResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public RemediationPatternRecord? Pattern
    {
        get;
        init;
    }

    public IReadOnlyList<RemediationPatternVersionRecord> Versions
    {
        get;
        init;
    } = [];

    public string? ErrorMessage
    {
        get;
        init;
    }
}

public sealed class RemediationPatternImportResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public Guid? PatternId
    {
        get;
        init;
    }

    public string? Version
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }
}

public sealed class RemediationPatternBulkImportResult
{
    public IReadOnlyList<RemediationPatternBulkImportItemResult> Items
    {
        get;
        init;
    } = [];

    public int SucceededCount
    {
        get;
        init;
    }

    public int FailedCount
    {
        get;
        init;
    }
}

public sealed class RemediationPatternBulkImportItemResult
{
    public int Index
    {
        get;
        init;
    }

    public bool Succeeded
    {
        get;
        init;
    }

    public Guid? PatternId
    {
        get;
        init;
    }

    public string? PatternKey
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }
}
