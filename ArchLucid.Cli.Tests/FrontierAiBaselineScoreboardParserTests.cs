using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FrontierAiBaselineScoreboardParserTests
{
    [Fact]
    public void ParseSessions_SkipsExampleRowAndParsesRealSessions()
    {
        const string markdown = """
            ## Session log

            | Session | Date (UTC) | Packet | Exec mode | AL min | Manual min | Timing basis | Decision Δ count | Δ outcome | Repeat (1–5) | Loss mode | AL win | Anti-claims OK |
            | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
            | _example_ | 2026-06-01 | regulated-fixture | Simulator | unknown | unknown | unknown | 0 | WARN | 3 | L2 | packaging | Y |
            | demo-internal-01 | 2026-06-10 | regulated-fixture | Real | 42 | 35 | measured | 2 | PASS | 4 | none | traceability | Y |

            ## Cohort rollup
            """;

        IReadOnlyList<FrontierAiScoreboardSessionRow> rows = FrontierAiScoreboardParser.ParseSessions(markdown);

        rows.Should().HaveCount(1);
        rows[0].SessionLabel.Should().Be("demo-internal-01");
        rows[0].DecisionChangeCount.Should().Be(2);
        rows[0].DecisionDeltaOutcome.Should().Be("PASS");
        rows[0].RepeatUseIntent.Should().Be(4);
        rows[0].AntiClaimsOk.Should().BeTrue();
    }
}
