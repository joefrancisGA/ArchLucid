using System.Text.RegularExpressions;

namespace ArchLucid.Api.Tests;

/// <summary>Shared source-scan logic for Api integration harness golden-path guards.</summary>
internal static class IntegrationTestHarnessGoldenPathGuardSupport
{
    private const int FinalizeProximityLineWindow = 30;

    private static readonly Regex RawFinalizePostRegex = new(
        @"\.PostAsync\s*\(\s*\$""/v1/architecture/review/\{[^""]+\}/finalize""",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex RawFinalizeRequestRegex = new(
        @"new\s*\(\s*HttpMethod\.Post\s*,\s*\$""/v1/architecture/review/\{[^""]+\}/finalize""",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex RawExecutePostRegex = new(
        @"\.PostAsync\s*\(\s*\$""/v1/architecture/review/\{[^""]+\}/execute""",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex RawExecuteRequestRegex = new(
        @"new\s*\(\s*HttpMethod\.Post\s*,\s*\$""/v1/architecture/review/\{[^""]+\}/execute""",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex RawReviewReplayPostRegex = new(
        @"\.PostAsync\s*\(\s*\$""/v1/architecture/review/\{[^""]+\}/replay""",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex RawReviewReplayRequestRegex = new(
        @"new\s*\(\s*HttpMethod\.Post\s*,\s*\$""/v1/architecture/review/\{[^""]+\}/replay""",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex RawArchitectureRequestPostRegex = new(
        @"\.PostAsync\s*\(\s*""/v1/architecture/request""",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex RawArchitectureRequestHttpRequestRegex = new(
        @"new\s*\(\s*HttpMethod\.Post\s*,\s*""/v1/architecture/request""",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex ConstantArchitectureRequestHttpRequestRegex = new(
        @"new\s*\(\s*HttpMethod\.Post\s*,\s*IntegrationTestRunLifecycleSupport\.ArchitectureRequestRelativeUrl",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex HandRolledIntakePostRegex = new(
        @"\.PostAsync\s*\(\s*IntegrationTestRunLifecycleSupport\.ArchitectureRequestRelativeUrl",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex RawEndToEndCompareSummaryEmbedRegex = new(
        @"""/v1/architecture/review/compare/end-to-end/summary",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex RawEndToEndCompareExportEmbedRegex = new(
        @"""/v1/architecture/review/compare/end-to-end/export",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex PostExecuteUnlessRegex = new(
        @"\.PostExecuteUnlessAuthorityPipelineCompleteAsync\s*\(",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex FinalizeFollowUpRegex = new(
        @"\.PostFinalizeForTestAsync\s*\(|\.FinalizeRunAsync\s*\(|CreateFinalizeReviewRequest\s*\(",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex EnsureSuccessStatusCodeRegex = new(
        @"\.EnsureSuccessStatusCode\s*\(",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex PrivateGreenfieldIntakeWrapperRegex = new(
        @"private\s+static\s+Task<HttpResponseMessage>\s+PostArchitectureRequestAsync\s*\(",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex CommitAndReplayTupleRegex = new(
        @"\(\s*string\s+runId\s*,\s*string\s+replayRunId\s*\)\s*=\s*await",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex HandRolledWebJsonOptionsRegex = new(
        @"private\s+static\s+readonly\s+JsonSerializerOptions\s+\w+\s*=\s*new\s*\(\s*JsonSerializerDefaults\.Web\s*\)",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex FinalizedRunTupleRegex = new(
        @"\(string\s+\w+\s*,\s*(?:string\s+\w+|_)\s*\)\s*=\s*await\s+Create(?:Finalized|Committed)RunAsync\s*\(",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex ReadFromJsonAsyncRegex = new(
        @"\.Content\.ReadFromJsonAsync\s*<",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    /// <summary>Sum of unique allowlisted harness source files across all guard sets (growth ratchet).</summary>
    internal const int MaxHarnessAllowlistedSourceFiles = 42;

    private static readonly HashSet<string> LifecycleSupportExclusions = new(StringComparer.Ordinal)
    {
        nameof(IntegrationTestRunLifecycleSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardTests) + ".cs",
    };

    private static readonly HashSet<string> EndToEndCompareSummaryAllowlist = new(StringComparer.Ordinal)
    {
        nameof(IntegrationTestRunLifecycleSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardTests) + ".cs",
        nameof(ArchitectureComparisonAuditTests) + ".cs",
        nameof(ArchitectureEndToEndCompareRunNotFoundTests) + ".cs",
    };

    private static readonly HashSet<string> EndToEndCompareExportAllowlist = new(StringComparer.Ordinal)
    {
        nameof(IntegrationTestRunLifecycleSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardTests) + ".cs",
    };

    private static readonly HashSet<string> PostExecuteUnlessAllowlist = new(StringComparer.Ordinal)
    {
        nameof(IntegrationTestRunLifecycleSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardTests) + ".cs",
    };

    private static readonly HashSet<string> EnsureSuccessAllowlist = new(StringComparer.Ordinal)
    {
        nameof(ArchitectureRequestConcurrencyTestSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardTests) + ".cs",
    };

    private static readonly HashSet<string> PrivateIntakeExclusions = new(StringComparer.Ordinal)
    {
        nameof(IntegrationTestBase) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardTests) + ".cs",
    };

    private static readonly HashSet<string> HandRolledJsonOptionsAllowlist = new(StringComparer.Ordinal)
    {
        // harness-allowlist: fixture loader uses isolated serializer settings.
        nameof(FixtureLoader) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardTests) + ".cs",
    };

    private static readonly HashSet<string> UnbootstrappedCreateClientAllowlist = new(StringComparer.Ordinal)
    {
        // harness-allowlist: specialty auth factories — migrate via AdminApiKeyIntegrationTestBase over time.
        "AuthorizationBoundaryTests.cs",
        nameof(CommitRunRequiresCommitPermissionTests) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardTests) + ".cs",
    };

    private static readonly HashSet<string> ReadFromJsonAsyncAllowlist = new(StringComparer.Ordinal)
    {
        // harness-allowlist: burn-down large controller / concurrency suites (slice 6+).
        nameof(ArchitectureControllerTests) + ".cs",
        nameof(ArchitectureRequestConcurrencyTestSupport) + ".cs",
        nameof(ArchLucidHttpResponseIntegrationTestExtensions) + ".cs",
        nameof(EvolutionControllerFlowTests) + ".cs",
        nameof(EvolutionControllerQueryTests) + ".cs",
        nameof(FinalizeConflictSqlIntegrationTests) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardTests) + ".cs",
        nameof(LearningControllerTests) + ".cs",
        nameof(PageBundleEndpointsTests) + ".cs",
        nameof(PolicyPacksIntegrationTests) + ".cs",
        nameof(ProductLearningControllerTests) + ".cs",
        "SecurityCommittedRunSeed.cs",
    };

    internal static List<string> ScanRawFinalizeUrls()
    {
        return ScanContentViolations(
            LifecycleSupportExclusions,
            static content =>
                RawFinalizePostRegex.IsMatch(content) || RawFinalizeRequestRegex.IsMatch(content));
    }

    internal static List<string> ScanRawExecuteUrls()
    {
        return ScanContentViolations(
            LifecycleSupportExclusions,
            static content =>
                RawExecutePostRegex.IsMatch(content) || RawExecuteRequestRegex.IsMatch(content));
    }

    internal static List<string> ScanRawReviewReplayUrls()
    {
        return ScanContentViolations(
            LifecycleSupportExclusions,
            static content =>
                RawReviewReplayPostRegex.IsMatch(content) || RawReviewReplayRequestRegex.IsMatch(content));
    }

    internal static List<string> ScanRawArchitectureRequestUrls()
    {
        return ScanContentViolations(
            LifecycleSupportExclusions,
            static content =>
                RawArchitectureRequestPostRegex.IsMatch(content)
                || RawArchitectureRequestHttpRequestRegex.IsMatch(content)
                || ConstantArchitectureRequestHttpRequestRegex.IsMatch(content));
    }

    internal static List<string> ScanHandRolledIntakePostAsync()
    {
        return ScanContentViolations(
            LifecycleSupportExclusions,
            static content => HandRolledIntakePostRegex.IsMatch(content));
    }

    internal static List<string> ScanRawEndToEndCompareSummaryUrls()
    {
        return ScanFileAllowlistViolations(EndToEndCompareSummaryAllowlist, RawEndToEndCompareSummaryEmbedRegex);
    }

    internal static List<string> ScanRawEndToEndCompareExportUrls()
    {
        return ScanFileAllowlistViolations(EndToEndCompareExportAllowlist, RawEndToEndCompareExportEmbedRegex);
    }

    internal static List<string> ScanPostExecuteUnlessBeforeFinalize()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            string fileName = Path.GetFileName(path);

            if (PostExecuteUnlessAllowlist.Contains(fileName))
                continue;

            string[] lines = File.ReadAllLines(path);

            for (int i = 0; i < lines.Length; i++)
            {
                if (!PostExecuteUnlessRegex.IsMatch(lines[i]))
                    continue;

                int end = Math.Min(lines.Length - 1, i + FinalizeProximityLineWindow);

                for (int j = i + 1; j <= end; j++)
                {
                    if (!FinalizeFollowUpRegex.IsMatch(lines[j]))
                        continue;

                    violations.Add(
                        $"{path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal)}:{i + 1}");

                    break;
                }
            }
        }

        return violations;
    }

    internal static List<string> ScanEnsureSuccessStatusCode()
    {
        return ScanFileAllowlistViolations(EnsureSuccessAllowlist, EnsureSuccessStatusCodeRegex);
    }

    internal static List<string> ScanPrivateGreenfieldIntakeWrappers()
    {
        return ScanContentViolations(
            PrivateIntakeExclusions,
            static content => PrivateGreenfieldIntakeWrapperRegex.IsMatch(content));
    }

    internal static List<string> ScanCommitAndReplayTupleDeconstruction()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            string content = File.ReadAllText(path);

            if (!CommitAndReplayTupleRegex.IsMatch(content))
                continue;

            if (!content.Contains("CommitAndReplayAsync", StringComparison.Ordinal))
                continue;

            violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        return violations;
    }

    internal static List<string> ScanHandRolledJsonOptionsInHarnessTests()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            string fileName = Path.GetFileName(path);

            if (HandRolledJsonOptionsAllowlist.Contains(fileName))
                continue;

            string content = File.ReadAllText(path);

            if (!IsHarnessTestSource(content))
                continue;

            if (!HandRolledWebJsonOptionsRegex.IsMatch(content))
                continue;

            if (content.Contains("CreateApiJsonOptions", StringComparison.Ordinal))
                continue;

            violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        return violations;
    }

    internal static int CountTotalAllowlistedHarnessFiles()
    {
        HashSet<string> union = new(StringComparer.Ordinal);

        AddAllowlistFileNames(union, HandRolledJsonOptionsAllowlist);
        AddAllowlistFileNames(union, UnbootstrappedCreateClientAllowlist);
        AddAllowlistFileNames(union, ReadFromJsonAsyncAllowlist);
        AddAllowlistFileNames(union, EndToEndCompareSummaryAllowlist);
        AddAllowlistFileNames(union, EndToEndCompareExportAllowlist);
        AddAllowlistFileNames(union, EnsureSuccessAllowlist);
        AddAllowlistFileNames(union, PostExecuteUnlessAllowlist);

        return union.Count;
    }

    internal static List<string> ScanFinalizedRunTupleDeconstruction()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            string content = File.ReadAllText(path);

            if (!IsHarnessTestSource(content))
                continue;

            if (!FinalizedRunTupleRegex.IsMatch(content))
                continue;

            violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        return violations;
    }

    internal static List<string> ScanReadFromJsonAsyncInHarnessTests()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            string fileName = Path.GetFileName(path);

            if (ReadFromJsonAsyncAllowlist.Contains(fileName))
                continue;

            string content = File.ReadAllText(path);

            if (!IsHarnessTestSource(content))
                continue;

            if (!ReadFromJsonAsyncRegex.IsMatch(content))
                continue;

            violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        return violations;
    }

    internal static List<string> ScanUnbootstrappedCreateClientInHarnessTests()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            string fileName = Path.GetFileName(path);

            if (UnbootstrappedCreateClientAllowlist.Contains(fileName))
                continue;

            string content = File.ReadAllText(path);

            if (!RequiresSqlClientBootstrapHarness(content))
                continue;

            if (!content.Contains("factory.CreateClient()", StringComparison.Ordinal))
                continue;

            if (content.Contains("IntegrationTestSqlClientBootstrap", StringComparison.Ordinal))
                continue;

            if (content.Contains("IntegrationTestIsolatedSqlScope", StringComparison.Ordinal))
                continue;

            if (content.Contains(": IntegrationTestBase", StringComparison.Ordinal))
                continue;

            violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        return violations;
    }

    private static bool RequiresSqlClientBootstrapHarness(string content) =>
        content.Contains("PostArchitectureRequestForTestAsync", StringComparison.Ordinal)
        || content.Contains("PostFinalizeForTestAsync", StringComparison.Ordinal)
        || content.Contains("CommitAndReplayAsync", StringComparison.Ordinal)
        || content.Contains("IntegrationTestIsolatedSqlScope", StringComparison.Ordinal)
        || content.Contains(": IntegrationTestBase", StringComparison.Ordinal);

    private static bool IsHarnessTestSource(string content) =>
        content.Contains("PostArchitectureRequestForTestAsync", StringComparison.Ordinal)
        || content.Contains("IntegrationTestIsolatedSqlScope", StringComparison.Ordinal)
        || content.Contains("CommitAndReplayAsync", StringComparison.Ordinal)
        || content.Contains("IntegrationTestRunLifecycleSupport", StringComparison.Ordinal)
        || content.Contains(": IntegrationTestBase", StringComparison.Ordinal)
        || content.Contains("PostFinalizeForTestAsync", StringComparison.Ordinal);

    private static List<string> ScanContentViolations(
        HashSet<string> excludedFileNames,
        Func<string, bool> isViolation)
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            string fileName = Path.GetFileName(path);
            bool skip = false;

            foreach (string excludedFileName in excludedFileNames)
            {
                if (!string.Equals(fileName, excludedFileName, StringComparison.Ordinal))
                    continue;

                skip = true;

                break;
            }

            if (skip)
                continue;

            if (isViolation(File.ReadAllText(path)))
                violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        return violations;
    }

    private static void AddAllowlistFileNames(HashSet<string> union, HashSet<string> allowlist)
    {
        foreach (string fileName in allowlist)
            union.Add(fileName);
    }

    private static List<string> ScanFileAllowlistViolations(HashSet<string> allowlist, Regex regex)
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            string fileName = Path.GetFileName(path);

            if (allowlist.Contains(fileName))
                continue;

            if (regex.IsMatch(File.ReadAllText(path)))
                violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        return violations;
    }
}
