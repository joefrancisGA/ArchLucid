using ArchLucid.Contracts.Advisory.Models;
using ArchLucid.Contracts.Advisory.Workflow;

namespace ArchLucid.Decisioning.Advisory.Workflow;

/// <summary>
///     Maps advisory <see cref="ImprovementPlan" /> output to durable <see cref="RecommendationRecord" /> rows and applies
///     operator workflow actions.
/// </summary>
/// <remarks>
///     Default implementation: <c>ArchLucid.Persistence.Advisory.RecommendationWorkflowService</c>. Invoked from HTTP
///     after plan generation
///     (<c>ArchLucid.Api.Controllers.AdvisoryController</c>) and when applying accept/reject/defer/implemented.
/// </remarks>
public interface IRecommendationWorkflowService
    : ArchLucid.Core.Persistence.Ports.IRecommendationWorkflowService
{
    // Compatibility stub: canonical contract is inherited from Core.
}
