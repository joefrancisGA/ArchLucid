using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Suite", "Decisioning")]
public sealed class PolicyPackToggleCompareMarkdownTests
{
    [Fact]
    public void Build_null_snapshot_throws()
    {
        Action act = () => PolicyPackToggleCompareMarkdown.Build(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Build_empty_snapshot_matches_golden_header_and_table_shell()
    {
        string markdown = PolicyPackToggleCompareMarkdown.Build(new PolicyPackToggleCompareSnapshot
        {
            FilteredRuleKeyRows = [],
            BundledP1Rows = [],
        });

        markdown.Should().Be(
            """
            # Policy pack toggle compare

            > **Scope:** Checked-in regression artifact for declaration-security pack toggle; internal QA only — not buyer-facing certification evidence.

            claimBoundary: proves tenant rule keys and bundled P1 SOC 2 vs CIS Azure packs change **declaration-security-baseline** findings on a fixed graph. Coverage, topology, cost, and inventory engines remain pack-inert; not evidence that all engines are policy-aware.

            **Graph:** one `TopologyResource` (`api`) with `tf.public_network_access=enabled` and `httpsOnly=false`.

            **Guard:** `PolicyPackToggleCompareReportTests` (`ArchLucid.Decisioning.Tests`, `Suite=Core`). Regenerate with `ARCHLUCID_RECORD_POLICY_PACK_TOGGLE_COMPARE=1`.

            ## Filtered rule-key postures (`PolicyFilteredDeclarationGoldenCorpusTests`)

            | Posture | Filtered rule id | Finding title | PolicyRuleId |
            | --- | --- | --- | --- |

            ## Bundled P1 packs (`PolicyPackP1ToggleGoldenCorpusTests`)

            | Posture | Pack content file | Priority floor | Finding title | PolicyRuleId |
            | --- | --- | --- | --- | --- |


            """);
    }

    [Fact]
    public void Build_escapes_pipe_characters_in_table_cells()
    {
        string markdown = PolicyPackToggleCompareMarkdown.Build(new PolicyPackToggleCompareSnapshot
        {
            FilteredRuleKeyRows =
            [
                new PolicyPackToggleCompareFindingRow
                {
                    Posture = "A|B",
                    PackOrRuleKey = "soc2-004",
                    FindingTitle = "title|fragment",
                    PolicyRuleId = "soc2-004",
                },
            ],
            BundledP1Rows = [],
        });

        markdown.Should().Contain("| A\\|B | soc2-004 | title\\|fragment | soc2-004 |");
    }
}
