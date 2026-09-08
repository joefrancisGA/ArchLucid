using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Findings;

/// <summary>Findings plus grounded assumption register from the prose extraction pass (DX-61).</summary>
public sealed class ProseAssumptionGenerationResult
{
    public static ProseAssumptionGenerationResult Empty { get; } = new([], []);

    public ProseAssumptionGenerationResult(
        IReadOnlyList<Finding> findings,
        IReadOnlyList<ProseAssumptionRegisterEntry> registerEntries)
    {
        Findings = findings ?? throw new ArgumentNullException(nameof(findings));
        RegisterEntries = registerEntries ?? throw new ArgumentNullException(nameof(registerEntries));
    }

    public IReadOnlyList<Finding> Findings
    {
        get;
    }

    public IReadOnlyList<ProseAssumptionRegisterEntry> RegisterEntries
    {
        get;
    }
}
