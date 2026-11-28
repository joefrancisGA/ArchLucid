using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.RemediationPortfolio;

public enum PortfolioEvidenceKind { Finding, Path, CutPoint, PatternVersion, PatternMatch }
public enum PortfolioSupport { Unknown, Candidate, Reviewed }
public enum PortfolioRelationship { Requires, Conflicts, Alternative }

public sealed record PortfolioEvidenceReference(PortfolioEvidenceKind Kind, Guid RecordId, string Sha256);

public sealed record PortfolioBinding(
    ProjectSnapshotScopeKey Scope, string InventorySha256, string PolicyVersion, string EngineVersion, string RiskModelVersion);

public sealed record PortfolioActionProposal(
    Guid Key, string ActionKind, Guid TargetResourceId, Guid PatternId, Guid PatternVersionId,
    IReadOnlyList<Guid> FindingIds, IReadOnlyList<PortfolioEvidenceReference> Evidence);

public sealed record PortfolioCauseProposal(Guid Key, IReadOnlyList<Guid> FindingIds,
    PortfolioSupport Support, IReadOnlyList<PortfolioEvidenceReference> Evidence);

public sealed record PortfolioScenarioProposal(Guid Key, Guid CauseKey, IReadOnlyList<Guid> FindingIds,
    PortfolioSupport Support, IReadOnlyList<PortfolioEvidenceReference> Evidence);

public sealed record PortfolioRelationshipProposal(Guid FirstAction, Guid SecondAction, PortfolioRelationship Relationship,
    PortfolioSupport Support, IReadOnlyList<PortfolioEvidenceReference> Evidence);

/// <summary>One sufficient clause. All listed actions, not any individual member, must be selected.</summary>
public sealed record PortfolioCoverageProposal(Guid ScenarioKey, IReadOnlyList<Guid> AllActions,
    PortfolioSupport Support, IReadOnlyList<PortfolioEvidenceReference> Evidence);

/// <summary>Submitted by an authorized custodian with an independently reviewed proposal digest.</summary>
public sealed record RemediationPortfolioProposal(PortfolioBinding Binding, bool DependenciesComplete,
    IReadOnlyList<PortfolioActionProposal> Actions, IReadOnlyList<PortfolioCauseProposal> Causes,
    IReadOnlyList<PortfolioScenarioProposal> Scenarios, IReadOnlyList<PortfolioRelationshipProposal> Relationships,
    IReadOnlyList<PortfolioCoverageProposal> Coverage);

public sealed record PortfolioActionNode(string Id, string ActionKind, Guid TargetResourceId, Guid PatternId, Guid PatternVersionId,
    IReadOnlyList<Guid> FindingIds, IReadOnlyList<PortfolioEvidenceReference> Evidence, bool Eligible);
public sealed record PortfolioCauseNode(string Id, IReadOnlyList<Guid> FindingIds,
    IReadOnlyList<PortfolioEvidenceReference> Evidence, bool Reviewed);
public sealed record PortfolioScenarioNode(string Id, string CauseId, IReadOnlyList<Guid> FindingIds,
    IReadOnlyList<PortfolioEvidenceReference> Evidence, bool Reviewed);
public sealed record PortfolioRelationshipEdge(string FirstActionId, string SecondActionId, PortfolioRelationship Relationship,
    IReadOnlyList<PortfolioEvidenceReference> Evidence);
public sealed record PortfolioCoverageClause(string ScenarioId, IReadOnlyList<string> AllActionIds,
    IReadOnlyList<PortfolioEvidenceReference> Evidence);
public sealed record PortfolioIssue(string SubjectId, string Reason);
public sealed record PortfolioSelectionResult(bool Feasible, IReadOnlyList<string> CoveredScenarioIds,
    IReadOnlyList<string> UnknownScenarioIds, IReadOnlyList<PortfolioIssue> Issues);
