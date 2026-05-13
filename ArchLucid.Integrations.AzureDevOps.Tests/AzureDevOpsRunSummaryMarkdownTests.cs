using ArchLucid.Contracts.Abstractions.Integrations;

using Xunit;

namespace ArchLucid.Integrations.AzureDevOps.Tests;

public sealed class AzureDevOpsRunSummaryMarkdownTests
{
    [Fact]
    public void Format_orders_severity_buckets_by_descending_counts_with_unknown_when_severity_blank()
    {
        Guid runId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid manifestId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        AuthorityRunCompletedFindingLink[] findings =
        [
            new(FindingId: "a", DeepLinkUrl: "http://z", Severity: "Low"),
            new(FindingId: "b", DeepLinkUrl: "http://y", Severity: null),
            new(FindingId: "c", DeepLinkUrl: "http://x", Severity: ""),
            new(FindingId: "d", DeepLinkUrl: "http://w", Severity: "  High ")
        ];

        string md = AzureDevOpsRunSummaryMarkdown.Format(runId, manifestId, findings, operatorRunDeepLink: null);

        int unknownIx = md.IndexOf("**Unknown:** 2", StringComparison.Ordinal);
        int lowIx = md.IndexOf("**Low:** 1", StringComparison.Ordinal);
        int highIx = md.IndexOf("**High:** 1", StringComparison.Ordinal);

        Assert.True(unknownIx >= 0 && lowIx >= 0 && highIx >= 0);
        Assert.True(unknownIx < lowIx);
        Assert.True(lowIx < highIx);
        Assert.DoesNotContain("Open operator run", md, StringComparison.Ordinal);
    }

    [Fact]
    public void Format_appends_operator_run_link_trimmed_when_configured()
    {
        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();

        string md = AzureDevOpsRunSummaryMarkdown.Format(
            runId,
            manifestId,
            findings: [],
            operatorRunDeepLink: "  https://portal.example/path/ ");

        Assert.Contains("[Open operator run](https://portal.example/path/)", md, StringComparison.Ordinal);
    }

    [Fact]
    public void Format_without_findings_omits_severity_heading()
    {
        string md = AzureDevOpsRunSummaryMarkdown.Format(
            Guid.NewGuid(),
            Guid.NewGuid(),
            findings: [],
            operatorRunDeepLink: null);

        Assert.DoesNotContain("### Findings by severity", md, StringComparison.Ordinal);
        Assert.True(md.Length > 0);
    }
}
