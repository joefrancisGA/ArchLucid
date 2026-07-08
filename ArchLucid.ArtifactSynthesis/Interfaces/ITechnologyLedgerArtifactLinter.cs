using ArchLucid.ArtifactSynthesis.Validation;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Configuration;

namespace ArchLucid.ArtifactSynthesis.Interfaces;

public interface ITechnologyLedgerArtifactLinter
{
    IReadOnlyList<TechnologyLedgerArtifactLintFinding> Lint(
        ArtifactBundle bundle,
        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries,
        TechnologyLedgerArtifactLintOptions options);
}
