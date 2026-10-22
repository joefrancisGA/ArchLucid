using ArchLucid.Cli.Commands;
using ArchLucid.Cli.Diagnostics;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CliPackageCoverageBatch8Tests
{
    [Fact]
    public void DeploymentEvidenceGitReader_prefers_github_sha_when_set()
    {
        string? previous = Environment.GetEnvironmentVariable("GITHUB_SHA");

        try
        {
            Environment.SetEnvironmentVariable("GITHUB_SHA", "  deadbeef  ", EnvironmentVariableTarget.Process);

            DeploymentEvidenceGitReader.TryReadHeadSha("C:\\missing").Should().Be("deadbeef");
        }
        finally
        {
            Environment.SetEnvironmentVariable("GITHUB_SHA", previous, EnvironmentVariableTarget.Process);
        }
    }

    [Fact]
    public void DeploymentEvidenceGitReader_reads_head_and_dirty_from_repo()
    {
        string? repoRoot = ResolveRepositoryRootFromTestContext();
        repoRoot.Should().NotBeNull();

        string? head = DeploymentEvidenceGitReader.TryReadHeadSha(repoRoot!);
        head.Should().NotBeNullOrWhiteSpace();

        bool? dirty = DeploymentEvidenceGitReader.TryReadDirty(repoRoot!);
        dirty.Should().NotBeNull();
    }

    [Fact]
    public void DeploymentEvidenceRepositoryRootResolver_finds_solution_from_search_path()
    {
        string? repoRoot = ResolveRepositoryRootFromTestContext();
        repoRoot.Should().NotBeNull();

        DeploymentEvidenceRepositoryRootResolver.TryResolve(
            explicitRoot: null,
            searchFromDirectory: repoRoot!,
            out string? resolved).Should().BeTrue();
        resolved.Should().NotBeNull();
        File.Exists(Path.Combine(resolved!, "ArchLucid.sln")).Should().BeTrue();

        DeploymentEvidenceRepositoryRootResolver.TryResolve(
            explicitRoot: Path.Combine(repoRoot!, "missing"),
            searchFromDirectory: repoRoot,
            out _).Should().BeFalse();
    }

    [Fact]
    public void DeploymentEvidenceTriageCatalog_returns_actionable_lines_for_each_probe()
    {
        DeploymentEvidenceTriageCatalog.LiveFailure("https://api.example")
            .Should().Contain(line => line.Contains("/health/live", StringComparison.Ordinal));
        DeploymentEvidenceTriageCatalog.ReadyFailure()
            .Should().Contain(line => line.Contains("/health/ready", StringComparison.Ordinal));
        DeploymentEvidenceTriageCatalog.OpenApiFailure("https://api.example")
            .Should().Contain(line => line.Contains("/openapi/v1.json", StringComparison.Ordinal));
        DeploymentEvidenceTriageCatalog.VersionFailure()
            .Should().Contain(line => line.Contains("/version", StringComparison.Ordinal));
        DeploymentEvidenceTriageCatalog.SyntheticFailure("/api/auth/me")
            .Should().Contain(line => line.Contains("/api/auth/me", StringComparison.Ordinal));
        DeploymentEvidenceTriageCatalog.TransportFailure("GET")
            .Should().Contain(line => line.Contains("GET", StringComparison.Ordinal));
    }

    [Fact]
    public void GraphWireMermaidFormatter_builds_flowchart_with_stub_nodes_and_labels()
    {
        GraphWireModel model = new()
        {
            Nodes =
            [
                new GraphNodeWire { Id = "a", Label = "Alpha", Type = "service" },
                new GraphNodeWire { Id = "b", Label = "Beta \"quoted\"", Type = "" },
            ],
            Edges =
            [
                new GraphEdgeWire { Source = "a", Target = "b", Type = "reads" },
                new GraphEdgeWire { Source = "missing", Target = "a", Type = "" },
                new GraphEdgeWire { Source = "", Target = "b", Type = "skip" },
            ],
        };

        string mermaid = GraphWireMermaidFormatter.ToFlowchart(model);

        mermaid.Should().StartWith("flowchart LR");
        mermaid.Should().Contain("Alpha :: service");
        mermaid.Should().Contain("-- \"reads\" -->");
        mermaid.Should().Contain("?"); // stub node for missing id
    }

    [Fact]
    public void SqlConnectionStringSecurity_enforces_encrypt_mandatory()
    {
        string secured = SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(
            "Server=.;Database=x;Encrypt=False;TrustServerCertificate=True");

        secured.ToLowerInvariant().Should().Contain("encrypt=true");

        Action blank = () => SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(" ");
        blank.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void DoctorLocalConfiguration_builds_configuration_from_optional_appsettings()
    {
        string tempDir = Path.Combine(Path.GetTempPath(), "archlucid-cli-doctor-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempDir);
        string previousCwd = Directory.GetCurrentDirectory();

        try
        {
            File.WriteAllText(
                Path.Combine(tempDir, "appsettings.json"),
                """{ "DoctorProbe": "from-json" }""");

            Directory.SetCurrentDirectory(tempDir);

            IConfiguration configuration = DoctorLocalConfiguration.CreateForDoctor();

            configuration["DoctorProbe"].Should().Be("from-json");
        }
        finally
        {
            Directory.SetCurrentDirectory(previousCwd);

            try
            {
                Directory.Delete(tempDir, recursive: true);
            }
            catch (IOException)
            {
                // Best-effort cleanup for temp probe directory.
            }
        }
    }

    private static string? ResolveRepositoryRootFromTestContext()
    {
        DirectoryInfo? directory = new(AppContext.BaseDirectory);

        for (int ascent = 0; ascent < 12 && directory is not null; ascent++)
        {
            if (File.Exists(Path.Combine(directory.FullName, "ArchLucid.sln")))
                return directory.FullName;

            directory = directory.Parent;
        }

        return null;
    }
}
