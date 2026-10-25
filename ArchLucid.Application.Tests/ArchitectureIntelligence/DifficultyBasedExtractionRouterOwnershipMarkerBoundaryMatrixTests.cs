using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class DifficultyBasedExtractionRouterOwnershipMarkerBoundaryMatrixTests
{
    private readonly DifficultyBasedExtractionRouter _router = new();

    public static TheoryData<string, string> FalsePositiveOwnershipGapCases => new()
    {
        { "The billing API co-owner shares on-call. Legacy nodes remain unowned.", "co-owner" },
        { "The billing API co_owner shares on-call. Legacy nodes remain unowned.", "co_owner" },
        { "Traffic routes via api.owner.prod.internal. Legacy subnets remain unowned.", "dns-owner-label" },
        { "Endpoint https://api:owner.prod resolves. Legacy subnets remain unowned.", "uri-owner-label" },
        { "Escalation goes to owner@example.com while legacy subnets remain unowned.", "email-local-owner" },
        { "Escalation goes to ops@owner.example.com while legacy subnets remain unowned.", "email-domain-owner" },
        { "The owner/prod slice handles failover. Legacy nodes remain unowned.", "path-owner-segment" },
        {
            "Callback https://api.example/notify?owner=security-team handles paging. Legacy racks remain unowned.",
            "query-owner-param"
        },
        { "The runbook lists (owner security) as paging contact. Legacy racks remain unowned.", "parenthetical-owner" },
        { "The schema field `owner` documents RACI. Legacy racks remain unowned.", "backtick-owner" },
        { "The RACI table lists **owner** for platform. Legacy racks remain unowned.", "markdown-bold-owner" },
        { "Policy names \"owner\" role separately. Legacy racks remain unowned.", "double-quoted-owner" },
        { "Policy names 'owner' role separately. Legacy racks remain unowned.", "single-quoted-owner" },
        { "Markdown [owner team] handles paging. Legacy racks remain unowned.", "bracket-owner-label" },
        {
            "The integration payload uses <owner>security</owner> tags. Legacy racks remain unowned.",
            "xml-owner-element"
        },
        {
            """
            {
              "owner": "security",
              "notes": "unowned racks in DR site"
            }
            """,
            "json-owner-key"
        },
    };

    public static TheoryData<string, string> TruePositiveOwnershipGapCases => new()
    {
        { "The designated owner handles paging. Legacy racks remain unowned.", "prose-owner-unowned" },
        { "Owners rotate weekly. Several racks are still unowned.", "prose-owners-unowned" },
        { "Owner team confirmed. DR capacity is unowned.", "prose-owner-label-unowned" },
    };

    [Theory]
    [MemberData(nameof(FalsePositiveOwnershipGapCases))]
    public void Extract_ownership_marker_boundary_matrix_does_not_emit_false_gap(string source, string artifactId)
    {
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(source, artifactId);

        elements.Should().NotContain(element =>
            element.Kind == ArchitectureElementKind.OperationalOwnership
            && element.Name.Contains("Unowned component", StringComparison.OrdinalIgnoreCase));
    }

    [Theory]
    [MemberData(nameof(TruePositiveOwnershipGapCases))]
    public void Extract_ownership_marker_boundary_matrix_emits_gap_for_genuine_owner_language(
        string source,
        string artifactId)
    {
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(source, artifactId);

        elements.Should().Contain(element =>
            element.Kind == ArchitectureElementKind.OperationalOwnership
            && element.Name.Contains("Unowned component", StringComparison.OrdinalIgnoreCase));
    }
}
