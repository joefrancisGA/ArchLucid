using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>Builds prose-assumption held-check asks for insight-density curation (DX-66).</summary>
public static class ProseAssumptionHeldCheckAskBuilder
{
    public static IReadOnlyList<ProseAssumptionHeldCheckAsk> Build(
        IReadOnlyList<ProseAssumptionRegisterEntry> registerEntries,
        IReadOnlyList<HeldCheckLedgerRollupEntry> heldCheckLedgerEntries,
        InsightDensityGateOptions options)
    {
        ArgumentNullException.ThrowIfNull(registerEntries);
        ArgumentNullException.ThrowIfNull(heldCheckLedgerEntries);
        ArgumentNullException.ThrowIfNull(options);

        if (registerEntries.Count == 0)
        {
            return [];
        }

        return ProseAssumptionHeldCheckAskMapper.MapAsks(
            registerEntries,
            heldCheckLedgerEntries,
            options.MaxProseAssumptionCandidatesPerSnapshot);
    }
}
