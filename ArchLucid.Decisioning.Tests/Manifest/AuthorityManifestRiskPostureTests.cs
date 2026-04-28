using ArchLucid.Decisioning.Manifest;
using ArchLucid.Decisioning.Manifest.Sections;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Manifest;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AuthorityManifestRiskPostureTests
{
    [Fact]
    public void Derive_When_no_unresolved_issues_Returns_Low()
    {
        ManifestDocument manifest = new()
        {
            UnresolvedIssues = new UnresolvedIssuesSection()
        };

        AuthorityManifestRiskPosture.Derive(manifest).Should().Be("Low");
    }

    [Fact]
    public void Derive_When_critical_issue_Returns_Critical()
    {
        ManifestDocument manifest = new()
        {
            UnresolvedIssues = new UnresolvedIssuesSection
            {
                Items = [new ManifestIssue { Severity = "Critical", Title = "x" }],
            },
        };

        AuthorityManifestRiskPosture.Derive(manifest).Should().Be("Critical");
    }
}
