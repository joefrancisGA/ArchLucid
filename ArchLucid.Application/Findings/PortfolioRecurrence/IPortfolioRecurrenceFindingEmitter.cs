using ArchLucid.Decisioning.Models;

namespace ArchLucid.Application.Findings.PortfolioRecurrence;

public interface IPortfolioRecurrenceFindingEmitter
{
    IReadOnlyList<Finding> EmitQualifyingFindings(
        RecurrenceMatchResult matchResult,
        IReadOnlySet<string> currentScopeIdentities,
        PortfolioRecurrenceFindingOptions options);
}
