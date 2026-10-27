using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Persistence.ApplicationPorts.Data.Repositories;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Merges technology ledger rows across legacy run-id persistence keys (for example uppercase hex).
/// </summary>
internal static class TechnologyLedgerRunIdLookup
{
    internal static string CanonicalRunIdForLookup(string runId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        string trimmed = runId.Trim();
        return Guid.TryParse(trimmed, out Guid guid) ? guid.ToString("N") : trimmed;
    }

    internal static IEnumerable<string> EnumerateRunIdRepositoryLookupKeys(string runId)
    {
        string canonical = CanonicalRunIdForLookup(runId);
        yield return canonical;

        if (!Guid.TryParse(canonical, out Guid guid))
            yield break;

        string uppercaseHex = guid.ToString("N").ToUpperInvariant();
        if (!string.Equals(uppercaseHex, canonical, StringComparison.Ordinal))
            yield return uppercaseHex;

        string dashed = guid.ToString("D");
        if (!string.Equals(dashed, canonical, StringComparison.Ordinal))
            yield return dashed;

        string dashedUpper = guid.ToString("D").ToUpperInvariant();
        if (!string.Equals(dashedUpper, dashed, StringComparison.Ordinal)
            && !string.Equals(dashedUpper, canonical, StringComparison.Ordinal))
            yield return dashedUpper;

        string braced = guid.ToString("B");
        if (!string.Equals(braced, canonical, StringComparison.Ordinal)
            && !string.Equals(braced, dashed, StringComparison.Ordinal))
            yield return braced;

        string bracedUpper = braced.ToUpperInvariant();
        if (!string.Equals(bracedUpper, braced, StringComparison.Ordinal))
            yield return bracedUpper;

        string parentheses = guid.ToString("P");
        if (!string.Equals(parentheses, canonical, StringComparison.Ordinal)
            && !string.Equals(parentheses, dashed, StringComparison.Ordinal)
            && !string.Equals(parentheses, braced, StringComparison.Ordinal))
            yield return parentheses;

        string parenthesesUpper = parentheses.ToUpperInvariant();
        if (!string.Equals(parenthesesUpper, parentheses, StringComparison.Ordinal))
            yield return parenthesesUpper;
    }

    internal static async Task<IReadOnlyList<TechnologyLedgerEntry>> LoadEntriesByRunIdAsync(
        ITechnologyLedgerRepository technologyLedgerRepository,
        ScopeContext scope,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(technologyLedgerRepository);

        string lookupRunId = CanonicalRunIdForLookup(primaryRunId);

        IReadOnlyList<TechnologyLedgerEntry> entries = await technologyLedgerRepository
            .GetByRunIdAsync(scope, lookupRunId, cancellationToken)
            .ConfigureAwait(false);

        return entries ?? [];
    }
}
