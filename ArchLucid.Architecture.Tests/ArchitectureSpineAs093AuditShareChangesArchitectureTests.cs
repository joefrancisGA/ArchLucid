using ArchLucid.Core.Audit;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-093: Required durable audit for architecture share mutations.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs093AuditShareChangesArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As093_share_audit_support_uses_log_or_throw()
    {
        string path = Path.Combine(
            RepoRoot,
            "ArchLucid.Application",
            "Architecture",
            "ArchitectureShareAuditSupport.cs");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("AS-093");
        source.Should().Contain("LogOrThrowAsync");
        source.Should().Contain("ArchitectureShareGranted");
        source.Should().Contain("ArchitectureShareRevoked");
        source.Should().Contain("ArchitectureRestrictToSharesEnabled");
        source.Should().Contain("ArchitectureRestrictToSharesDisabled");
    }

    [Fact]
    public void As093_share_event_types_are_required_audit_types()
    {
        string path = Path.Combine(RepoRoot, "ArchLucid.Core", "Audit", "RequiredAuditEventTypes.cs");

        string source = File.ReadAllText(path);

        source.Should().Contain(nameof(AuditEventTypes.ArchitectureShareGranted));
        source.Should().Contain(nameof(AuditEventTypes.ArchitectureShareRevoked));
        source.Should().Contain(nameof(AuditEventTypes.ArchitectureRestrictToSharesEnabled));
        source.Should().Contain(nameof(AuditEventTypes.ArchitectureRestrictToSharesDisabled));
    }

    [Fact]
    public void As093_orphan_probe_sql_covers_share_granted_and_restrict_enabled()
    {
        string path = Path.Combine(RepoRoot, "ArchLucid.Host.Core", "Audit", "RequiredAuditTrailOrphanProbeSql.cs");

        string source = File.ReadAllText(path);

        source.Should().Contain("ArchitectureShareGrantedMissingAudit");
        source.Should().Contain("ArchitectureRestrictToSharesEnabledMissingAudit");
        source.Should().Contain("ArchitectureIdentity.ShareGranted");
        source.Should().Contain("ArchitectureIdentity.RestrictToSharesEnabled");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? current = new(Directory.GetCurrentDirectory());

        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "ArchLucid.sln")))
                return current.FullName;

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not locate repository root.");
    }
}
