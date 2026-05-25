using ArchLucid.Application.Explanation.Models;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Explanation;

/// <summary>
///     Builds deterministic finding explainability payloads from persisted finding rows (Decisioning helpers stay in Application).
/// </summary>
public interface IFindingExplainabilityComposer
{
    FindingExplainabilityResult Compose(Finding match);
}
