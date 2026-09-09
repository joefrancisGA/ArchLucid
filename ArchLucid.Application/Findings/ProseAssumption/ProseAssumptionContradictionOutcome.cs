using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

namespace ArchLucid.Application.Findings.ProseAssumption;

/// <summary>Contradiction findings plus grounded assumption register rows (DX-61).</summary>
public sealed class ProseAssumptionContradictionOutcome
{
    public static ProseAssumptionContradictionOutcome Empty { get; } = new([], []);

    public ProseAssumptionContradictionOutcome(
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
