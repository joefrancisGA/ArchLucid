using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Findings;

/// <summary>In-memory held-check collector threaded through <see cref="Contracts.Architecture.FindingAnalysisContext" />.</summary>
public sealed class HeldCheckLedger : IHeldCheckLedger
{
    private readonly Dictionary<(string EngineType, HeldCheckInputCode InputCode), byte> _records = new();

    public void Record(string engineType, HeldCheckInputCode inputCode)
    {
        if (string.IsNullOrWhiteSpace(engineType))
        {
            return;
        }

        _records[(engineType.Trim(), inputCode)] = 0;
    }

    public IReadOnlyList<HeldCheckLedgerRollupEntry> BuildRollup()
    {
        if (_records.Count == 0)
        {
            return [];
        }

        Dictionary<HeldCheckInputCode, HashSet<string>> enginesByCode = new();

        foreach (KeyValuePair<(string EngineType, HeldCheckInputCode InputCode), byte> pair in _records)
        {
            if (!enginesByCode.TryGetValue(pair.Key.InputCode, out HashSet<string>? engineTypes))
            {
                engineTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                enginesByCode[pair.Key.InputCode] = engineTypes;
            }

            engineTypes.Add(pair.Key.EngineType);
        }

        return enginesByCode
            .Select(static pair => new HeldCheckLedgerRollupEntry
            {
                InputCode = pair.Key,
                EngineCount = pair.Value.Count,
                EngineTypes = pair.Value
                    .OrderBy(static engineType => engineType, StringComparer.OrdinalIgnoreCase)
                    .ToList(),
            })
            .OrderByDescending(static entry => entry.EngineCount)
            .ThenBy(static entry => entry.InputCode)
            .ToList();
    }

    /// <summary>No-ops when the analysis context or ledger is absent (golden harness).</summary>
    public static void TryRecord(
        Contracts.Architecture.FindingAnalysisContext? analysisContext,
        string engineType,
        HeldCheckInputCode inputCode)
    {
        analysisContext?.HeldCheckLedger?.Record(engineType, inputCode);
    }
}
