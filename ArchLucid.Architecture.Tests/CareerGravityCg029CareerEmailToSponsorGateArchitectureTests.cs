using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-029 ratchet: email-to-sponsor applies sponsor PDF honesty plus rehearsal subject/ack gate.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg029CareerEmailToSponsorGateArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg029_ui_banner_wires_door_stamp_and_rehearsal_email_gate()
    {
        string hook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "use-email-run-to-sponsor-banner.ts"));
        string gate = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "email-run-to-sponsor-rehearsal-gate.ts"));
        string banner = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "EmailRunToSponsorBanner.tsx"));
        string actions = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "EmailRunToSponsorExportActions.tsx"));

        hook.Should().Contain("resolveSimulatorRehearsalBannerOnArtifactForExport");
        hook.Should().Contain("resolveEmailRunToSponsorRehearsalGate");
        hook.Should().Contain("blockSponsorEmailSend");
        gate.Should().Contain("EMAIL_RUN_TO_SPONSOR_REHEARSAL_SUBJECT_PREFIX");
        gate.Should().Contain("resolveEmailRunToSponsorSendBlocked");
        banner.Should().Contain("email-run-to-sponsor-rehearsal-ack-checkbox");
        actions.Should().Contain("email-run-to-sponsor-compose-email");
    }

    [Fact]
    public void Cg029_docs_record_email_to_sponsor_rehearsal_gate()
    {
        string docs = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));
        string outbound = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "architecture", "CAREER_GRAVITY_OUTBOUND_INVENTORY.md"));

        docs.Should().Contain("CG-029");
        docs.Should().Contain("Email-to-sponsor");
        outbound.Should().Contain("Career/Rehearsal door");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? current = new(Directory.GetCurrentDirectory());

        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "ArchLucid.sln")))
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not locate repository root.");
    }
}
