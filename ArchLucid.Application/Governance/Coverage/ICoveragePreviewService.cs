using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance.Coverage;

/// <summary>Resolves explainable assurance coverage for prospective runs without persisting rows.</summary>
public interface ICoveragePreviewService
{
    Task<CoveragePreviewResult> PreviewAsync(
        ScopeContext scope,
        CoveragePreviewInput input,
        CancellationToken cancellationToken = default);
}
