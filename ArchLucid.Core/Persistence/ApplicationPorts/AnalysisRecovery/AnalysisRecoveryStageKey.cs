using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Orchestration.AnalysisRecovery;

/// <summary>Identity of a stage inside one authorized, pinned analysis execution.</summary>
public sealed record AnalysisRecoveryStageKey(
    ProjectScopeKey Scope, string Pipeline, Guid RunId, string Stage);
