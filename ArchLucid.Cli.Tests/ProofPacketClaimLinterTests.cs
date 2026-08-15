using System.Text;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ProofPacketClaimLinterTests
{
    [Fact]
    public void ScanText_flags_forbidden_claim_without_caveat()
    {
        string rulesPath = ResolveRulesPath();
        string body =
            """
            # Sponsor report

            This pilot delivered guaranteed savings for the sponsor.
            """;

        IReadOnlyList<ProofPacketClaimLintViolation> violations = ProofPacketClaimLinter.ScanDirectory(
            WriteTempPacket(body),
            rulesPath);

        violations.Should().ContainSingle(v =>
            v.Phrase == "guaranteed savings"
            && v.LineNumber == 3
            && v.Reason.Length > 0
            && v.SuggestedSafeWording.Length > 0);
    }

    [Fact]
    public void ScanText_allows_self_assessed_soc_wording()
    {
        string rulesPath = ResolveRulesPath();
        string body =
            """
            # Trust posture

            SOC posture is self-assessed — not SOC 2 certified.
            """;

        IReadOnlyList<ProofPacketClaimLintViolation> violations = ProofPacketClaimLinter.ScanDirectory(
            WriteTempPacket(body),
            rulesPath);

        violations.Should().BeEmpty();
    }

    [Fact]
    public void ScanText_allows_extractor_backed_roi_line()
    {
        string rulesPath = ResolveRulesPath();
        string body =
            """
            # ROI

            Extractor-backed savings estimate with source labels in roi-metric-sources.md.
            """;

        IReadOnlyList<ProofPacketClaimLintViolation> violations = ProofPacketClaimLinter.ScanDirectory(
            WriteTempPacket(body),
            rulesPath);

        violations.Should().BeEmpty();
    }

    [Fact]
    public void ScanText_flags_soc2_certified_even_in_title_case()
    {
        string rulesPath = ResolveRulesPath();
        string body = "Vendor is **SOC 2 Certified** for enterprise buyers.";

        IReadOnlyList<ProofPacketClaimLintViolation> violations = ProofPacketClaimLinter.ScanDirectory(
            WriteTempPacket(body),
            rulesPath);

        violations.Should().ContainSingle(v => v.Phrase == "soc 2 certified");
    }

    private static string WriteTempPacket(string markdownBody)
    {
        string directory = Path.Combine(Path.GetTempPath(), "ArchLucidClaimLint." + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(directory);
        File.WriteAllText(Path.Combine(directory, "proof-summary.md"), markdownBody, Encoding.UTF8);
        File.WriteAllText(Path.Combine(directory, ProofPacketSourceLabelsBuilder.FileName), ProofPacketSourceLabelsBuilder.Build("run-test"), Encoding.UTF8);

        return directory;
    }

    private static string ResolveRulesPath()
    {
        string fromOutput = Path.Combine(AppContext.BaseDirectory, "Data", "proof_packet_claim_lint_rules.v1.json");

        if (File.Exists(fromOutput))
            return fromOutput;

        string fromRepo = Path.GetFullPath(
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "ArchLucid.Cli", "Data", "proof_packet_claim_lint_rules.v1.json"));

        File.Exists(fromRepo).Should().BeTrue("claim lint rules fixture must be present for tests");

        return fromRepo;
    }
}
