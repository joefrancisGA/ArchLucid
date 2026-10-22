using ArchLucid.Core.Manifest.Sections;

namespace ArchLucid.Core.Manifest;

public partial class ManifestDocument
{
    public RequirementsCoverageSection Requirements
    {
        get;
        set;
    } = new();

    public TopologySection Topology
    {
        get;
        set;
    } = new();

    public SecuritySection Security
    {
        get;
        set;
    } = new();

    public ComplianceSection Compliance
    {
        get;
        set;
    } = new();

    public CostSection Cost
    {
        get;
        set;
    } = new();

    public ConstraintSection Constraints
    {
        get;
        set;
    } = new();

    public UnresolvedIssuesSection UnresolvedIssues
    {
        get;
        set;
    } = new();
}
