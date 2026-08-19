using System.Text;

using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Core.TechnologyLedger;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Loads Technology Ledger rows for a run and appends the canonical formatter block to agent user prompts.
/// </summary>
public static class TechnologyLedgerUserPromptInjection
{
    public static async Task<(CloudProvider EffectiveCloud, IReadOnlyList<TechnologyLedgerEntry> Entries)> LoadAsync(
        ITechnologyLedgerRepository technologyLedgerRepository,
        IScopeContextProvider scopeContextProvider,
        string runId,
        ArchitectureRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(technologyLedgerRepository);
        ArgumentNullException.ThrowIfNull(scopeContextProvider);
        ArgumentNullException.ThrowIfNull(request);

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        IReadOnlyList<TechnologyLedgerEntry> entries =
            await technologyLedgerRepository.GetByRunIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);
        CloudProvider effectiveCloud = TechnologyLedgerEffectiveCloudTarget.Resolve(request, entries);

        return (effectiveCloud, entries);
    }

    public static void AppendLedgerContext(StringBuilder sb, IReadOnlyList<TechnologyLedgerEntry> entries)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(entries);

        if (entries.Count == 0)
            return;

        StringBuilder ledgerBlock = new();
        TechnologyLedgerPromptFormatter.AppendTechnologyLedgerContext(ledgerBlock, entries);
        sb.Append(PromptFieldRedactor.RedactForPrompt(ledgerBlock.ToString()));
    }

    public static string AppendLedgerContext(string baseUserPrompt, IReadOnlyList<TechnologyLedgerEntry> entries)
    {
        StringBuilder sb = new(baseUserPrompt.TrimEnd());
        sb.AppendLine();
        AppendLedgerContext(sb, entries);

        return sb.ToString();
    }
}
