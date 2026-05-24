using ArchLucid.Contracts.Findings;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.Ask;

[Trait("Category", "Unit")]
public sealed class AskRetrievalSqlFallbackTests
{
    [Fact]
    public void BuildFromRunDetail_returns_matching_finding_snippets()
    {
        RunDetailDto detail = new()
        {
            Run = new RunRecord { RunId = Guid.NewGuid() },
            FindingsSnapshot = new FindingsSnapshot
            {
                Findings =
                [
                    new Finding
                    {
                        Category = "Security",
                        Severity = FindingSeverity.Critical,
                        Rationale = "Public storage account exposes customer data.",
                    },
                ],
            },
        };

        string context = AskRetrievalSqlFallback.BuildFromRunDetail(
            detail,
            "Why is public storage a problem?");

        context.Should().Contain("Public storage account");
        context.Should().Contain("[Security]");
    }

    [Fact]
    public void BuildFromRunDetail_returns_empty_when_no_keyword_overlap()
    {
        RunDetailDto detail = new()
        {
            Run = new RunRecord { RunId = Guid.NewGuid() },
            FindingsSnapshot = new FindingsSnapshot
            {
                Findings =
                [
                    new Finding
                    {
                        Category = "Cost",
                        Severity = FindingSeverity.Warning,
                        Rationale = "Unused VM instance detected.",
                    },
                ],
            },
        };

        string context = AskRetrievalSqlFallback.BuildFromRunDetail(detail, "network topology");

        context.Should().BeEmpty();
    }
}
