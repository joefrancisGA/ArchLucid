using System.Net.Http.Headers;
using System.Text;
using System.Text.RegularExpressions;

using ArchLucid.Application.Admin;
using ArchLucid.Application.AiUsage;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Drafts;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Application.Integrations.Itsm.OAuth;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Integrations;

using FluentAssertions;

using Microsoft.AspNetCore.DataProtection;

using Moq;

namespace ArchLucid.Application.Tests;

/// <summary>
/// RC27 coverage uplift: PKCE/token helpers, draft state machine, buyer-proof markdown, small static helpers.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ApplicationPackageCoverageBatchRc27Tests
{
    private static readonly Regex Base64UrlCharset = new("^[A-Za-z0-9_-]+$", RegexOptions.Compiled);

    [Fact]
    public void ItsmAtlassianOAuthPkce_CreatePair_returns_base64url_verifier_and_challenge()
    {
        (string codeVerifier, string codeChallenge) = ItsmAtlassianOAuthPkce.CreatePair();

        codeVerifier.Should().NotBeNullOrWhiteSpace();
        codeChallenge.Should().NotBeNullOrWhiteSpace();
        codeVerifier.Should().NotBe(codeChallenge);
        Base64UrlCharset.IsMatch(codeVerifier).Should().BeTrue();
        Base64UrlCharset.IsMatch(codeChallenge).Should().BeTrue();
        codeVerifier.Should().NotContain("=").And.NotContain("+").And.NotContain("/");
        codeChallenge.Should().NotContain("=").And.NotContain("+").And.NotContain("/");
        // 32 random bytes → 43 base64url chars; SHA-256 digest is also 32 bytes.
        codeVerifier.Length.Should().Be(43);
        codeChallenge.Length.Should().Be(43);
    }

    [Fact]
    public void ItsmAtlassianOAuthPkce_CreateOpaqueState_returns_base64url_without_padding()
    {
        string state = ItsmAtlassianOAuthPkce.CreateOpaqueState();
        string other = ItsmAtlassianOAuthPkce.CreateOpaqueState();

        Base64UrlCharset.IsMatch(state).Should().BeTrue();
        state.Should().NotContain("=").And.NotContain("+").And.NotContain("/");
        // 24 random bytes → 32 base64url chars.
        state.Length.Should().Be(32);
        state.Should().NotBe(other);
    }

    [Fact]
    public void InvitationTokenGenerator_GenerateUrlSafeToken_is_unique_and_base64url()
    {
        string first = InvitationTokenGenerator.GenerateUrlSafeToken();
        string second = InvitationTokenGenerator.GenerateUrlSafeToken();

        first.Should().NotBe(second);
        Base64UrlCharset.IsMatch(first).Should().BeTrue();
        Base64UrlCharset.IsMatch(second).Should().BeTrue();
        first.Should().NotContain("=").And.NotContain("+").And.NotContain("/");
        first.Length.Should().Be(43);
    }

    [Theory]
    [MemberData(nameof(AllDraftRequestStatuses))]
    public void DraftRequestStateMachine_IsMutable_matches_Drafting_only(DraftRequestStatus status)
    {
        bool expected = status == DraftRequestStatus.Drafting;

        DraftRequestStateMachine.IsMutable(status).Should().Be(expected);
    }

    [Theory]
    [MemberData(nameof(AllDraftRequestStatuses))]
    public void DraftRequestStateMachine_AllowsQuestionAnswers_matches_Drafting_or_Admitted(
        DraftRequestStatus status)
    {
        bool expected = status is DraftRequestStatus.Drafting or DraftRequestStatus.Admitted;

        DraftRequestStateMachine.AllowsQuestionAnswers(status).Should().Be(expected);
    }

    [Theory]
    [MemberData(nameof(AllDraftRequestStatuses))]
    public void DraftRequestStateMachine_AllowsReasoning_matches_Drafting_or_Admitted(
        DraftRequestStatus status)
    {
        bool expected = status is DraftRequestStatus.Drafting or DraftRequestStatus.Admitted;

        DraftRequestStateMachine.AllowsReasoning(status).Should().Be(expected);
    }

    [Theory]
    [MemberData(nameof(AllDraftRequestStatuses))]
    public void DraftRequestStateMachine_AllowsBranch_matches_Admitted_or_RunSpawned(
        DraftRequestStatus status)
    {
        bool expected = status is DraftRequestStatus.Admitted or DraftRequestStatus.RunSpawned;

        DraftRequestStateMachine.AllowsBranch(status).Should().Be(expected);
    }

    [Theory]
    [MemberData(nameof(AllDraftRequestStatuses))]
    public void DraftRequestStateMachine_AllowsAdmission_matches_Drafting_only(DraftRequestStatus status)
    {
        bool expected = status == DraftRequestStatus.Drafting;

        DraftRequestStateMachine.AllowsAdmission(status).Should().Be(expected);
    }

    [Theory]
    [MemberData(nameof(AllDraftRequestStatuses))]
    public void DraftRequestStateMachine_AllowsSubmit_matches_Admitted_only(DraftRequestStatus status)
    {
        bool expected = status == DraftRequestStatus.Admitted;

        DraftRequestStateMachine.AllowsSubmit(status).Should().Be(expected);
    }

    [Theory]
    [MemberData(nameof(AllDraftRequestStatuses))]
    public void DraftRequestStateMachine_AllowsAbandon_matches_Drafting_or_Admitted(
        DraftRequestStatus status)
    {
        bool expected = status is DraftRequestStatus.Drafting or DraftRequestStatus.Admitted;

        DraftRequestStateMachine.AllowsAbandon(status).Should().Be(expected);
    }

    public static TheoryData<DraftRequestStatus> AllDraftRequestStatuses()
    {
        TheoryData<DraftRequestStatus> data = [];

        foreach (DraftRequestStatus status in Enum.GetValues<DraftRequestStatus>())
        {
            data.Add(status);
        }

        return data;
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void BuyerProofPackLimitationsMarkdown_Build_contains_expected_section_headers(bool demoDataWarning)
    {
        ArchitectureRunDetail detail = new();

        string markdown = BuyerProofPackLimitationsMarkdown.Build(detail, demoDataWarning);

        markdown.Should().Contain("# Limitations and recommended next actions");
        markdown.Should().Contain("## Recommended next actions");
        markdown.Should().Contain("## What this pack does not claim");

        if (demoDataWarning)
        {
            markdown.Should().Contain("Demo data warning");
        }
        else
        {
            markdown.Should().NotContain("Demo data warning");
        }
    }

    [Fact]
    public void BuyerProofPackTrustPointerMarkdown_Value_contains_trust_posture_pointer()
    {
        string markdown = BuyerProofPackTrustPointerMarkdown.Value;

        markdown.Should().Contain("# Trust posture (pointer)");
        markdown.Should().Contain("TRUST_CENTER.md");
        markdown.Should().Contain("Sponsor send readiness");
    }

    [Fact]
    public void RecurrenceScheduleCronValidation_InvalidCronMessage_documents_supported_forms()
    {
        RecurrenceScheduleCronValidation.InvalidCronMessage.Should().Contain("@hourly");
        RecurrenceScheduleCronValidation.InvalidCronMessage.Should().Contain("@daily");
        RecurrenceScheduleCronValidation.InvalidCronMessage.Should().Contain("@weekly");
        RecurrenceScheduleCronValidation.InvalidCronMessage.Should().Contain("five-field");
    }

    [Fact]
    public void FindingDispositionTrailWindow_BasisBreakdownLookback_is_two_years()
    {
        FindingDispositionTrailWindow.BasisBreakdownLookback.Should().Be(TimeSpan.FromDays(730));
    }

    [Theory]
    [InlineData(null, null)]
    [InlineData("", null)]
    [InlineData("   ", null)]
    [InlineData("not-an-email", "***")]
    [InlineData("@nodomain", "***")]
    [InlineData("a@", "***")]
    [InlineData("ab@example.com", "***@example.com")]
    [InlineData("joe@example.com", "j***e@example.com")]
    [InlineData("  alice@contoso.com  ", "a***e@contoso.com")]
    public void TenantItsmCredentialMasking_MaskEmail_covers_branches(string? email, string? expected)
    {
        TenantItsmCredentialMasking.MaskEmail(email).Should().Be(expected);
    }

    [Theory]
    [InlineData(null, null)]
    [InlineData("", null)]
    [InlineData("  ", null)]
    [InlineData("a", "***")]
    [InlineData("ab", "***")]
    [InlineData("svc", "s***c")]
    [InlineData("  admin  ", "a***n")]
    public void TenantItsmCredentialMasking_MaskUsername_covers_branches(string? username, string? expected)
    {
        TenantItsmCredentialMasking.MaskUsername(username).Should().Be(expected);
    }

    [Fact]
    public void ItsmOutboundHttpAuthorizationHeaders_CreateBasic_encodes_credentials()
    {
        AuthenticationHeaderValue header = ItsmOutboundHttpAuthorizationHeaders.CreateBasic("user", "secret");

        header.Scheme.Should().Be("Basic");
        Encoding.UTF8.GetString(Convert.FromBase64String(header.Parameter!)).Should().Be("user:secret");
    }

    [Fact]
    public void ItsmOutboundHttpAuthorizationHeaders_CreatePat_uses_empty_username()
    {
        AuthenticationHeaderValue header = ItsmOutboundHttpAuthorizationHeaders.CreatePat("pat-token");

        header.Scheme.Should().Be("Basic");
        Encoding.UTF8.GetString(Convert.FromBase64String(header.Parameter!)).Should().Be(":pat-token");
    }

    [Fact]
    public void ItsmOutboundHttpAuthorizationHeaders_CreateBearer_trims_token()
    {
        AuthenticationHeaderValue header = ItsmOutboundHttpAuthorizationHeaders.CreateBearer("  token  ");

        header.Scheme.Should().Be("Bearer");
        header.Parameter.Should().Be("token");
    }

    [Fact]
    public void ItsmOutboundHttpAuthorizationHeaders_Apply_sets_request_authorization()
    {
        using HttpRequestMessage request = new(HttpMethod.Get, "https://example.test/");
        AuthenticationHeaderValue authorization = ItsmOutboundHttpAuthorizationHeaders.CreateBearer("abc");

        ItsmOutboundHttpAuthorizationHeaders.Apply(request, authorization);

        request.Headers.Authorization.Should().BeEquivalentTo(authorization);
    }

    [Fact]
    public void ItsmOutboundHttpAuthorizationHeaders_CreateBasic_rejects_blank_inputs()
    {
        Action blankUser = () => ItsmOutboundHttpAuthorizationHeaders.CreateBasic(" ", "secret");
        Action blankSecret = () => ItsmOutboundHttpAuthorizationHeaders.CreateBasic("user", " ");

        blankUser.Should().Throw<ArgumentException>();
        blankSecret.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void ExternalTicketConnectorSupport_SkippedAudit_serializes_finding_and_reason()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };
        FindingInspectResponse inspect = new()
        {
            FindingId = "finding-1",
            RunId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
        };

        AuditEvent ev = ExternalTicketConnectorSupport.SkippedAudit(
            "itsm.skipped",
            scope,
            inspect,
            "already-linked");

        ev.EventType.Should().Be("itsm.skipped");
        ev.TenantId.Should().Be(scope.TenantId);
        ev.WorkspaceId.Should().Be(scope.WorkspaceId);
        ev.ProjectId.Should().Be(scope.ProjectId);
        ev.RunId.Should().Be(inspect.RunId);
        ev.DataJson.Should().Contain("finding-1");
        ev.DataJson.Should().Contain("already-linked");
    }

    [Fact]
    public async Task ExternalTicketConnectorSupport_ResolveFindingRecordId_returns_null_when_run_empty()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new(MockBehavior.Strict);
        FindingInspectResponse inspect = new() { FindingId = "f1", RunId = Guid.Empty };

        Guid? resolved = await ExternalTicketConnectorSupport.ResolveFindingRecordIdForInspectAsync(
            correlations.Object,
            new ScopeContext { TenantId = Guid.NewGuid() },
            inspect,
            CancellationToken.None);

        resolved.Should().BeNull();
        correlations.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ExternalTicketConnectorSupport_ResolveFindingRecordId_delegates_when_run_present()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid runId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid recordId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryResolveFindingRecordIdForRunFindingAsync(
                tenantId, runId, "finding-x", It.IsAny<CancellationToken>()))
            .ReturnsAsync(recordId);
        FindingInspectResponse inspect = new() { FindingId = "finding-x", RunId = runId };

        Guid? resolved = await ExternalTicketConnectorSupport.ResolveFindingRecordIdForInspectAsync(
            correlations.Object,
            new ScopeContext { TenantId = tenantId },
            inspect,
            CancellationToken.None);

        resolved.Should().Be(recordId);
    }

    [Fact]
    public void ExecDigestUnsubscribeTokenFactory_round_trips_and_rejects_invalid()
    {
        EphemeralDataProtectionProvider provider = new();
        ExecDigestUnsubscribeTokenFactory factory = new(provider);
        Guid tenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        string token = factory.CreateToken(tenantId);
        bool ok = factory.TryParseTenant(token, out Guid parsed);

        ok.Should().BeTrue();
        parsed.Should().Be(tenantId);

        Action emptyTenant = () => factory.CreateToken(Guid.Empty);
        emptyTenant.Should().Throw<ArgumentException>();

        factory.TryParseTenant("   ", out Guid blank).Should().BeFalse();
        blank.Should().Be(Guid.Empty);
        factory.TryParseTenant("not-a-protected-payload", out _).Should().BeFalse();
    }

    [Fact]
    public void ExecDigestUnsubscribeTokenFactory_ctor_rejects_null_provider()
    {
        Action act = () => _ = new ExecDigestUnsubscribeTokenFactory(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Theory]
    [InlineData(0, 2, 1.5, 0)]
    [InlineData(3, 0, 1.5, 0)]
    [InlineData(3, 2, 0, 0)]
    [InlineData(3, 2, 1.5, 9)]
    public void RunAgentBatchBudgetEstimator_EstimateBatchUsd_covers_zero_and_product(
        int agentTaskCount,
        int assumedCallsPerAgentTask,
        decimal assumedUsdPerCall,
        decimal expected)
    {
        decimal actual = RunAgentBatchBudgetEstimator.EstimateBatchUsd(
            agentTaskCount,
            assumedCallsPerAgentTask,
            assumedUsdPerCall);

        actual.Should().Be(expected);
    }

    [Fact]
    public void RunAgentBatchBudgetEstimator_EstimateBatchUsd_rejects_negatives()
    {
        Action negTasks = () => RunAgentBatchBudgetEstimator.EstimateBatchUsd(-1, 1, 1m);
        Action negCalls = () => RunAgentBatchBudgetEstimator.EstimateBatchUsd(1, -1, 1m);
        Action negUsd = () => RunAgentBatchBudgetEstimator.EstimateBatchUsd(1, 1, -0.01m);

        negTasks.Should().Throw<ArgumentOutOfRangeException>();
        negCalls.Should().Throw<ArgumentOutOfRangeException>();
        negUsd.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Theory]
    [InlineData(2, 3, 10, 5, 90)]
    [InlineData(2, 3, -4, 5, 30)]
    [InlineData(0, 3, 10, 5, 0)]
    public void RunAgentBatchBudgetEstimator_EstimateBatchTokens_clamps_negative_token_assumptions(
        int agentTaskCount,
        int assumedCallsPerAgentTask,
        int assumedPromptTokensPerCall,
        int assumedCompletionTokensPerCall,
        long expected)
    {
        long actual = RunAgentBatchBudgetEstimator.EstimateBatchTokens(
            agentTaskCount,
            assumedCallsPerAgentTask,
            assumedPromptTokensPerCall,
            assumedCompletionTokensPerCall);

        actual.Should().Be(expected);
    }

    [Fact]
    public void RunAgentBatchBudgetEstimator_EstimateBatchTokens_rejects_negative_counts()
    {
        Action negTasks = () => RunAgentBatchBudgetEstimator.EstimateBatchTokens(-1, 1, 1, 1);
        Action negCalls = () => RunAgentBatchBudgetEstimator.EstimateBatchTokens(1, -1, 1, 1);

        negTasks.Should().Throw<ArgumentOutOfRangeException>();
        negCalls.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void RunAgentBatchBudgetEstimator_ApplyGrace_delegates_to_core_helper()
    {
        RunAgentBatchBudgetEstimator.ApplyGrace(100m, 10m).Should().Be(110m);
        RunAgentBatchBudgetEstimator.ApplyGrace(-5m, 10m).Should().Be(0m);
    }

    [Fact]
    public async Task TenantLlmMonthlyBudgetCapResolver_returns_cap_when_budget_positive()
    {
        Guid tenantId = Guid.NewGuid();
        Mock<ITenantAiBudgetPolicyResolver> policyResolver = new();
        policyResolver
            .Setup(r => r.ResolveAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantAiBudgetPolicySnapshot
            {
                BudgetAmountUsd = 42.5m,
                WalletOverageAllowed = true,
            });
        TenantLlmMonthlyBudgetCapResolver sut = new(policyResolver.Object);

        decimal? cap = await sut.ResolveHardCapUsdAsync(tenantId);
        bool overage = await sut.IsWalletOverageAllowedAsync(tenantId);

        cap.Should().Be(42.5m);
        overage.Should().BeTrue();
    }

    [Fact]
    public async Task TenantLlmMonthlyBudgetCapResolver_returns_null_cap_when_budget_non_positive()
    {
        Guid tenantId = Guid.NewGuid();
        Mock<ITenantAiBudgetPolicyResolver> policyResolver = new();
        policyResolver
            .Setup(r => r.ResolveAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantAiBudgetPolicySnapshot
            {
                BudgetAmountUsd = 0m,
                WalletOverageAllowed = false,
            });
        TenantLlmMonthlyBudgetCapResolver sut = new(policyResolver.Object);

        decimal? cap = await sut.ResolveHardCapUsdAsync(tenantId);
        bool overage = await sut.IsWalletOverageAllowedAsync(tenantId);

        cap.Should().BeNull();
        overage.Should().BeFalse();
    }

    [Fact]
    public void TenantLlmMonthlyBudgetCapResolver_ctor_rejects_null_resolver()
    {
        Action act = () => _ = new TenantLlmMonthlyBudgetCapResolver(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void ReviewCacheKeyBuilder_Build_joins_manifest_fields_including_null_reuse_reason()
    {
        ReviewCacheDependencyManifest withReason = new()
        {
            ContentHash = "c",
            PromptVersion = "p",
            ModelVersion = "m",
            PolicyPackVersion = "pp",
            RubricVersion = "r",
            TenantConfigurationHash = "t",
            DeclaredPrioritiesHash = "d",
            SchemaVersion = 7,
            ReuseReason = "warm",
        };
        ReviewCacheDependencyManifest withoutReason = new()
        {
            ContentHash = "c",
            PromptVersion = "p",
            ModelVersion = "m",
            PolicyPackVersion = "pp",
            RubricVersion = "r",
            TenantConfigurationHash = "t",
            DeclaredPrioritiesHash = "d",
            SchemaVersion = 7,
            ReuseReason = null,
        };

        ReviewCacheKeyBuilder.Build(withReason).Should().Be("c|p|m|pp|r|t|d|7|warm");
        ReviewCacheKeyBuilder.Build(withoutReason).Should().Be("c|p|m|pp|r|t|d|7|");
    }

    [Theory]
    [InlineData("Microsoft.Compute/disks", "Attach the disk")]
    [InlineData("microsoft.network/networkinterfaces", "Attach the NIC")]
    [InlineData("Microsoft.Network/publicIPAddresses", "Associate the public IP")]
    [InlineData("Microsoft.Storage/storageAccounts", "Delete the orphaned resource")]
    public void OrphanedAzureResourceExplainabilityAlternatives_ResolveForResourceType_covers_branches(
        string resourceType,
        string expectedSnippet)
    {
        IReadOnlyList<string> alternatives =
            OrphanedAzureResourceExplainabilityAlternatives.ResolveForResourceType(resourceType);

        alternatives.Should().NotBeEmpty();
        alternatives.Should().Contain(a => a.Contains(expectedSnippet, StringComparison.Ordinal));
    }

    [Fact]
    public void OrphanedAzureResourceExplainabilityAlternatives_rejects_blank_resource_type()
    {
        Action act = () => OrphanedAzureResourceExplainabilityAlternatives.ResolveForResourceType(" ");

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void FindingInspectResponseExternalTrackingExtensions_WithExternalTracking_null_returns_same_instance()
    {
        FindingInspectResponse source = new() { FindingId = "f-keep" };

        FindingInspectResponse result = source.WithExternalTracking(null);

        result.Should().BeSameAs(source);
    }

    [Fact]
    public void FindingInspectResponseExternalTrackingExtensions_WithExternalTracking_copies_tracking_fields()
    {
        DateTimeOffset revisit = DateTimeOffset.Parse("2026-08-01T00:00:00Z");
        FindingInspectResponse source = new()
        {
            FindingId = "f-track",
            ReasoningSummary = "keep-summary",
            RevisitDueUtc = null,
        };
        RunFindingExternalTrackingProjection tracking = new()
        {
            RevisitDueUtc = revisit,
            Provider = "jira",
            ExternalKey = "AL-1",
            ExternalUrl = "https://jira.example/AL-1",
            ItsmLinkedTicketsSummary = "jira:AL-1",
            TrackedExternally = true,
            ExternalTrackingSummary = "Linked to AL-1",
        };

        FindingInspectResponse result = source.WithExternalTracking(tracking);

        result.Should().NotBeSameAs(source);
        result.FindingId.Should().Be("f-track");
        result.ReasoningSummary.Should().Be("keep-summary");
        result.RevisitDueUtc.Should().Be(revisit);
        result.Provider.Should().Be("jira");
        result.ExternalKey.Should().Be("AL-1");
        result.ExternalUrl.Should().Be("https://jira.example/AL-1");
        result.ItsmLinkedTicketsSummary.Should().Be("jira:AL-1");
        result.TrackedExternally.Should().BeTrue();
        result.ExternalTrackingSummary.Should().Be("Linked to AL-1");
    }

    [Fact]
    public void FindingInspectResponseReasoningSummaryExtensions_WithReasoningSummaryFromBuilder_sets_summary()
    {
        FindingInspectResponse source = new() { FindingId = "f-reason", ReasoningSummary = "old" };
        Mock<IReasoningSummaryBuilder> builder = new();
        builder.Setup(b => b.TryBuild(source)).Returns("built-summary");

        FindingInspectResponse result = source.WithReasoningSummaryFromBuilder(builder.Object);

        result.Should().NotBeSameAs(source);
        result.FindingId.Should().Be("f-reason");
        result.ReasoningSummary.Should().Be("built-summary");
    }

    [Fact]
    public void FindingInspectResponseReasoningSummaryExtensions_rejects_null_args()
    {
        FindingInspectResponse source = new() { FindingId = "f" };
        Mock<IReasoningSummaryBuilder> builder = new();

        Action nullSource = () => ((FindingInspectResponse)null!).WithReasoningSummaryFromBuilder(builder.Object);
        Action nullBuilder = () => source.WithReasoningSummaryFromBuilder(null!);

        nullSource.Should().Throw<ArgumentNullException>();
        nullBuilder.Should().Throw<ArgumentNullException>();
    }
}
