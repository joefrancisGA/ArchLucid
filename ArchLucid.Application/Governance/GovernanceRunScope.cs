using ArchLucid.Application.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Governance;

/// <summary>Shared run-id normalization and scope checks for governance HTTP facades.</summary>
public static class GovernanceRunScope
{
    /// <summary>
    ///     Normalizes <paramref name="runId"/> and verifies the run exists in the caller's ambient scope.
    /// </summary>
    /// <exception cref="ArgumentException">When <paramref name="runId"/> is missing or not a valid GUID.</exception>
    /// <exception cref="RunNotFoundException">When the run is not in scope.</exception>
    public static async Task<string> RequireScopedRunIdAsync(
        IScopeContextProvider scopeContextProvider,
        IRunRepository runRepository,
        string runId,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(runId))
            throw new ArgumentException("Run id is required.");

        runId = runId.Trim();

        if (!Guid.TryParse(runId, out Guid runGuid))
            throw new ArgumentException($"Run id '{runId}' is not valid.");

        if (runGuid == Guid.Empty)
            throw new ArgumentException("Run id is not valid.");

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunRecord? run = await runRepository.GetByIdAsync(scope, runGuid, ct).ConfigureAwait(false);

        if (run is null)
            throw new RunNotFoundException(runId);

        return runId;
    }

    /// <summary>Non-throwing scope resolution for batch workflows that report per-item failures.</summary>
    public static async Task<GovernanceRunScopeResolution> TryResolveScopedRunIdAsync(
        IScopeContextProvider scopeContextProvider,
        IRunRepository runRepository,
        string runId,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(runId))
        {
            return new GovernanceRunScopeResolution
            {
                Succeeded = false,
                ErrorCode = GovernanceFacadeProblemCodes.ValidationFailed,
                Message = "Run id is required.",
            };
        }

        runId = runId.Trim();

        if (!Guid.TryParse(runId, out Guid runGuid))
        {
            return new GovernanceRunScopeResolution
            {
                Succeeded = false,
                ErrorCode = GovernanceFacadeProblemCodes.ValidationFailed,
                Message = $"Run id '{runId}' is not valid.",
            };
        }

        if (runGuid == Guid.Empty)
        {
            return new GovernanceRunScopeResolution
            {
                Succeeded = false,
                ErrorCode = GovernanceFacadeProblemCodes.ValidationFailed,
                Message = "Run id is not valid.",
            };
        }

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunRecord? run = await runRepository.GetByIdAsync(scope, runGuid, ct).ConfigureAwait(false);

        if (run is null)
        {
            return new GovernanceRunScopeResolution
            {
                Succeeded = false,
                ErrorCode = GovernanceFacadeProblemCodes.RunNotFound,
                Message = $"Run '{runId}' was not found.",
            };
        }

        return new GovernanceRunScopeResolution { Succeeded = true, NormalizedRunId = runId };
    }
}

/// <summary>Outcome of <see cref="GovernanceRunScope.TryResolveScopedRunIdAsync"/>.</summary>
public sealed record GovernanceRunScopeResolution
{
    public bool Succeeded { get; init; }

    public string? NormalizedRunId { get; init; }

    public string? ErrorCode { get; init; }

    public string? Message { get; init; }
}

/// <summary>Problem type URIs returned in governance batch-review item results.</summary>
internal static class GovernanceFacadeProblemCodes
{
    public const string ValidationFailed = "https://archlucid.example.org/errors#validation-failed";
    public const string RunNotFound = "https://archlucid.example.org/errors#run-not-found";
    public const string ResourceNotFound = "https://archlucid.example.org/errors#resource-not-found";
    public const string GovernanceSelfApproval = "https://archlucid.example.org/errors#governance-self-approval";
    public const string Conflict = "https://archlucid.example.org/errors#conflict";
}
