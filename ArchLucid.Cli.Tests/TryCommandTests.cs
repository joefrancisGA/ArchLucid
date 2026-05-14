using ArchLucid.Cli;
using ArchLucid.Cli.Commands;
using ArchLucid.Cli.Real;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

/// <summary>
///     Unit tests for <see cref="TryCommand" /> and <see cref="TryCommandOptions" />.
///     Covers the three guarantees the spec requires:
///     1. Argument parsing (defaults + flags + invalid input).
///     2. Missing-Docker handling (no <c>docker-compose.yml</c> in any ancestor of cwd).
///     3. Readiness-poll timeout (the polling helper returns the last observed status when the
///     deadline elapses without ever reaching <see cref="ArchitectureRunStatus.ReadyForCommit" />).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TryCommandTests
{
    private const string SyntheticComposeDirectory = @"C:\ArchLucidCliTryTestsSyntheticCompose";

    [Fact]
    public async Task RunAsync_parse_failure_writes_usage_message_and_returns_usage_error()
    {
        StringWriter capturedOut = new();
        TextWriter prevOut = Console.Out;

        try
        {
            Console.SetOut(capturedOut);
            int exit = await TryCommand.RunAsync(["--unknown-flag"]);

            exit.Should().Be(CliExitCode.UsageError);
            capturedOut.ToString().Should().Contain("Unknown argument for 'try'");
        }
        finally
        {
            Console.SetOut(prevOut);
        }
    }

    [Fact]
    public async Task RunCoreAsync_null_options_throws()
    {
        TryCommandHooks hooks = MakeHooks(() => SyntheticComposeDirectory);
        StringWriter output = new();

        Func<Task> act = async () => await TryCommand.RunCoreAsync(null!, hooks, output);

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName("options");
    }

    [Fact]
    public async Task RunCoreAsync_null_hooks_throws()
    {
        TryCommandOptions options = new();
        StringWriter output = new();

        Func<Task> act = async () => await TryCommand.RunCoreAsync(options, null!, output);

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName("hooks");
    }

    [Fact]
    public async Task RunCoreAsync_null_output_throws()
    {
        TryCommandOptions options = new();
        TryCommandHooks hooks = MakeHooks(() => SyntheticComposeDirectory);

        Func<Task> act = async () => await TryCommand.RunCoreAsync(options, hooks, null!);

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName("output");
    }

    [Fact]
    public async Task RunCoreAsync_real_mode_without_archlucid_real_aoai_gate_returns_usage_error()
    {
        string? saved = Environment.GetEnvironmentVariable(TryCommandOptions.ArchLucidRealAoaiEnv);

        try
        {
            Environment.SetEnvironmentVariable(TryCommandOptions.ArchLucidRealAoaiEnv, "0");

            StringWriter output = new();
            TryCommandOptions options = new() { RealMode = true };
            TryCommandHooks hooks = MakeHooks(() => SyntheticComposeDirectory);

            int exit = await TryCommand.RunCoreAsync(options, hooks, output);

            exit.Should().Be(CliExitCode.UsageError);
            output.ToString().Should().Contain(TryCommandOptions.ArchLucidRealAoaiEnv);
        }
        finally
        {
            RestoreEnvVar(TryCommandOptions.ArchLucidRealAoaiEnv, saved);
        }
    }

    [Fact]
    public async Task RunCoreAsync_real_attempt_preflight_failure_returns_usage_error()
    {
        string? saved = Environment.GetEnvironmentVariable(TryCommandOptions.ArchLucidRealAoaiEnv);

        try
        {
            Environment.SetEnvironmentVariable(TryCommandOptions.ArchLucidRealAoaiEnv, "1");

            StringWriter output = new();
            TryCommandOptions options = new() { RealMode = true };
            TryCommandHooks hooks = MakeHooks(
                () => SyntheticComposeDirectory,
                validateRealModeEnv: () => new RealModePreflightResult(false, ["AZURE_OPENAI_ENDPOINT"], "missing keys"));

            int exit = await TryCommand.RunCoreAsync(options, hooks, output);

            exit.Should().Be(CliExitCode.UsageError);
            output.ToString().Should().Contain("missing keys");
        }
        finally
        {
            RestoreEnvVar(TryCommandOptions.ArchLucidRealAoaiEnv, saved);
        }
    }

    [Fact]
    public async Task RunCoreAsync_pilot_up_non_zero_exit_returns_that_code()
    {
        StringWriter output = new();
        TryCommandOptions options = new();
        TryCommandHooks hooks = MakeHooks(
            () => SyntheticComposeDirectory,
            (_, _) => Task.FromResult(CliExitCode.OperationFailed));

        int exit = await TryCommand.RunCoreAsync(options, hooks, output);

        exit.Should().Be(CliExitCode.OperationFailed);
        output.ToString().Should().Contain("Pilot stack failed");
    }

    [Fact]
    public async Task RunCoreAsync_create_run_failure_returns_operation_failed()
    {
        StringWriter output = new();
        TryCommandOptions options = new();
        TryCommandHooks hooks = OrchestrationHooks(
            createRun: (_, _) => Task.FromResult(ArchLucidApiClient.CreateRunResult.Fail(400, "bad payload")));

        int exit = await TryCommand.RunCoreAsync(options, hooks, output);

        exit.Should().Be(CliExitCode.OperationFailed);
        output.ToString().Should().Contain("Could not create sample run");
    }

    [Fact]
    public async Task RunCoreAsync_execute_run_false_emits_note_and_continues()
    {
        StringWriter output = new();
        const string runId = "run-exec-false";
        TryCommandOptions options = new() { CommitDeadline = TimeSpan.FromMilliseconds(500), PollInterval = TimeSpan.FromMilliseconds(30) };
        bool executeInvoked = false;

        TryCommandHooks hooks = OrchestrationHooks(
            runId,
            executeRun: (_, _, _, _) =>
            {
                executeInvoked = true;

                return Task.FromResult(false);
            },
            getRun: (_, id, _) =>
                Task.FromResult<ArchLucidApiClient.GetRunResult?>(new ArchLucidApiClient.GetRunResult
                {
                    Run = new ArchLucidApiClient.RunInfo { RunId = id, Status = ArchitectureRunStatus.ReadyForCommit }
                }));

        int exit = await TryCommand.RunCoreAsync(options, hooks, output);

        executeInvoked.Should().BeTrue();
        exit.Should().Be(CliExitCode.Success);
        output.ToString().Should().Contain("POST /execute did not succeed");
    }

    [Fact]
    public async Task RunCoreAsync_strict_real_when_run_stuck_returns_operation_failed_before_seed()
    {
        string? saved = Environment.GetEnvironmentVariable(TryCommandOptions.ArchLucidRealAoaiEnv);

        try
        {
            Environment.SetEnvironmentVariable(TryCommandOptions.ArchLucidRealAoaiEnv, "1");

            StringWriter output = new();
            TryCommandOptions options = new()
            {
                RealMode = true,
                StrictReal = true,
                CommitDeadline = TimeSpan.FromMilliseconds(200),
                PollInterval = TimeSpan.FromMilliseconds(30)
            };

            TryCommandHooks hooks = OrchestrationHooks(
                "run-strict",
                getRun: (_, id, _) =>
                    Task.FromResult<ArchLucidApiClient.GetRunResult?>(new ArchLucidApiClient.GetRunResult
                    {
                        Run = new ArchLucidApiClient.RunInfo
                        {
                            RunId = id,
                            Status = ArchitectureRunStatus.WaitingForResults
                        }
                    }));

            int exit = await TryCommand.RunCoreAsync(options, hooks, output);

            exit.Should().Be(CliExitCode.OperationFailed);
            output.ToString().Should().Contain("--strict-real");
        }
        finally
        {
            RestoreEnvVar(TryCommandOptions.ArchLucidRealAoaiEnv, saved);
        }
    }

    [Fact]
    public async Task RunCoreAsync_seed_fake_fallback_failure_returns_operation_failed()
    {
        StringWriter output = new();
        TryCommandOptions options = new()
        {
            CommitDeadline = TimeSpan.FromMilliseconds(200),
            PollInterval = TimeSpan.FromMilliseconds(30)
        };

        TryCommandHooks hooks = OrchestrationHooks(
            "run-seed-fail",
            getRun: (_, id, _) =>
                Task.FromResult<ArchLucidApiClient.GetRunResult?>(new ArchLucidApiClient.GetRunResult
                {
                    Run = new ArchLucidApiClient.RunInfo
                    {
                        RunId = id,
                        Status = ArchitectureRunStatus.WaitingForResults
                    }
                }),
            seedFakeResults: (_, _, _, _) =>
                Task.FromResult<ArchLucidApiClient.SeedFakeResultsResult?>(
                    new ArchLucidApiClient.SeedFakeResultsResult(false, 0, "seed denied")));

        int exit = await TryCommand.RunCoreAsync(options, hooks, output);

        exit.Should().Be(CliExitCode.OperationFailed);
        output.ToString().Should().Contain("Seed-fake-results fallback failed");
    }

    [Fact]
    public async Task RunCoreAsync_commit_failure_returns_operation_failed()
    {
        StringWriter output = new();
        TryCommandOptions options = new();
        TryCommandHooks hooks = OrchestrationHooks(
            "run-commit-fail",
            commitRun: (_, _, _) =>
                Task.FromResult<ArchLucidApiClient.CommitRunResult?>(
                    new ArchLucidApiClient.CommitRunResult(false, null, "commit rejected")));

        int exit = await TryCommand.RunCoreAsync(options, hooks, output);

        exit.Should().Be(CliExitCode.OperationFailed);
        output.ToString().Should().Contain("Commit failed");
    }

    [Fact]
    public async Task RunCoreAsync_happy_path_success_opens_artifacts_when_enabled()
    {
        StringWriter output = new();
        TryCommandOptions options = new();
        List<string> openedFiles = [];
        List<string> openedUrls = [];

        TryCommandHooks hooks = OrchestrationHooks(
            "run-happy",
            downloadFirstValueReport: (_, _, _, _) => Task.FromResult(true),
            openFile: p => openedFiles.Add(p),
            openUrl: u => openedUrls.Add(u));

        int exit = await TryCommand.RunCoreAsync(options, hooks, output);

        exit.Should().Be(CliExitCode.Success);
        openedFiles.Should().ContainSingle().Which.Should().Contain("first-value-run-happy.md");
        openedUrls.Should().ContainSingle().Which.Should().Contain("/runs/run-happy");
        output.ToString().Should().Contain("Committed. Manifest version: 7.0.0-test");
    }

    [Fact]
    public async Task RunCoreAsync_report_download_failure_still_returns_success_with_warning()
    {
        StringWriter output = new();
        TryCommandOptions options = new();
        int openFileCalls = 0;

        TryCommandHooks hooks = OrchestrationHooks(
            "run-warn",
            downloadFirstValueReport: (_, _, _, _) => Task.FromResult(false),
            openFile: _ => openFileCalls++,
            openUrl: _ => { });

        int exit = await TryCommand.RunCoreAsync(options, hooks, output);

        exit.Should().Be(CliExitCode.Success);
        openFileCalls.Should().Be(0);
        output.ToString().Should().Contain("first-value report download did not succeed");
    }

    [Fact]
    public async Task RunCoreAsync_no_open_skips_file_and_browser_hooks()
    {
        StringWriter output = new();
        TryCommandOptions options = new() { OpenArtifacts = false };
        int openCalls = 0;

        TryCommandHooks hooks = OrchestrationHooks(
            "run-no-open",
            downloadFirstValueReport: (_, _, _, _) => Task.FromResult(true),
            openFile: _ => openCalls++,
            openUrl: _ => openCalls++);

        int exit = await TryCommand.RunCoreAsync(options, hooks, output);

        exit.Should().Be(CliExitCode.Success);
        openCalls.Should().Be(0);
    }

    [Fact]
    public async Task PollForCommittableStatusAsync_rejects_non_positive_poll_interval()
    {
        Func<Task> act = () => TryCommand.PollForCommittableStatusAsync(
            _ => Task.FromResult<ArchitectureRunStatus?>(ArchitectureRunStatus.Committed),
            TimeSpan.FromSeconds(1),
            TimeSpan.Zero,
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentOutOfRangeException>().WithParameterName("pollInterval");
    }

    [Fact]
    public async Task PollForCommittableStatusAsync_returns_immediately_when_committed()
    {
        int calls = 0;

        ArchitectureRunStatus result = await TryCommand.PollForCommittableStatusAsync(
            _ =>
            {
                calls++;

                return Task.FromResult<ArchitectureRunStatus?>(ArchitectureRunStatus.Committed);
            },
            TimeSpan.FromSeconds(3),
            TimeSpan.FromMilliseconds(25),
            CancellationToken.None);

        result.Should().Be(ArchitectureRunStatus.Committed);
        calls.Should().Be(1);
    }

    [Fact]
    public void Parse_NoArgs_ReturnsDefaults()
    {
        TryCommandOptions? opts = TryCommandOptions.Parse([], out string? error);

        error.Should().BeNull();
        opts.Should().NotBeNull();
        opts.ApiBaseUrl.Should().Be(TryCommandOptions.DefaultApiBaseUrl);
        opts.UiBaseUrl.Should().Be(TryCommandOptions.DefaultUiBaseUrl);
        opts.OpenArtifacts.Should().BeTrue();
        opts.ReadinessDeadline.Should().Be(TryCommandOptions.DefaultReadinessDeadline);
        opts.CommitDeadline.Should().Be(TryCommandOptions.DefaultCommitDeadline);
        opts.RealMode.Should().BeFalse();
        opts.StrictReal.Should().BeFalse();
    }

    [Fact]
    public void Parse_Real_SetsLongerDefaultCommitDeadline()
    {
        TryCommandOptions? opts = TryCommandOptions.Parse(["--real"], out string? error);

        error.Should().BeNull();
        opts!.CommitDeadline.Should().Be(TryCommandOptions.RealModeDefaultCommitDeadline);
        opts.RealMode.Should().BeTrue();
    }

    [Fact]
    public void Parse_Real_WithExplicitCommitDeadline_UsesOverride()
    {
        TryCommandOptions? opts = TryCommandOptions.Parse(["--real", "--commit-deadline", "90"], out string? error);

        error.Should().BeNull();
        opts!.CommitDeadline.Should().Be(TimeSpan.FromSeconds(90));
    }

    [Fact]
    public void Parse_StrictReal_Parses()
    {
        TryCommandOptions? opts = TryCommandOptions.Parse(["--strict-real"], out string? error);

        error.Should().BeNull();
        opts!.StrictReal.Should().BeTrue();
    }

    [Fact]
    public void Parse_NoOpen_DisablesArtifactOpening()
    {
        TryCommandOptions? opts = TryCommandOptions.Parse(["--no-open"], out string? error);

        error.Should().BeNull();
        opts!.OpenArtifacts.Should().BeFalse();
    }

    [Fact]
    public void Parse_OverridesUrlsAndDeadlines()
    {
        TryCommandOptions? opts = TryCommandOptions.Parse(
            [
                "--api-base-url", "http://api.local:8080/",
                "--ui-base-url", "http://ui.local:9090",
                "--readiness-deadline", "60",
                "--commit-deadline", "30"
            ],
            out string? error);

        error.Should().BeNull();
        opts!.ApiBaseUrl.Should().Be("http://api.local:8080");
        opts.UiBaseUrl.Should().Be("http://ui.local:9090");
        opts.ReadinessDeadline.Should().Be(TimeSpan.FromSeconds(60));
        opts.CommitDeadline.Should().Be(TimeSpan.FromSeconds(30));
    }

    [Fact]
    public void Parse_UnknownFlag_ReturnsUsageError()
    {
        TryCommandOptions? opts = TryCommandOptions.Parse(["--bogus"], out string? error);

        opts.Should().BeNull();
        error.Should().NotBeNullOrWhiteSpace();
        error.Should().Contain("--bogus");
    }

    [Fact]
    public void Parse_FlagMissingValue_ReturnsUsageError()
    {
        TryCommandOptions? opts = TryCommandOptions.Parse(["--api-base-url"], out string? error);

        opts.Should().BeNull();
        error.Should().Contain("Missing value for --api-base-url");
    }

    [Fact]
    public void Parse_NonNumericDeadline_ReturnsUsageError()
    {
        TryCommandOptions? opts = TryCommandOptions.Parse(["--commit-deadline", "soon"], out string? error);

        opts.Should().BeNull();
        error.Should().Contain("--commit-deadline");
    }

    [Fact]
    public void Parse_ZeroDeadline_ReturnsUsageError()
    {
        TryCommandOptions? opts = TryCommandOptions.Parse(["--readiness-deadline", "0"], out string? error);

        opts.Should().BeNull();
        error.Should().Contain("--readiness-deadline");
    }

    [Fact]
    public async Task RunCoreAsync_WhenComposeNotFound_PrintsErrorAndReturnsUsageError()
    {
        StringWriter output = new();
        TryCommandOptions options = new();

        // Hooks where every step except FindComposeDirectory throws — proves the orchestrator short-circuits
        // before invoking Docker / API / browser when no docker-compose.yml is reachable from the cwd.
        TryCommandHooks hooks = MakeHooks(() => null);

        int exit = await TryCommand.RunCoreAsync(options, hooks, output);

        exit.Should().Be(CliExitCode.UsageError);
        output.ToString().Should().Contain("docker-compose.yml not found");
    }

    [Fact]
    public async Task PollForCommittableStatusAsync_WhenFailed_ReturnsImmediately()
    {
        ArchitectureRunStatus result = await TryCommand.PollForCommittableStatusAsync(
            _ => Task.FromResult<ArchitectureRunStatus?>(ArchitectureRunStatus.Failed),
            TimeSpan.FromSeconds(5),
            TimeSpan.FromMilliseconds(20),
            CancellationToken.None);

        result.Should().Be(ArchitectureRunStatus.Failed);
    }

    [Fact]
    public async Task
        PollForCommittableStatusAsync_WhenStatusNeverReachesReadyForCommit_ReturnsLastObservedAfterDeadline()
    {
        int callCount = 0;

        // Deadline must stay comfortably above (probe + pollInterval) under loaded CI — a 200ms window
        // intermittently yields only one probe when the thread pool defers the delay continuation.
        ArchitectureRunStatus result = await TryCommand.PollForCommittableStatusAsync(
            _ =>
            {
                callCount++;
                return Task.FromResult<ArchitectureRunStatus?>(ArchitectureRunStatus.WaitingForResults);
            },
            TimeSpan.FromSeconds(2),
            TimeSpan.FromMilliseconds(40),
            CancellationToken.None);

        result.Should().Be(ArchitectureRunStatus.WaitingForResults);
        callCount.Should().BeGreaterThan(1, "the polling loop must iterate before giving up");
    }

    [Fact]
    public async Task PollForCommittableStatusAsync_ReturnsAsSoonAsStatusReachesReadyForCommit()
    {
        int callCount = 0;

        ArchitectureRunStatus result = await TryCommand.PollForCommittableStatusAsync(
            _ =>
            {
                callCount++;
                ArchitectureRunStatus s = callCount switch
                {
                    1 => ArchitectureRunStatus.Created,
                    2 => ArchitectureRunStatus.WaitingForResults,
                    _ => ArchitectureRunStatus.ReadyForCommit
                };
                return Task.FromResult<ArchitectureRunStatus?>(s);
            },
            TimeSpan.FromSeconds(5),
            TimeSpan.FromMilliseconds(20),
            CancellationToken.None);

        result.Should().Be(ArchitectureRunStatus.ReadyForCommit);
        callCount.Should().Be(3);
    }

    [Fact]
    public async Task PollForCommittableStatusAsync_NullProbeResults_DoNotShortCircuitDeadline()
    {
        ArchitectureRunStatus result = await TryCommand.PollForCommittableStatusAsync(
            _ => Task.FromResult<ArchitectureRunStatus?>(null),
            TimeSpan.FromMilliseconds(120),
            TimeSpan.FromMilliseconds(30),
            CancellationToken.None);

        // Never observed a status => returns the initial "Created" sentinel.
        result.Should().Be(ArchitectureRunStatus.Created);
    }

    [Fact]
    public void PollForCommittableStatusAsync_RejectsNonPositiveDeadline()
    {
        Func<Task> act = () => TryCommand.PollForCommittableStatusAsync(
            _ => Task.FromResult<ArchitectureRunStatus?>(ArchitectureRunStatus.Committed),
            TimeSpan.Zero,
            TimeSpan.FromMilliseconds(10),
            CancellationToken.None);

        act.Should().ThrowAsync<ArgumentOutOfRangeException>();
    }

    /// <summary>
    ///     Build a hooks bundle whose entries all throw if invoked. Tests override individual hooks via
    ///     optional parameters when they need a specific path to be exercised.
    /// </summary>
    private static TryCommandHooks MakeHooks(
        Func<string?>? findCompose = null,
        Func<IReadOnlyList<string>, CancellationToken, Task<int>>? pilotUp = null,
        Func<RealModePreflightResult>? validateRealModeEnv = null)
    {
        return new TryCommandHooks
        {
            FindComposeDirectory =
                findCompose ?? (() =>
                    throw new InvalidOperationException("FindComposeDirectory should not have been invoked.")),
            PilotUp =
                pilotUp ?? ((_, _) => Task.FromResult(CliExitCode.Success)),
            ValidateRealModeEnv = validateRealModeEnv ?? (() => new RealModePreflightResult(true, [], null)),
            ResolveComposeOverlays = _ => ["docker-compose.demo.yml"],
            DemoSeed = (_, _) => throw new InvalidOperationException("DemoSeed should not have been invoked."),
            CreateRun = (_, _) => throw new InvalidOperationException("CreateRun should not have been invoked."),
            ExecuteRun = (_, _, _, _) =>
                throw new InvalidOperationException("ExecuteRun should not have been invoked."),
            GetRun = (_, _, _) => throw new InvalidOperationException("GetRun should not have been invoked."),
            SeedFakeResults = (_, _, _, _) =>
                throw new InvalidOperationException("SeedFakeResults should not have been invoked."),
            CommitRun = (_, _, _) =>
                throw new InvalidOperationException("CommitRun should not have been invoked."),
            DownloadFirstValueReport = (_, _, _, _) =>
                throw new InvalidOperationException("DownloadFirstValueReport should not have been invoked."),
            OpenFile = _ => throw new InvalidOperationException("OpenFile should not have been invoked."),
            OpenUrl = _ => throw new InvalidOperationException("OpenUrl should not have been invoked."),
            CreateApiClient = _ =>
                throw new InvalidOperationException("CreateApiClient should not have been invoked.")
        };
    }

    private static void RestoreEnvVar(string name, string? value)
    {
        if (value is null)
            Environment.SetEnvironmentVariable(name, null);
        else
            Environment.SetEnvironmentVariable(name, value);
    }

    private static ArchLucidApiClient CreateDisposalSafeTestApiClient()
    {
        HttpClient http = new() { BaseAddress = new Uri("http://127.0.0.1:9/") };

        return new ArchLucidApiClient(http);
    }

    private static ArchLucidApiClient.CreateRunResponse CreateSampleCreateRunResponse(string runId)
    {
        return new ArchLucidApiClient.CreateRunResponse
        {
            Run = new ArchLucidApiClient.RunInfo { RunId = runId, Status = ArchitectureRunStatus.Created }
        };
    }

    private static TryCommandHooks OrchestrationHooks(
        string runId = "run-default",
        Func<ArchLucidApiClient, CancellationToken, Task<ArchLucidApiClient.CreateRunResult>>? createRun = null,
        Func<string, string, bool, CancellationToken, Task<bool>>? executeRun = null,
        Func<ArchLucidApiClient, string, CancellationToken, Task<ArchLucidApiClient.GetRunResult?>>? getRun = null,
        Func<ArchLucidApiClient, string, bool, CancellationToken, Task<ArchLucidApiClient.SeedFakeResultsResult?>>?
            seedFakeResults = null,
        Func<ArchLucidApiClient, string, CancellationToken, Task<ArchLucidApiClient.CommitRunResult?>>? commitRun = null,
        Func<string, string, string, CancellationToken, Task<bool>>? downloadFirstValueReport = null,
        Action<string>? openFile = null,
        Action<string>? openUrl = null)
    {
        ArchLucidApiClient sharedClient = CreateDisposalSafeTestApiClient();

        return new TryCommandHooks
        {
            FindComposeDirectory = () => SyntheticComposeDirectory,
            PilotUp = (_, _) => Task.FromResult(CliExitCode.Success),
            ValidateRealModeEnv = () => new RealModePreflightResult(true, [], null),
            ResolveComposeOverlays = _ => ["docker-compose.demo.yml"],
            DemoSeed = (_, _) => Task.FromResult(new TryCommand.DemoSeedOutcome(true, "  Demo seed stub.")),
            CreateRun =
                createRun ??
                ((_, _) => Task.FromResult(ArchLucidApiClient.CreateRunResult.Ok(CreateSampleCreateRunResponse(runId)))),
            ExecuteRun = executeRun ?? ((_, _, _, _) => Task.FromResult(true)),
            GetRun =
                getRun ??
                ((_, id, _) =>
                    Task.FromResult<ArchLucidApiClient.GetRunResult?>(new ArchLucidApiClient.GetRunResult
                    {
                        Run = new ArchLucidApiClient.RunInfo
                        {
                            RunId = id,
                            Status = ArchitectureRunStatus.ReadyForCommit
                        }
                    })),
            SeedFakeResults =
                seedFakeResults ??
                ((_, _, _, _) =>
                    throw new InvalidOperationException("SeedFakeResults was not expected in this scenario.")),
            CommitRun =
                commitRun ??
                ((_, _, _) =>
                    Task.FromResult<ArchLucidApiClient.CommitRunResult?>(
                        new ArchLucidApiClient.CommitRunResult(
                            true,
                            new ArchLucidApiClient.CommitRunResponse
                            {
                                Manifest = new ArchLucidApiClient.ManifestInfo
                                {
                                    Metadata = new ArchLucidApiClient.ManifestMetadataInfo
                                    {
                                        ManifestVersion = "7.0.0-test"
                                    }
                                }
                            },
                            null))),
            DownloadFirstValueReport = downloadFirstValueReport ?? ((_, _, _, _) => Task.FromResult(false)),
            OpenFile = openFile ?? (_ => { }),
            OpenUrl = openUrl ?? (_ => { }),
            CreateApiClient = _ => sharedClient
        };
    }
}
