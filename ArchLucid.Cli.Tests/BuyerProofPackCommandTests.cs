using System.Globalization;
using System.IO.Compression;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;

using ArchLucid.Cli;
using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

/// <summary>
///     Exercises <see cref="BuyerProofPackCommand" /> ZIP staging against a loopback HTTP stub (no external API).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class BuyerProofPackCommandTests : IDisposable
{
    private readonly string _emptyCwd;
    private readonly string? _prevApiUrl;

    public BuyerProofPackCommandTests()
    {
        _emptyCwd = Path.Combine(Path.GetTempPath(), "ArchLucidCliBuyerProofPackTests." + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_emptyCwd);
        _prevApiUrl = Environment.GetEnvironmentVariable("ARCHLUCID_API_URL");
    }

    public void Dispose()
    {
        try
        {
            if (Directory.Exists(_emptyCwd))
                Directory.Delete(_emptyCwd, true);
        }
        catch (IOException)
        {
            // Best-effort cleanup on locked temp dirs (Windows AV/indexers).
        }

        RestoreApiUrlEnv();
    }

    private void RestoreApiUrlEnv()
    {
        if (_prevApiUrl is null)
            Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", null);
        else
            Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", _prevApiUrl);
    }

    private static string ResolveRepositoryRootFromTests()
    {
        DirectoryInfo? directory = new(AppContext.BaseDirectory);

        for (int ascent = 0; ascent < 28 && directory is not null; ascent++)
        {
            string marker = Path.Combine(directory.FullName, "docs", "go-to-market", "MARKETPLACE_PUBLICATION.md");

            if (File.Exists(marker))
                return directory.FullName;

            directory = directory.Parent;
        }

        throw new InvalidOperationException(
            "Could not locate repository root from test output directory (missing docs/go-to-market/MARKETPLACE_PUBLICATION.md).");
    }

    [Fact]
    public async Task RunAsync_null_args_throws_ArgumentNullException()
    {
        Func<Task> act = async () => await BuyerProofPackCommand.RunAsync(null!);

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName("args");
    }

    [Fact]
    public async Task RunAsync_usage_when_run_or_out_missing()
    {
        StringWriter err = new(CultureInfo.InvariantCulture);
        TextWriter prevErr = Console.Error;

        try
        {
            Console.SetError(err);
            Directory.SetCurrentDirectory(_emptyCwd);

            int exit =
                await BuyerProofPackCommand.RunAsync(["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"]);

            exit.Should().Be(CliExitCode.UsageError);
            err.ToString().Should().Contain("Usage:");
        }
        finally
        {
            Console.SetError(prevErr);
        }
    }

    [Fact]
    public async Task RunAsync_usage_when_out_value_missing()
    {
        StringWriter err = new(CultureInfo.InvariantCulture);
        TextWriter prevErr = Console.Error;

        try
        {
            Console.SetError(err);
            Directory.SetCurrentDirectory(_emptyCwd);

            int exit = await BuyerProofPackCommand.RunAsync(
                ["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "--out"]);

            exit.Should().Be(CliExitCode.UsageError);
            err.ToString().Should().Contain("Missing value for --out.");
        }
        finally
        {
            Console.SetError(prevErr);
        }
    }

    [Fact]
    public async Task RunAsync_usage_when_repo_root_value_missing()
    {
        StringWriter err = new(CultureInfo.InvariantCulture);
        TextWriter prevErr = Console.Error;

        try
        {
            Console.SetError(err);
            Directory.SetCurrentDirectory(_emptyCwd);

            int exit = await BuyerProofPackCommand.RunAsync(
                ["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "--out", Path.Combine(_emptyCwd, "x.zip"), "--repo-root"]);

            exit.Should().Be(CliExitCode.UsageError);
            err.ToString().Should().Contain("Missing value for --repo-root.");
        }
        finally
        {
            Console.SetError(prevErr);
        }
    }

    [Fact]
    public async Task RunAsync_usage_when_flag_unknown()
    {
        StringWriter err = new(CultureInfo.InvariantCulture);
        TextWriter prevErr = Console.Error;

        try
        {
            Console.SetError(err);
            Directory.SetCurrentDirectory(_emptyCwd);

            int exit = await BuyerProofPackCommand.RunAsync(
                ["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "--out", Path.Combine(_emptyCwd, "x.zip"), "--what"]);

            exit.Should().Be(CliExitCode.UsageError);
            err.ToString().Should().Contain("Unexpected flag");
        }
        finally
        {
            Console.SetError(prevErr);
        }
    }

    [Fact]
    public async Task RunAsync_usage_when_more_than_one_run_id()
    {
        StringWriter err = new(CultureInfo.InvariantCulture);
        TextWriter prevErr = Console.Error;

        try
        {
            Console.SetError(err);
            Directory.SetCurrentDirectory(_emptyCwd);

            int exit = await BuyerProofPackCommand.RunAsync(
                ["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "--out",
                    Path.Combine(_emptyCwd, "x.zip")]);

            exit.Should().Be(CliExitCode.UsageError);
            err.ToString().Should().Contain("Only one run id is supported.");
        }
        finally
        {
            Console.SetError(prevErr);
        }
    }

    [Fact]
    public async Task RunAsync_usage_when_repository_root_cannot_be_resolved_from_isolated_cwd()
    {
        StringWriter err = new(CultureInfo.InvariantCulture);
        TextWriter prevErr = Console.Error;
        string prevCwd = Directory.GetCurrentDirectory();

        try
        {
            Console.SetError(err);
            Directory.SetCurrentDirectory(_emptyCwd);

            int exit = await BuyerProofPackCommand.RunAsync(
                ["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "--out", Path.Combine(_emptyCwd, "x.zip")]);

            exit.Should().Be(CliExitCode.UsageError);
            err.ToString().Should().Contain("Could not locate repository root");
        }
        finally
        {
            Directory.SetCurrentDirectory(prevCwd);
            Console.SetError(prevErr);
        }
    }

    [Fact]
    public async Task RunAsync_missing_executive_sponsor_brief_returns_operation_failed()
    {
        using CancellationTokenSource listenCts = new(TimeSpan.FromSeconds(30));
        await using BuyerProofPackLoopbackApi api = await BuyerProofPackLoopbackApi.StartAsync(listenCts.Token);
        Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", api.BaseUrl.TrimEnd('/'));

        string repoMissingBrief = Path.Combine(Path.GetTempPath(), "ArchLucidCliBuyerProofNoBrief." + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(repoMissingBrief);

        try
        {
            StringWriter errWriter = new(CultureInfo.InvariantCulture);
            TextWriter prevErr = Console.Error;
            string prevCwd = Directory.GetCurrentDirectory();
            Console.SetError(errWriter);

            try
            {
                Directory.SetCurrentDirectory(_emptyCwd);

                int exit = await BuyerProofPackCommand.RunAsync(
                    ["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "--out", Path.Combine(_emptyCwd, "out.zip"), "--repo-root",
                        repoMissingBrief]);

                exit.Should().Be(CliExitCode.OperationFailed);
                errWriter.ToString().Should().Contain("Missing sponsor brief");
            }
            finally
            {
                Directory.SetCurrentDirectory(prevCwd);
                Console.SetError(prevErr);
                RestoreApiUrlEnv();
            }
        }
        finally
        {
            if (Directory.Exists(repoMissingBrief))
                Directory.Delete(repoMissingBrief, true);
        }
    }

    [Fact]
    public async Task RunAsync_writes_zip_with_manifest_and_expected_entries()
    {
        using CancellationTokenSource listenCts = new(TimeSpan.FromSeconds(30));
        await using BuyerProofPackLoopbackApi api = await BuyerProofPackLoopbackApi.StartAsync(listenCts.Token);
        Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", api.BaseUrl.TrimEnd('/'));

        string repoRoot = ResolveRepositoryRootFromTests();
        string zipPath = Path.Combine(_emptyCwd, "buyer-pack.zip");

        StringWriter errWriter = new(CultureInfo.InvariantCulture);
        TextWriter prevErr = Console.Error;
        string prevCwd = Directory.GetCurrentDirectory();
        Console.SetError(errWriter);

        try
        {
            Directory.SetCurrentDirectory(_emptyCwd);

            int exit = await BuyerProofPackCommand.RunAsync(
                ["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "--out", zipPath, "--repo-root", repoRoot]);

            exit.Should().Be(CliExitCode.Success, $"stderr: {errWriter}");
            File.Exists(zipPath).Should().BeTrue();

            await using FileStream zipFs = new(zipPath, FileMode.Open, FileAccess.Read, FileShare.Read);
            using ZipArchive zip = new(zipFs, ZipArchiveMode.Read);

            string[] names = zip.Entries.Select(e => e.FullName.Replace('\\', '/')).OrderBy(static x => x).ToArray();

            names.Should().Contain("pack-manifest.json");
            names.Should().Contain("first-value-report.md");
            names.Should().Contain("first-value-report.pdf");
            names.Should().Contain("pilot-run-deltas.json");
            names.Should().Contain("artifact-and-proof-summary.md");
            names.Should().Contain("executive-sponsor-brief.md");
            names.Should().Contain("trust-posture-pointer.md");
            names.Should().Contain("pilot-scorecard-blank.md");

            ZipArchiveEntry manifestEntry = zip.GetEntry("pack-manifest.json")!;
            await using Stream manifestStream = manifestEntry.Open();
            using StreamReader sr = new(manifestStream, Encoding.UTF8);
            string manifestJson = await sr.ReadToEndAsync();

            using JsonDocument doc = JsonDocument.Parse(manifestJson);
            JsonElement files = doc.RootElement.GetProperty("files");

            files.GetArrayLength().Should().Be(7);
            files.EnumerateArray().Select(e => e.GetProperty("path").GetString()).Should().Contain("first-value-report.md");
        }
        finally
        {
            Directory.SetCurrentDirectory(prevCwd);
            Console.SetError(prevErr);
            RestoreApiUrlEnv();
        }
    }

    [Fact]
    public async Task RunAsync_returns_usage_when_pilot_run_deltas_not_found()
    {
        using CancellationTokenSource listenCts = new(TimeSpan.FromSeconds(30));
        await using BuyerProofPackLoopbackApi api = await BuyerProofPackLoopbackApi.StartAsync(listenCts.Token);
        api.PilotRunDeltasStatusCode = 404;

        Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", api.BaseUrl.TrimEnd('/'));

        string repoRoot = ResolveRepositoryRootFromTests();
        StringWriter errWriter = new(CultureInfo.InvariantCulture);
        TextWriter prevErr = Console.Error;
        string prevCwd = Directory.GetCurrentDirectory();

        try
        {
            Directory.SetCurrentDirectory(_emptyCwd);
            Console.SetError(errWriter);

            int exit = await BuyerProofPackCommand.RunAsync(
                ["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "--out", Path.Combine(_emptyCwd, "nf.zip"), "--repo-root",
                    repoRoot]);

            exit.Should().Be(CliExitCode.UsageError);
            errWriter.ToString().Should().Contain("was not found");
        }
        finally
        {
            Directory.SetCurrentDirectory(prevCwd);
            Console.SetError(prevErr);
            RestoreApiUrlEnv();
        }
    }

    [Fact]
    public async Task RunAsync_returns_operation_failed_when_deltas_http_error_with_body_on_stderr()
    {
        using CancellationTokenSource listenCts = new(TimeSpan.FromSeconds(30));
        await using BuyerProofPackLoopbackApi api = await BuyerProofPackLoopbackApi.StartAsync(listenCts.Token);
        api.PilotRunDeltasStatusCode = 503;
        api.PilotRunDeltasJson = """{"detail":"circuit open"}""";

        Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", api.BaseUrl.TrimEnd('/'));

        string repoRoot = ResolveRepositoryRootFromTests();
        StringWriter errWriter = new(CultureInfo.InvariantCulture);
        TextWriter prevErr = Console.Error;
        string prevCwd = Directory.GetCurrentDirectory();

        try
        {
            Directory.SetCurrentDirectory(_emptyCwd);
            Console.SetError(errWriter);

            int exit = await BuyerProofPackCommand.RunAsync(
                ["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "--out", Path.Combine(_emptyCwd, "e.zip"), "--repo-root",
                    repoRoot]);

            exit.Should().Be(CliExitCode.OperationFailed);
            errWriter.ToString().Should().Contain("Error fetching pilot-run-deltas");
            errWriter.ToString().Should().Contain("circuit open");
        }
        finally
        {
            Directory.SetCurrentDirectory(prevCwd);
            Console.SetError(prevErr);
            RestoreApiUrlEnv();
        }
    }

    [Fact]
    public async Task RunAsync_returns_usage_when_commit_guard_missing_proof_block()
    {
        using CancellationTokenSource listenCts = new(TimeSpan.FromSeconds(30));
        await using BuyerProofPackLoopbackApi api = await BuyerProofPackLoopbackApi.StartAsync(listenCts.Token);
        api.PilotRunDeltasJson = """{"isDemoTenant":false,"findingsBySeverity":[]}""";

        Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", api.BaseUrl.TrimEnd('/'));

        string repoRoot = ResolveRepositoryRootFromTests();
        StringWriter errWriter = new(CultureInfo.InvariantCulture);
        TextWriter prevErr = Console.Error;
        string prevCwd = Directory.GetCurrentDirectory();

        try
        {
            Directory.SetCurrentDirectory(_emptyCwd);
            Console.SetError(errWriter);

            int exit = await BuyerProofPackCommand.RunAsync(
                ["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "--out", Path.Combine(_emptyCwd, "g.zip"), "--repo-root",
                    repoRoot]);

            exit.Should().Be(CliExitCode.UsageError);
            errWriter.ToString().Should().Contain("proofPackageCompleteness");
        }
        finally
        {
            Directory.SetCurrentDirectory(prevCwd);
            Console.SetError(prevErr);
            RestoreApiUrlEnv();
        }
    }

    [Fact]
    public async Task RunAsync_returns_usage_when_run_not_committed()
    {
        using CancellationTokenSource listenCts = new(TimeSpan.FromSeconds(30));
        await using BuyerProofPackLoopbackApi api = await BuyerProofPackLoopbackApi.StartAsync(listenCts.Token);
        api.PilotRunDeltasJson =
            """
            {"isDemoTenant":false,"proofPackageCompleteness":{"runInCommittedStatus":false},"findingsBySeverity":[]}
            """;

        Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", api.BaseUrl.TrimEnd('/'));

        string repoRoot = ResolveRepositoryRootFromTests();
        StringWriter errWriter = new(CultureInfo.InvariantCulture);
        TextWriter prevErr = Console.Error;
        string prevCwd = Directory.GetCurrentDirectory();

        try
        {
            Directory.SetCurrentDirectory(_emptyCwd);
            Console.SetError(errWriter);

            int exit = await BuyerProofPackCommand.RunAsync(
                ["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "--out", Path.Combine(_emptyCwd, "nc.zip"), "--repo-root",
                    repoRoot]);

            exit.Should().Be(CliExitCode.UsageError);
            errWriter.ToString().Should().Contain("not in committed status");
        }
        finally
        {
            Directory.SetCurrentDirectory(prevCwd);
            Console.SetError(prevErr);
            RestoreApiUrlEnv();
        }
    }

    [Fact]
    public async Task RunAsync_returns_operation_failed_when_first_value_markdown_not_success()
    {
        using CancellationTokenSource listenCts = new(TimeSpan.FromSeconds(30));
        await using BuyerProofPackLoopbackApi api = await BuyerProofPackLoopbackApi.StartAsync(listenCts.Token);
        api.FirstValueReportStatusCode = 500;

        Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", api.BaseUrl.TrimEnd('/'));

        string repoRoot = ResolveRepositoryRootFromTests();
        StringWriter errWriter = new(CultureInfo.InvariantCulture);
        TextWriter prevErr = Console.Error;
        string prevCwd = Directory.GetCurrentDirectory();

        try
        {
            Directory.SetCurrentDirectory(_emptyCwd);
            Console.SetError(errWriter);

            int exit = await BuyerProofPackCommand.RunAsync(
                ["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "--out", Path.Combine(_emptyCwd, "md.zip"), "--repo-root",
                    repoRoot]);

            exit.Should().Be(CliExitCode.OperationFailed);
            errWriter.ToString().Should().Contain("Error fetching first-value Markdown");
        }
        finally
        {
            Directory.SetCurrentDirectory(prevCwd);
            Console.SetError(prevErr);
            RestoreApiUrlEnv();
        }
    }

    [Fact]
    public async Task RunAsync_returns_operation_failed_when_pdf_not_success()
    {
        using CancellationTokenSource listenCts = new(TimeSpan.FromSeconds(30));
        await using BuyerProofPackLoopbackApi api = await BuyerProofPackLoopbackApi.StartAsync(listenCts.Token);
        api.PdfStatusCode = 502;

        Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", api.BaseUrl.TrimEnd('/'));

        string repoRoot = ResolveRepositoryRootFromTests();
        StringWriter errWriter = new(CultureInfo.InvariantCulture);
        TextWriter prevErr = Console.Error;
        string prevCwd = Directory.GetCurrentDirectory();

        try
        {
            Directory.SetCurrentDirectory(_emptyCwd);
            Console.SetError(errWriter);

            int exit = await BuyerProofPackCommand.RunAsync(
                ["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "--out", Path.Combine(_emptyCwd, "pdf.zip"), "--repo-root",
                    repoRoot]);

            exit.Should().Be(CliExitCode.OperationFailed);
            errWriter.ToString().Should().Contain("Error fetching first-value PDF");
        }
        finally
        {
            Directory.SetCurrentDirectory(prevCwd);
            Console.SetError(prevErr);
            RestoreApiUrlEnv();
        }
    }

    [Fact]
    public async Task RunAsync_with_api_key_env_still_produces_zip()
    {
        using CancellationTokenSource listenCts = new(TimeSpan.FromSeconds(30));
        await using BuyerProofPackLoopbackApi api = await BuyerProofPackLoopbackApi.StartAsync(listenCts.Token);
        Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", api.BaseUrl.TrimEnd('/'));
        string? prevKey = Environment.GetEnvironmentVariable("ARCHLUCID_API_KEY");

        try
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_API_KEY", "unit-test-key");

            string repoRoot = ResolveRepositoryRootFromTests();
            string zipPath = Path.Combine(_emptyCwd, "keyed.zip");
            StringWriter errWriter = new(CultureInfo.InvariantCulture);
            TextWriter prevErr = Console.Error;
            string prevCwd = Directory.GetCurrentDirectory();

            try
            {
                Directory.SetCurrentDirectory(_emptyCwd);
                Console.SetError(errWriter);

                int exit = await BuyerProofPackCommand.RunAsync(
                    ["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "--out", zipPath, "--repo-root", repoRoot]);

                exit.Should().Be(CliExitCode.Success, $"stderr: {errWriter}");
                File.Exists(zipPath).Should().BeTrue();
            }
            finally
            {
                Directory.SetCurrentDirectory(prevCwd);
                Console.SetError(prevErr);
            }
        }
        finally
        {
            if (prevKey is null)
                Environment.SetEnvironmentVariable("ARCHLUCID_API_KEY", null);
            else
                Environment.SetEnvironmentVariable("ARCHLUCID_API_KEY", prevKey);

            RestoreApiUrlEnv();
        }
    }

    [Fact]
    public async Task RunAsync_manifest_reflects_demo_tenant_warning()
    {
        using CancellationTokenSource listenCts = new(TimeSpan.FromSeconds(30));
        await using BuyerProofPackLoopbackApi api = await BuyerProofPackLoopbackApi.StartAsync(listenCts.Token);
        api.PilotRunDeltasJson =
            """
            {"isDemoTenant":true,"proofPackageCompleteness":{"runInCommittedStatus":true},"findingsBySeverity":[]}
            """;

        Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", api.BaseUrl.TrimEnd('/'));

        string repoRoot = ResolveRepositoryRootFromTests();
        string zipPath = Path.Combine(_emptyCwd, "demo-warning.zip");
        StringWriter errWriter = new(CultureInfo.InvariantCulture);
        TextWriter prevErr = Console.Error;
        string prevCwd = Directory.GetCurrentDirectory();

        try
        {
            Directory.SetCurrentDirectory(_emptyCwd);
            Console.SetError(errWriter);

            int exit = await BuyerProofPackCommand.RunAsync(
                ["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "--out", zipPath, "--repo-root", repoRoot]);

            exit.Should().Be(CliExitCode.Success, $"stderr: {errWriter}");

            await using FileStream zipFs = new(zipPath, FileMode.Open, FileAccess.Read, FileShare.Read);
            using ZipArchive zip = new(zipFs, ZipArchiveMode.Read);
            ZipArchiveEntry manifestEntry = zip.GetEntry("pack-manifest.json")!;
            await using Stream manifestStream = manifestEntry.Open();
            using StreamReader sr = new(manifestStream, Encoding.UTF8);
            string manifestJson = await sr.ReadToEndAsync();

            using JsonDocument doc = JsonDocument.Parse(manifestJson);
            doc.RootElement.GetProperty("demoDataWarning").GetBoolean().Should().BeTrue();
        }
        finally
        {
            Directory.SetCurrentDirectory(prevCwd);
            Console.SetError(prevErr);
            RestoreApiUrlEnv();
        }
    }

    [Fact]
    public async Task RunAsync_artifact_summary_covers_json_branches()
    {
        using CancellationTokenSource listenCts = new(TimeSpan.FromSeconds(30));
        await using BuyerProofPackLoopbackApi api = await BuyerProofPackLoopbackApi.StartAsync(listenCts.Token);
        api.PilotRunDeltasJson =
            """
            {
              "isDemoTenant": false,
              "proofPackageCompleteness": {
                "runInCommittedStatus": true,
                "label": "ok",
                "ratio": 0.5,
                "flag": true,
                "inactive": false,
                "absent": null,
                "nested": { "x": 1 }
              },
              "findingsBySeverity": [
                { "severity": "High", "count": 2 },
                { "severity": "Low" }
              ],
              "topFindingId": "finding-abc"
            }
            """;

        Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", api.BaseUrl.TrimEnd('/'));

        string repoRoot = ResolveRepositoryRootFromTests();
        string zipPath = Path.Combine(_emptyCwd, "rich-summary.zip");
        StringWriter errWriter = new(CultureInfo.InvariantCulture);
        TextWriter prevErr = Console.Error;
        string prevCwd = Directory.GetCurrentDirectory();

        try
        {
            Directory.SetCurrentDirectory(_emptyCwd);
            Console.SetError(errWriter);

            int exit = await BuyerProofPackCommand.RunAsync(
                ["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "--out", zipPath, "--repo-root", repoRoot]);

            exit.Should().Be(CliExitCode.Success, $"stderr: {errWriter}");

            await using FileStream zipFs = new(zipPath, FileMode.Open, FileAccess.Read, FileShare.Read);
            using ZipArchive zip = new(zipFs, ZipArchiveMode.Read);
            ZipArchiveEntry summaryEntry = zip.GetEntry("artifact-and-proof-summary.md")!;
            await using Stream s = summaryEntry.Open();
            using StreamReader reader = new(s, Encoding.UTF8);
            string md = await reader.ReadToEndAsync();

            md.Should().Contain("Proof-package completeness");
            md.Should().Contain("`label`");
            md.Should().Contain("0.5");
            md.Should().Contain("`true`");
            md.Should().Contain("`null`");
            md.Should().Contain("(complex)");
            md.Should().Contain("| High | 2 |");
            md.Should().Contain("finding-abc");
            md.Should().Contain("`false`");
        }
        finally
        {
            Directory.SetCurrentDirectory(prevCwd);
            Console.SetError(prevErr);
            RestoreApiUrlEnv();
        }
    }

    [Fact]
    public async Task RunAsync_artifact_summary_handles_non_array_findings_and_omits_top_finding_section()
    {
        using CancellationTokenSource listenCts = new(TimeSpan.FromSeconds(30));
        await using BuyerProofPackLoopbackApi api = await BuyerProofPackLoopbackApi.StartAsync(listenCts.Token);
        api.PilotRunDeltasJson =
            """
            {
              "isDemoTenant": false,
              "proofPackageCompleteness": { "runInCommittedStatus": true, "inactive": false },
              "findingsBySeverity": { "oops": "not-an-array" }
            }
            """;

        Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", api.BaseUrl.TrimEnd('/'));

        string repoRoot = ResolveRepositoryRootFromTests();
        string zipPath = Path.Combine(_emptyCwd, "sparse-summary.zip");
        StringWriter errWriter = new(CultureInfo.InvariantCulture);
        TextWriter prevErr = Console.Error;
        string prevCwd = Directory.GetCurrentDirectory();

        try
        {
            Directory.SetCurrentDirectory(_emptyCwd);
            Console.SetError(errWriter);

            int exit = await BuyerProofPackCommand.RunAsync(
                ["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "--out", zipPath, "--repo-root", repoRoot]);

            exit.Should().Be(CliExitCode.Success, $"stderr: {errWriter}");

            await using FileStream zipFs = new(zipPath, FileMode.Open, FileAccess.Read, FileShare.Read);
            using ZipArchive zip = new(zipFs, ZipArchiveMode.Read);
            ZipArchiveEntry summaryEntry = zip.GetEntry("artifact-and-proof-summary.md")!;
            await using Stream s = summaryEntry.Open();
            using StreamReader reader = new(s, Encoding.UTF8);
            string md = await reader.ReadToEndAsync();

            md.Should().Contain("(No severity buckets in response.)");
            md.Should().NotContain("Top finding id");
        }
        finally
        {
            Directory.SetCurrentDirectory(prevCwd);
            Console.SetError(prevErr);
            RestoreApiUrlEnv();
        }
    }

    [Fact]
    public async Task RunAsync_creates_nested_output_directory_and_can_overwrite_zip()
    {
        using CancellationTokenSource listenCts = new(TimeSpan.FromSeconds(30));
        await using BuyerProofPackLoopbackApi api = await BuyerProofPackLoopbackApi.StartAsync(listenCts.Token);
        Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", api.BaseUrl.TrimEnd('/'));

        string repoRoot = ResolveRepositoryRootFromTests();
        string nestedDir = Path.Combine(_emptyCwd, "nested", "out");
        string zipPath = Path.Combine(nestedDir, "pack.zip");
        StringWriter errWriter = new(CultureInfo.InvariantCulture);
        TextWriter prevErr = Console.Error;
        string prevCwd = Directory.GetCurrentDirectory();

        try
        {
            Directory.SetCurrentDirectory(_emptyCwd);
            Console.SetError(errWriter);

            int first = await BuyerProofPackCommand.RunAsync(
                ["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "--out", zipPath, "--repo-root", repoRoot]);

            first.Should().Be(CliExitCode.Success, $"stderr: {errWriter}");
            Directory.Exists(nestedDir).Should().BeTrue();

            int second = await BuyerProofPackCommand.RunAsync(
                ["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "--out", zipPath, "--repo-root", repoRoot]);

            second.Should().Be(CliExitCode.Success, $"stderr: {errWriter}");
            new FileInfo(zipPath).Length.Should().BeGreaterThan(0);
        }
        finally
        {
            Directory.SetCurrentDirectory(prevCwd);
            Console.SetError(prevErr);
            RestoreApiUrlEnv();
        }
    }

    /// <summary>
    ///     Minimal loopback server for <see cref="BuyerProofPackCommand" /> HTTP sequencing (health → deltas → markdown → pdf).
    /// </summary>
    private sealed class BuyerProofPackLoopbackApi : IAsyncDisposable
    {
        private static readonly byte[] MinimalPdfBytes = Encoding.ASCII.GetBytes("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

        private readonly HttpListener _listener = new();
        private readonly CancellationTokenSource _runnerCts = new();
        private Task _runner = Task.CompletedTask;

        private BuyerProofPackLoopbackApi(string baseUrl) => BaseUrl = baseUrl;

        public string BaseUrl
        {
            get;
        }

        /// <summary>HTTP status returned for GET pilot-run-deltas (default 200).</summary>
        public int PilotRunDeltasStatusCode { get; set; } = 200;

        public string PilotRunDeltasJson { get; set; } =
            """
            {"isDemoTenant":false,"proofPackageCompleteness":{"runInCommittedStatus":true},"findingsBySeverity":[],"topFindingId":"finding-demo"}
            """;

        public int FirstValueReportStatusCode { get; set; } = 200;

        public string FirstValueReportMarkdown { get; set; } = "# First value report\n\nstub";

        public int PdfStatusCode { get; set; } = 200;

        public string PdfFailureBody { get; set; } = "pdf error";

        public static async Task<BuyerProofPackLoopbackApi> StartAsync(CancellationToken ct)
        {
            int port = await ReserveFreeTcpPortAsync(ct);
            BuyerProofPackLoopbackApi api = new($"http://127.0.0.1:{port}/");
            api._listener.Prefixes.Add(api.BaseUrl);
            api._listener.Start();
            api._runner = Task.Run(() => api.AcceptLoopAsync(api._runnerCts.Token), CancellationToken.None);

            return api;
        }

        private static Task<int> ReserveFreeTcpPortAsync(CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();
            TcpListener tcp = new(IPAddress.Loopback, 0);
            tcp.Start();

            try
            {
                return Task.FromResult(((IPEndPoint)tcp.LocalEndpoint).Port);
            }
            finally
            {
                tcp.Stop();
            }
        }

        private async Task AcceptLoopAsync(CancellationToken ct)
        {
            while (!ct.IsCancellationRequested)
            {
                HttpListenerContext ctx;

                try
                {
                    ctx = await _listener.GetContextAsync().WaitAsync(ct);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (HttpListenerException)
                {
                    break;
                }
                catch (ObjectDisposedException)
                {
                    break;
                }

                try
                {
                    await HandleRequestAsync(ctx);
                }
                catch
                {
                    try
                    {
                        ctx.Response.StatusCode = 500;
                    }
                    catch (ObjectDisposedException)
                    {
                        // Ignore — client may have aborted.
                    }
                }
            }
        }

        private async Task HandleRequestAsync(HttpListenerContext ctx)
        {
            string path = ctx.Request.Url!.AbsolutePath.TrimEnd('/');
            string method = ctx.Request.HttpMethod.ToUpperInvariant();

            if (string.Equals(path, "/health/live", StringComparison.OrdinalIgnoreCase)
                && string.Equals(method, "GET", StringComparison.Ordinal))
            {
                await WriteTextAsync(ctx.Response, 200, "healthy");

                return;
            }

            if (path.EndsWith("/pilot-run-deltas", StringComparison.OrdinalIgnoreCase)
                && string.Equals(method, "GET", StringComparison.Ordinal))
            {
                await WriteJsonAsync(ctx.Response, PilotRunDeltasStatusCode, PilotRunDeltasJson);

                return;
            }

            if (path.EndsWith("/first-value-report", StringComparison.OrdinalIgnoreCase)
                && string.Equals(method, "GET", StringComparison.Ordinal))
            {
                await WriteTextAsync(ctx.Response, FirstValueReportStatusCode, FirstValueReportMarkdown);

                return;
            }

            if (path.EndsWith("/first-value-report.pdf", StringComparison.OrdinalIgnoreCase)
                && string.Equals(method, "POST", StringComparison.Ordinal))
            {
                if (PdfStatusCode != 200)
                {
                    await WriteTextAsync(ctx.Response, PdfStatusCode, PdfFailureBody);

                    return;
                }

                ctx.Response.StatusCode = 200;
                ctx.Response.ContentType = "application/pdf";
                await ctx.Response.OutputStream.WriteAsync(MinimalPdfBytes);
                ctx.Response.Close();

                return;
            }

            ctx.Response.StatusCode = 404;
            ctx.Response.Close();
        }

        private static async Task WriteTextAsync(HttpListenerResponse response, int status, string body)
        {
            response.StatusCode = status;
            response.ContentType = "text/plain; charset=utf-8";
            byte[] bytes = Encoding.UTF8.GetBytes(body);
            response.ContentLength64 = bytes.Length;
            await response.OutputStream.WriteAsync(bytes);
            response.Close();
        }

        private static async Task WriteJsonAsync(HttpListenerResponse response, int status, string json)
        {
            response.StatusCode = status;
            response.ContentType = "application/json; charset=utf-8";
            byte[] bytes = Encoding.UTF8.GetBytes(json);
            response.ContentLength64 = bytes.Length;
            await response.OutputStream.WriteAsync(bytes);
            response.Close();
        }

        public async ValueTask DisposeAsync()
        {
            await _runnerCts.CancelAsync();

            try
            {
                _listener.Stop();
            }
            catch (HttpListenerException)
            {
                // Ignore shutdown races.
            }
            catch (ObjectDisposedException)
            {
                // Ignore shutdown races.
            }

            _listener.Close();

            try
            {
                await _runner;
            }
            catch (OperationCanceledException)
            {
                // Expected during cooperative shutdown.
            }

            _runnerCts.Dispose();
        }
    }
}
