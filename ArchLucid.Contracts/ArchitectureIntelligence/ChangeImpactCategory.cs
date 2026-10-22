namespace ArchLucid.Contracts.ArchitectureIntelligence;

/// <summary>Groups apply-time impact rows for sponsor traceability (TB-2340 item 48).</summary>
public enum ChangeImpactCategory
{
  ModelDiffChange = 0,
  Decision = 1,
  Risk = 2,
  ComplianceMapping = 3,
  DeploymentDiagram = 4,
  RelatedElement = 5,
}
