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
    internal const int MaxHarnessAllowlistedSourceFiles = 40;

    /// <summary><see cref="ReadFromJsonAsyncAllowlist" /> entry cap (burn-down ratchet).</summary>
    internal const int MaxReadFromJsonAllowlistedSourceFiles = 12;

    /// <summary>Minimum <c>[SkippableFact]</c> methods on <see cref="HarnessGoldenPathSmokeTests" /> (ratchet).</summary>
    internal const int MinHarnessGoldenPathSmokeSkippableFacts = 10;

    /// <summary>Cap for <see cref="RawArchitectureReviewSubresourceAllowlist" /> (#38 burn-down ratchet).</summary>
    internal const int MaxReviewSubresourceAllowlistedSourceFiles = 12;

    private static readonly Regex DirectPinExecuteOnFixtureRegex = new(
        @"\bClient\.PostExecuteAndEnsureArchitectureVersionPinForTestAsync\s*\(",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex ReadJsonProblemDetailsRegex = new(
        @"ReadJsonForTestAsync\s*<\s*(?:Microsoft\.AspNetCore\.Mvc\.)?ProblemDetails\s*>",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex DuplicateAuthoritySkipReasonRegex = new(
        @"Skip\.If(?:Not)?\s*\([^,]+,\s*""authority-pipeline complete on create",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex ExplicitArrangeScenarioRegex = new(
        @"Arrange(?:Finalized|CommittedPair|GovernanceCommitted)Async\s*\(\s*(?:nameof\s*\(|""[^""]+"")",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex RedundantForScenarioNameofRegex = new(
        @"TestRequestIds\.ForScenario\s*\(\s*nameof\s*\(\s*(\w+)\s*\)\s*\)",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex FixtureClassNameRegex = new(
        @"\b(?:class|record)\s+(\w+)\s*(?:\(|:\s*IntegrationTestBase)",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex RawManifestSummaryUrlRegex = new(
        @"(?:\$""|"")/v1/architecture/manifest/[^""\n]+/summary""",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex RedundantSystemNameForRequestRegex = new(
        @"TestRequestFactory\.SystemNameForRequest\s*\(\s*\w+\.RequestId\s*\)",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex RawArchitectureReviewSubresourceUrlRegex = new(
        @"\.(?:Get|Post)Async\s*\(\s*\$""/v1/architecture/review/\{[^""\n]+\}/[^""\n]+""",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex RawAuthorityUrlRegex = new(
        @"(?:\.GetAsync|\.PostAsync)\s*\(\s*\$?""/v1/authority/",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    /// <summary>Cap for <see cref="RawAuthorityUrlAllowlist" /> (#42 burn-down ratchet).</summary>
    internal const int MaxAuthorityAllowlistedSourceFiles = 10;

    /// <summary>Cap for <see cref="HandRolledJsonDocumentParseAllowlist" /> (#40 burn-down ratchet).</summary>
    internal const int MaxJsonDocumentAllowlistedSourceFiles = 14;

    private static readonly Regex HardcodedHarnessUnknownRunGuidRegex = new(
        @"Guid\.Parse\s*\(\s*""0{8}-0{4}-0{4}-0{4}-0{12}""",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex RawArchitectureReviewBareGetRegex = new(
        @"\.GetAsync\s*\(\s*\$""/v1/architecture/review/\{[^""/]+\}""",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex HandRolledJsonDocumentParseRegex = new(
        @"JsonDocument\.Parse\s*\(",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex TupleReturnTypeRegex = new(
        @"Task<\(\s*string\s+\w+\s*,\s*string\s+\w+\s*\)>",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex RedundantEnsureBeforeReadJsonRegex = new(
        @"await\s+\w+\.EnsureSuccessForTestAsync\s*\(\s*\)\s*;\s*\r?\n\s*\w+\?\s+\w+\s*=\s*await\s+\w+\.ReadJsonForTestAsync",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex PostReviewReplayAsyncRegex = new(
        @"\bPostReviewReplayAsync\s*\(",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex HardcodedRequestIdRegex = new(
        @"""(REQ-[A-Z][A-Z0-9-]{4,})""",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex StatusCodeAssertionBeforeReadJsonRegex = new(
        @"\.StatusCode\.Should\(\)\.Be\([^;]+;\s*\r?\n\s*(?:\w+\?\s+)?\w+.*=.*await\s+\w+\.ReadJsonForTestAsync",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex FinalizeLifecycleAsyncRegex = new(
        @"\bFinalizeLifecycleAsync\s*\(",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex CreateFinalizedRunCallRegex = new(
        @"\bCreateFinalizedRunAsync\s*\(\s*([^)\r\n]+)\)",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex LiteralIdempotencyHeaderRegex = new(
        @"(?:TryAddWithoutValidation|Add)\s*\(\s*""Idempotency-Key""\s*,\s*""[^""]+""",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex ReviewReplayCallRegex = new(
        @"\bPostReviewReplay(?:ForTest)?Async\s*\(",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex AllowlistBlockStartRegex = new(
        @"^\s*private\s+static\s+readonly\s+HashSet<string>\s+\w+Allowlist\s*=\s*new",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly HashSet<string> PostReviewReplayAsyncAllowlist = new(StringComparer.Ordinal)
    {
        // harness-allowlist: tests replay protocol and manifest override semantics.
        nameof(ArchitectureReplayTests) + ".cs",
        nameof(ReplayCommitOriginalGoldenManifestIsolationIntegrationTests) + ".cs",
        nameof(IntegrationTestRunLifecycleSupport) + ".cs",
        nameof(ReplaySession) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardTests) + ".cs",
    };

    private static readonly HashSet<string> PostExecuteWithoutPinAllowlist = new(StringComparer.Ordinal)
    {
        // harness-allowlist: exercises raw execute responses and idempotency conflicts.
        nameof(ArchitectureControllerTests) + ".cs",
        // harness-allowlist: tests execute idempotency and conflict without pin refresh.
        "FinalizedEvidenceImmutabilityIntegrationTests.cs",
        nameof(IntegrationTestRunLifecycleSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardTests) + ".cs",
    };

    private static readonly HashSet<string> HardcodedRequestIdAllowlist = new(StringComparer.Ordinal)
    {
        // harness-allowlist: asserts intake payload request ids and idempotency matrix literals.
        nameof(ArchitectureControllerTests) + ".cs",
        // harness-allowlist: greenfield warm prefix literal for shard overload primer.
        nameof(ArchitectureRequestConcurrencyTestSupport) + ".cs",
        // harness-allowlist: fixture / boot tests with fixed external ids.
        nameof(ComparisonReplayCostEstimateIntegrationTests) + ".cs",
        nameof(FixtureLoader) + ".cs",
        nameof(GreenfieldSqlBootIntegrationTests) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardTests) + ".cs",
        // harness-allowlist: factory default payload id constant.
        nameof(TestRequestFactory) + ".cs",
    };

    private static readonly HashSet<string> LifecycleSupportExclusions = new(StringComparer.Ordinal)
    {
        nameof(IntegrationTestRunLifecycleSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardTests) + ".cs",
    };

    private static readonly HashSet<string> EndToEndCompareSummaryAllowlist = new(StringComparer.Ordinal)
    {
        // harness-allowlist: compare summary URLs in lifecycle + targeted negative tests.
        nameof(IntegrationTestRunLifecycleSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardTests) + ".cs",
        nameof(ArchitectureComparisonAuditTests) + ".cs",
        nameof(ArchitectureEndToEndCompareRunNotFoundTests) + ".cs",
    };

    private static readonly HashSet<string> EndToEndCompareExportAllowlist = new(StringComparer.Ordinal)
    {
        // harness-allowlist: export route literals live in lifecycle helpers only.
        nameof(IntegrationTestRunLifecycleSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardTests) + ".cs",
    };

    private static readonly HashSet<string> PostExecuteUnlessAllowlist = new(StringComparer.Ordinal)
    {
        // harness-allowlist: execute-unless helper is defined in lifecycle support.
        nameof(IntegrationTestRunLifecycleSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardTests) + ".cs",
    };

    private static readonly HashSet<string> EnsureSuccessAllowlist = new(StringComparer.Ordinal)
    {
        // harness-allowlist: concurrency harness uses EnsureSuccessStatusCode by design.
        nameof(ArchitectureRequestConcurrencyTestSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardTests) + ".cs",
    };

    private static readonly HashSet<string> PrivateIntakeExclusions = new(StringComparer.Ordinal)
    {
        // harness-allowlist: base class defines shared intake helpers.
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

    internal static List<string> ScanTupleReturnTypesInHarnessTests()
    {
        return ScanContentViolations(
            LifecycleSupportExclusions,
            static content => IsHarnessTestSource(content) && TupleReturnTypeRegex.IsMatch(content));
    }

    internal static List<string> ScanRedundantEnsureSuccessBeforeReadJson()
    {
        return ScanContentViolations(
            LifecycleSupportExclusions,
            static content => RedundantEnsureBeforeReadJsonRegex.IsMatch(content));
    }

    internal static List<string> ScanPostReviewReplayAsyncInHarnessTests()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            string fileName = Path.GetFileName(path);

            if (PostReviewReplayAsyncAllowlist.Contains(fileName))
                continue;

            string content = File.ReadAllText(path);

            if (!IsHarnessTestSource(content))
                continue;

            if (!ReviewReplayCallRegex.IsMatch(content))
                continue;

            violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        return violations;
    }

    internal static List<string> ScanStatusCodeAssertionBeforeReadJson()
    {
        return ScanContentViolations(
            LifecycleSupportExclusions,
            static content => IsHarnessTestSource(content) && StatusCodeAssertionBeforeReadJsonRegex.IsMatch(content));
    }

    internal static List<string> ScanFinalizeLifecycleAsyncUsage()
    {
        return ScanContentViolations(
            LifecycleSupportExclusions,
            static content => FinalizeLifecycleAsyncRegex.IsMatch(content));
    }

    internal static List<string> ScanCreateFinalizedRunWithoutTestRequestIdsOnFixtures()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            if (string.Equals(Path.GetFileName(path), nameof(IntegrationTestBase) + ".cs", StringComparison.Ordinal))
                continue;

            string content = File.ReadAllText(path);

            if (!content.Contains(": IntegrationTestBase", StringComparison.Ordinal))
                continue;

            foreach (Match match in CreateFinalizedRunCallRegex.Matches(content))
            {
                string argument = match.Groups[1].Value.Trim();

                if (argument.StartsWith("TestRequestIds.", StringComparison.Ordinal))
                    continue;

                violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
                break;
            }
        }

        return violations;
    }

    internal static int CountReadFromJsonAllowlistedSourceFiles() => ReadFromJsonAsyncAllowlist.Count;

    internal static List<string> ScanDirectPinExecuteOnIntegrationTestBase()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            if (string.Equals(Path.GetFileName(path), nameof(IntegrationTestBase) + ".cs", StringComparison.Ordinal))
                continue;

            string content = File.ReadAllText(path);

            if (!content.Contains(": IntegrationTestBase", StringComparison.Ordinal))
                continue;

            if (!DirectPinExecuteOnFixtureRegex.IsMatch(content))
                continue;

            violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        return violations;
    }

    internal static List<string> ScanDuplicateHarnessSkipReasonLiterals()
    {
        return ScanContentViolations(
            LifecycleSupportExclusions,
            static content =>
                IsHarnessTestSource(content) && DuplicateAuthoritySkipReasonRegex.IsMatch(content));
    }

    internal static List<string> ScanReadJsonForProblemDetailsInHarnessTests()
    {
        return ScanContentViolations(
            LifecycleSupportExclusions,
            static content =>
                IsHarnessTestSource(content) && ReadJsonProblemDetailsRegex.IsMatch(content));
    }

    internal static List<string> ScanExplicitArrangeScenarioArguments()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            if (string.Equals(Path.GetFileName(path), nameof(IntegrationTestBase) + ".cs", StringComparison.Ordinal))
                continue;

            string content = File.ReadAllText(path);

            if (!IsHarnessTestSource(content))
                continue;

            if (!ExplicitArrangeScenarioRegex.IsMatch(content))
                continue;

            violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        return violations;
    }

    internal static List<string> ScanLiteralIdempotencyHeaderValuesInHarnessTests()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            string fileName = Path.GetFileName(path);

            if (string.Equals(fileName, nameof(ArchitectureControllerTests) + ".cs", StringComparison.Ordinal))
                continue;

            string content = File.ReadAllText(path);

            if (!IsHarnessTestSource(content))
                continue;

            if (!LiteralIdempotencyHeaderRegex.IsMatch(content))
                continue;

            violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        return violations;
    }

    internal static List<string> ScanPostExecuteWithoutPinInIntegrationTestBase()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            string fileName = Path.GetFileName(path);

            if (PostExecuteWithoutPinAllowlist.Contains(fileName))
                continue;

            string content = File.ReadAllText(path);

            if (!content.Contains(": IntegrationTestBase", StringComparison.Ordinal))
                continue;

            if (!content.Contains(".PostExecuteForTestAsync(", StringComparison.Ordinal))
                continue;

            if (content.Contains("PostExecuteAndEnsureArchitectureVersionPinForTestAsync", StringComparison.Ordinal))
                continue;

            violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        return violations;
    }

    private static readonly HashSet<string> IsolatedSqlScopeMixedAllowlist = new(StringComparer.Ordinal)
    {
        // harness-allowlist: controller matrix uses per-test isolated SQL inside class fixture.
        nameof(ArchitectureControllerTests) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardSupport) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardTests) + ".cs",
    };

    internal static List<string> ScanIsolatedSqlScopeInsideIntegrationTestBase()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            string fileName = Path.GetFileName(path);

            if (IsolatedSqlScopeMixedAllowlist.Contains(fileName))
                continue;

            string content = File.ReadAllText(path);

            if (!content.Contains(": IntegrationTestBase", StringComparison.Ordinal))
                continue;

            if (!content.Contains("IntegrationTestIsolatedSqlScope.RunAsync", StringComparison.Ordinal))
                continue;

            violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        return violations;
    }

    internal static List<string> ScanHardcodedRequestIdsInHarnessTests()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            string fileName = Path.GetFileName(path);

            if (HardcodedRequestIdAllowlist.Contains(fileName))
                continue;

            string content = File.ReadAllText(path);

            if (!IsHarnessTestSource(content))
                continue;

            if (content.Contains("TestRequestIds.ForScenario", StringComparison.Ordinal))
                continue;

            if (!HardcodedRequestIdRegex.IsMatch(content))
                continue;

            violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        return violations;
    }

    internal static List<string> ScanAllowlistCommentMarkersPresent()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        string path = Path.Combine(repoRoot, nameof(ArchLucid) + ".Api.Tests", nameof(IntegrationTestHarnessGoldenPathGuardSupport) + ".cs");
        string[] lines = File.ReadAllLines(path);
        List<string> violations = [];
        bool inAllowlist = false;
        bool blockDocumented = false;

        for (int i = 0; i < lines.Length; i++)
        {
            string line = lines[i];

            if (AllowlistBlockStartRegex.IsMatch(line))
            {
                inAllowlist = true;
                blockDocumented = false;

                for (int j = i; j <= Math.Min(i + 3, lines.Length - 1); j++)
                {
                    if (lines[j].Contains("harness-allowlist:", StringComparison.Ordinal))
                    {
                        blockDocumented = true;
                        break;
                    }
                }

                continue;
            }

            if (inAllowlist && line.TrimStart().StartsWith("};", StringComparison.Ordinal))
            {
                inAllowlist = false;
                blockDocumented = false;

                continue;
            }

            if (!inAllowlist || blockDocumented || !line.Contains("nameof(", StringComparison.Ordinal))
                continue;

            if (line.Contains(nameof(IntegrationTestHarnessGoldenPathGuardSupport), StringComparison.Ordinal)
                || line.Contains(nameof(IntegrationTestHarnessGoldenPathGuardTests), StringComparison.Ordinal)
                || line.Contains(nameof(IntegrationTestRunLifecycleSupport), StringComparison.Ordinal))
                continue;

            violations.Add($"{path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal)}:{i + 1}");
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

    private static readonly HashSet<string> RedundantForScenarioNameofAllowlist = new(StringComparer.Ordinal)
    {
        // harness-allowlist: controller matrix and concurrency suites need explicit scenario ids.
        nameof(ArchitectureControllerTests) + ".cs",
        nameof(ArchitectureRequestDocumentValidationTests) + ".cs",
        nameof(ArchitectureRunCommitPathParityIntegrationTests) + ".cs",
        nameof(ArchivalConcurrencyIntegrationTests) + ".cs",
        nameof(ComparisonPersistConcurrencyIntegrationTests) + ".cs",
        nameof(CommitRunConcurrencyIntegrationTests) + ".cs",
        nameof(CreateRunIdempotencyConcurrencyIntegrationTests) + ".cs",
        nameof(EvidenceBulkUploadIntegrationTests) + ".cs",
        nameof(FinalizeConflictSqlIntegrationTests) + ".cs",
        nameof(GovernanceApprovalConcurrencyIntegrationTests) + ".cs",
        nameof(PolicyPackConcurrencyIntegrationTests) + ".cs",
        nameof(PolicyPackPublishConcurrencyIntegrationTests) + ".cs",
        nameof(ReplayCommitOriginalGoldenManifestIsolationIntegrationTests) + ".cs",
        nameof(ArchitectureComparisonReplayTests) + ".cs",
        nameof(ArchitectureRequestIdempotencyConcurrencyIntegrationTests) + ".cs",
        nameof(ArchitectureReplayTests) + ".cs",
        nameof(ArchitectureTests) + ".cs",
        nameof(MutatingEndpointIdempotencyContractIntegrationTests) + ".cs",
        nameof(RunStoredEvidenceFilesIntegrationTests) + ".cs",
        "FinalizedEvidenceImmutabilityIntegrationTests.cs",
    };

    internal static List<string> ScanRedundantForScenarioNameofOnFixtures()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            string fileName = Path.GetFileName(path);

            if (RedundantForScenarioNameofAllowlist.Contains(fileName))
                continue;

            string content = File.ReadAllText(path);

            if (!content.Contains(": IntegrationTestBase", StringComparison.Ordinal))
                continue;

            Match classMatch = FixtureClassNameRegex.Match(content);

            if (!classMatch.Success)
                continue;

            string fixtureClass = classMatch.Groups[1].Value;

            bool redundant = false;

            foreach (Match match in RedundantForScenarioNameofRegex.Matches(content))
            {
                if (!string.Equals(match.Groups[1].Value, fixtureClass, StringComparison.Ordinal))
                    continue;

                redundant = true;

                break;
            }

            if (!redundant)
                continue;

            violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        return violations;
    }

    internal static int CountHarnessGoldenPathSmokeSkippableFacts()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        string path = Path.Combine(repoRoot, "ArchLucid.Api.Tests", nameof(HarnessGoldenPathSmokeTests) + ".cs");
        string content = File.ReadAllText(path);

        return Regex.Matches(content, @"\[SkippableFact\]").Count;
    }

    private static readonly HashSet<string> RawManifestSummaryUrlAllowlist = new(StringComparer.Ordinal)
    {
        // harness-allowlist: canonical manifest summary GET lives on FinalizedRunHarnessExtensions.
        nameof(FinalizedRunHarnessExtensions) + ".cs",
    };

    internal static List<string> ScanRawManifestSummaryUrlsInHarnessTests()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            string fileName = Path.GetFileName(path);

            if (RawManifestSummaryUrlAllowlist.Contains(fileName))
                continue;

            string content = File.ReadAllText(path);

            if (!IsHarnessTestSource(content))
                continue;

            if (!RawManifestSummaryUrlRegex.IsMatch(content))
                continue;

            violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        return violations;
    }

    internal static List<string> ScanRedundantSystemNameForRequestOnHarnessRuns()
    {
        return ScanContentViolations(
            LifecycleSupportExclusions,
            static content =>
                content.Contains(": IntegrationTestBase", StringComparison.Ordinal)
                && IsHarnessTestSource(content)
                && RedundantSystemNameForRequestRegex.IsMatch(content));
    }

    private static readonly HashSet<string> RawArchitectureReviewSubresourceAllowlist = new(StringComparer.Ordinal)
    {
        // harness-allowlist: canonical review GET/subresource helpers.
        nameof(FinalizedRunHarnessExtensions) + ".cs",
        nameof(CreatedRunForTestHarnessExtensions) + ".cs",
        // harness-allowlist: conflict matrix hand-rolls review routes by design.
        nameof(FinalizeConflictSqlIntegrationTests) + ".cs",
        // harness-allowlist-until: evidence specialty GETs (#38 burn-down).
        nameof(EvidenceBulkUploadIntegrationTests) + ".cs",
        nameof(FindingEvidenceChainEndpointTests) + ".cs",
        nameof(FindingInspectEndpointTests) + ".cs",
        nameof(RunFindingsCsvExportEndpointTests) + ".cs",
        nameof(RunStoredEvidenceFilesIntegrationTests) + ".cs",
        nameof(TraceabilityBundleZipEndpointTests) + ".cs",
    };

    internal static List<string> ScanRawArchitectureReviewSubresourceUrlsInHarnessTests()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            string fileName = Path.GetFileName(path);

            if (RawArchitectureReviewSubresourceAllowlist.Contains(fileName))
                continue;

            if (path.Contains($"{Path.DirectorySeparatorChar}Security{Path.DirectorySeparatorChar}", StringComparison.Ordinal))
                continue;

            string content = File.ReadAllText(path);

            if (!content.Contains(": IntegrationTestBase", StringComparison.Ordinal))
                continue;

            if (!IsHarnessTestSource(content))
                continue;

            if (!RawArchitectureReviewSubresourceUrlRegex.IsMatch(content))
                continue;

            violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        return violations;
    }

    internal static int CountReviewSubresourceAllowlistedSourceFiles() =>
        RawArchitectureReviewSubresourceAllowlist.Count;

    private static readonly HashSet<string> RawAuthorityUrlAllowlist = new(StringComparer.Ordinal)
    {
        // harness-allowlist: canonical /v1/authority helpers.
        nameof(AuthorityHarnessExtensions) + ".cs",
        nameof(FinalizedRunHarnessExtensions) + ".cs",
        nameof(CreatedRunForTestHarnessExtensions) + ".cs",
        // harness-allowlist-until: authority route contract matrices (#42 burn-down).
        nameof(AuthorityReadsControllerIntegrationTests) + ".cs",
        nameof(AuthorityQueryControllerAnonymousIntegrationTests) + ".cs",
        nameof(PageBundleEndpointsTests) + ".cs",
        nameof(ReplayCommitOriginalGoldenManifestIsolationIntegrationTests) + ".cs",
        "BuyerAudienceProblemDetailsIntegrationTests.cs",
        nameof(GenuinelyUntestedControllersIntegrationTests) + ".cs",
    };

    internal static List<string> ScanRawAuthorityUrlsInHarnessTests()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            string fileName = Path.GetFileName(path);

            if (RawAuthorityUrlAllowlist.Contains(fileName))
                continue;

            if (path.Contains($"{Path.DirectorySeparatorChar}Security{Path.DirectorySeparatorChar}", StringComparison.Ordinal))
                continue;

            string content = File.ReadAllText(path);

            if (!content.Contains(": IntegrationTestBase", StringComparison.Ordinal))
                continue;

            if (!IsHarnessTestSource(content))
                continue;

            if (!RawAuthorityUrlRegex.IsMatch(content))
                continue;

            violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        return violations;
    }

    internal static int CountAuthorityAllowlistedSourceFiles() => RawAuthorityUrlAllowlist.Count;

    private static readonly HashSet<string> HardcodedHarnessUnknownRunGuidAllowlist = new(StringComparer.Ordinal)
    {
        // harness-allowlist: canonical negative-path GUID literals.
        nameof(HarnessWellKnownGuids) + ".cs",
    };

    internal static List<string> ScanHardcodedHarnessUnknownRunGuids()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            string fileName = Path.GetFileName(path);

            if (HardcodedHarnessUnknownRunGuidAllowlist.Contains(fileName))
                continue;

            if (path.Contains($"{Path.DirectorySeparatorChar}Security{Path.DirectorySeparatorChar}", StringComparison.Ordinal))
                continue;

            string content = File.ReadAllText(path);

            if (!content.Contains(": IntegrationTestBase", StringComparison.Ordinal))
                continue;

            if (!IsHarnessTestSource(content))
                continue;

            if (!HardcodedHarnessUnknownRunGuidRegex.IsMatch(content))
                continue;

            violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        return violations;
    }

    internal static int CountJsonDocumentAllowlistedSourceFiles() => HandRolledJsonDocumentParseAllowlist.Count;

    private static readonly HashSet<string> RawArchitectureReviewBareGetAllowlist = new(StringComparer.Ordinal)
    {
        // harness-allowlist: canonical bare review GET helpers and specialty poll fixtures.
        nameof(FinalizedRunHarnessExtensions) + ".cs",
        nameof(CreatedRunForTestHarnessExtensions) + ".cs",
        nameof(FinalizeConflictSqlIntegrationTests) + ".cs",
        nameof(GoldenCohortSimulatorDriftTests) + ".cs",
    };

    internal static List<string> ScanRawArchitectureReviewBareGetUrlsInHarnessTests()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            string fileName = Path.GetFileName(path);

            if (RawArchitectureReviewBareGetAllowlist.Contains(fileName))
                continue;

            if (path.Contains($"{Path.DirectorySeparatorChar}Security{Path.DirectorySeparatorChar}", StringComparison.Ordinal))
                continue;

            string content = File.ReadAllText(path);

            if (!content.Contains(": IntegrationTestBase", StringComparison.Ordinal))
                continue;

            if (!IsHarnessTestSource(content))
                continue;

            if (!RawArchitectureReviewBareGetRegex.IsMatch(content))
                continue;

            violations.Add(path.Replace(repoRoot + Path.DirectorySeparatorChar, string.Empty, StringComparison.Ordinal));
        }

        return violations;
    }

    private static readonly HashSet<string> HandRolledJsonDocumentParseAllowlist = new(StringComparer.Ordinal)
    {
        // harness-allowlist: harness helpers and legacy controller matrices pending JsonDocument burn-down.
        nameof(ArchLucidHttpResponseIntegrationTestExtensions) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardTests) + ".cs",
        nameof(IntegrationTestHarnessGoldenPathGuardSupport) + ".cs",
        nameof(FinalizeConflictSqlIntegrationTests) + ".cs",
        nameof(GoldenCohortSimulatorDriftTests) + ".cs",
        nameof(ArchitectureTests) + ".cs",
        nameof(EvolutionControllerFlowTests) + ".cs",
        nameof(LearningControllerTests) + ".cs",
        nameof(ProductLearningControllerTests) + ".cs",
        nameof(BatchReplayIntegrationTests) + ".cs",
        nameof(PolicyPackRequestValidationTests) + ".cs",
        nameof(RecentPilotRunDeltasEndpointTests) + ".cs",
        nameof(ReplayCommitOriginalGoldenManifestIsolationIntegrationTests) + ".cs",
        nameof(SecurityTrustPublicationControllerIntegrationTests) + ".cs",
    };

    internal static List<string> ScanHandRolledJsonDocumentParseInHarnessTests()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        List<string> violations = [];

        foreach (string path in IntegrationTestSourceScanSupport.EnumerateApiTestSources())
        {
            string fileName = Path.GetFileName(path);

            if (HandRolledJsonDocumentParseAllowlist.Contains(fileName))
                continue;

            if (path.Contains($"{Path.DirectorySeparatorChar}Security{Path.DirectorySeparatorChar}", StringComparison.Ordinal))
                continue;

            if (path.Contains($"{Path.DirectorySeparatorChar}Governance{Path.DirectorySeparatorChar}", StringComparison.Ordinal))
                continue;

            string content = File.ReadAllText(path);

            if (!content.Contains(": IntegrationTestBase", StringComparison.Ordinal))
                continue;

            if (!IsHarnessTestSource(content))
                continue;

            if (!HandRolledJsonDocumentParseRegex.IsMatch(content))
                continue;

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
