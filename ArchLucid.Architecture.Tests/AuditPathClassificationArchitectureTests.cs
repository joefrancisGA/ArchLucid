using System.Text;

using ArchLucid.Core.Audit;

using FluentAssertions;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     INV-003: every <see cref="IAuditService" /> member-invocation audit write in product code is
///     either wrapped in <see cref="DurableAuditLogRetry" /> within the same method, marked
///     <c>[InformationalAudit]</c>, or treated as intentionally transactional (allow-listed).
///     TB-954: Required event types must not soft-fail via <see cref="DurableAuditLogRetry.TryLogAsync" />.
/// </summary>
[Trait("Suite", "Core")]
public sealed class AuditPathClassificationArchitectureTests
{
    private static readonly string[] ProductRelativeRoots =
    [
        "ArchLucid.Application",
        "ArchLucid.Api",
        "ArchLucid.Persistence",
        "ArchLucid.AgentRuntime",
        "ArchLucid.Decisioning",
        "ArchLucid.Host.Core",
        "ArchLucid.Host.Composition",
        "ArchLucid.Worker",
        "ArchLucid.Notifications",
        "ArchLucid.KnowledgeGraph",
        "ArchLucid.ContextIngestion",
        "ArchLucid.ArtifactSynthesis",
        "ArchLucid.Retrieval",
        "ArchLucid.Provenance"
    ];

    /// <summary>
    ///     Non-controller types where direct <c>IAuditService.LogAsync</c> calls are transactional unless a method is
    ///     marked <c>[InformationalAudit]</c>.
    /// </summary>
    private static readonly HashSet<string> TransactionalAuditOwningTypes =
    [
        "AuthorityRunOrchestrator",
        "AuthorityDrivenArchitectureRunCommitOrchestrator",
        "ArchitectureApplicationService",
        "DigestDeliveryDispatcher",
        "CompositeAlertService",
        "AlertService",
        "AlertDeliveryDispatcher",
        "ManifestFinalizationService",
        "BackgroundJobWorkUnitExecutor",
        "ImportRequestFileService",
        "ApprovalSlaMonitor",
        "AzureExtractorIngestService",
        "CloudInventoryExtractorIngestService",
        "RunExportAuditService",
        "ComparisonAuditService",
        "AdvisoryScanRunner",
        "AgentExecutionTraceRecorder",
        "AgentOutputEvaluationRecorder",
        "ScimGroupService",
        "ScimUserService",
        "QuickStartService",
        "TrialLimitProblemResponse",
        "AdminDiagnosticsService",
        "DataConsistencyRemediationExecutor",
        "BaselineMutationAuditArchitectureDurableWriter",
        "SyntheticOperatorDemoPackWriter",
        "FindingReviewTrailAppendService",
        "GovernanceWorkflowService",
        "RiskExceptionService",
        "RunOperatorGovernanceDispositionService",
        "PolicyPackDryRunService",
        "PolicyPackGovernanceDryRunService",
        "ArchitectureRunCreateOrchestrator",
        "ArchitectureRunBatchCreateOrchestrator",
        "ArchitectureRunExecuteOrchestrator",
        "TenantProvisioningService",
        "TrialLifecycleTransitionEngine",
        "TrialTenantBootstrapService",
        "DataConsistencyOrphanProbeExecutor",
        "DataArchivalHostIteration",
        "TrialLifecycleEmailPublishingAuditDecorator",
        "AuditRetryDrainHostedService",
        "PolicyPacksAppService",
        "BillingWebhookTrialActivator",
        "AuthorityPipelineStagesExecutor",
        "AuthorityCommittedPipelineFinalizer",
        "SqlTrialFunnelCommitHook",
        "HostedAwsExtractorRunService",
        "HostedGcpExtractorRunService",
        "AuthenticationIdentityLinkingService",
        "EmailOtpAuthService",
        "PlatformAuthRecoveryService",
        "PlatformRecoveryNotificationService",
        "PlatformIdentityService",
        "PostAuthBootstrapService",
        "UserAccountRecoveryService",
        "AgentModelCatalogEvaluationRecorder",
        "ExternalSubprocessorEngineAcknowledgmentService",
        "ReviewModelAliasOverrideAuditWriter",
        "ClarificationAnswerReReviewCoordinator",
        "SelectiveExecuteIncrementalReReviewCoordinator",
        "ExecuteTimeGovernanceScopeCaptureService",
        "PolicyPackWorkflowFacade",
        "GovernanceStickinessFacade",
        "PilotsApplicationService",
        "AuthorityCommitGovernanceStage",
        "AuthorityCommitPersistenceStage",
        "AuthorityPipelineArtifactsStage",
        "AuthorityPipelineDecisioningStage",
        "AuthorityPipelineFindingsStage",
        "TraceabilityBundleExportApplicationService",
        "AuthorityRunReadHandlers"
    ];

    private static string FindRepoRoot()
    {
        for (DirectoryInfo? d = new(AppContext.BaseDirectory); d is not null; d = d.Parent)
        {
            string sln = Path.Combine(d.FullName, "ArchLucid.sln");

            if (File.Exists(sln))
                return d.FullName;
        }

        throw new InvalidOperationException("ArchLucid.sln not found walking up from AppContext.BaseDirectory.");
    }

    [Fact]
    public void IAuditService_member_LogAsync_paths_are_classified_per_INV_003()
    {
        HashSet<string> violations = new(StringComparer.Ordinal);
        string root = FindRepoRoot();

        foreach (string rel in ProductRelativeRoots)
        {
            string dir = Path.Combine(root, rel);

            if (!Directory.Exists(dir))
                continue;

            foreach (string path in Directory.EnumerateFiles(dir, "*.cs", SearchOption.AllDirectories))
            {
                if (path.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase)
                    || path.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase))
                    continue;

                string text = File.ReadAllText(path, Encoding.UTF8);
                SyntaxTree tree = CSharpSyntaxTree.ParseText(text, path: path);
                CompilationUnitSyntax unit = tree.GetCompilationUnitRoot();

                foreach (MemberDeclarationSyntax member in unit.Members)
                    WalkTopMember(member, path, violations, InspectMethodForClassification);
            }
        }

        violations.Should().BeEmpty(
            "Unclassified IAuditService.LogAsync call sites (add DurableAuditLogRetry in-method, [InformationalAudit], declare a transactional controller action, or extend TransactionalAuditOwningTypes): "
            + string.Join(Environment.NewLine, violations.OrderBy(static s => s, StringComparer.Ordinal)));
    }

    [Fact]
    public void Required_audit_event_types_must_not_use_TryLogAsync()
    {
        RequiredAuditEventTypes.All.Should().NotBeEmpty();
        RequiredAuditEventTypes.ConstNames.Should().HaveCount(RequiredAuditEventTypes.All.Count);

        HashSet<string> violations = new(StringComparer.Ordinal);
        string root = FindRepoRoot();

        foreach (string rel in ProductRelativeRoots)
        {
            string dir = Path.Combine(root, rel);

            if (!Directory.Exists(dir))
                continue;

            foreach (string path in Directory.EnumerateFiles(dir, "*.cs", SearchOption.AllDirectories))
            {
                if (path.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase)
                    || path.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase))
                    continue;

                string text = File.ReadAllText(path, Encoding.UTF8);
                SyntaxTree tree = CSharpSyntaxTree.ParseText(text, path: path);
                CompilationUnitSyntax unit = tree.GetCompilationUnitRoot();

                foreach (MemberDeclarationSyntax member in unit.Members)
                    WalkTopMember(member, path, violations, InspectMethodForRequiredSoftFail);
            }
        }

        violations.Should().BeEmpty(
            "Required audit types must use DurableAuditLogRetry.LogOrThrowAsync (TB-954). Soft-fail regressions: "
            + string.Join(Environment.NewLine, violations.OrderBy(static s => s, StringComparer.Ordinal)));
    }

    private static void WalkTopMember(
        MemberDeclarationSyntax member,
        string path,
        HashSet<string> violations,
        Action<MethodDeclarationSyntax, string, HashSet<string>> inspectMethod)
    {
        switch (member)
        {
            case BaseNamespaceDeclarationSyntax ns:
            {
                foreach (MemberDeclarationSyntax inner in ns.Members)
                    WalkTopMember(inner, path, violations, inspectMethod);

                break;
            }
            case TypeDeclarationSyntax type:
                WalkTypeMembers(type, path, violations, inspectMethod);
                break;
        }
    }

    private static void WalkTypeMembers(
        TypeDeclarationSyntax type,
        string path,
        HashSet<string> violations,
        Action<MethodDeclarationSyntax, string, HashSet<string>> inspectMethod)
    {
        foreach (MemberDeclarationSyntax inner in type.Members)
        {
            switch (inner)
            {
                case TypeDeclarationSyntax nested:
                    WalkTypeMembers(nested, path, violations, inspectMethod);
                    break;
                case MethodDeclarationSyntax method:
                    inspectMethod(method, path, violations);
                    break;
            }
        }
    }

    private static void InspectMethodForClassification(MethodDeclarationSyntax method, string path, HashSet<string> violations)
    {
        SyntaxNode? bodyRoot = MethodBodyRoot(method);

        if (bodyRoot is null)
            return;

        if (MethodUsesDurableRetry(bodyRoot))
            return;

        if (!MethodHasMemberAccessLogAsync(bodyRoot))
            return;

        if (HasInformationalAudit(method))
            return;

        string typeName = FormatContainingType(method);

        if (IsApiControllerTransactionalSurface(path, typeName))
            return;

        if (TypeAllowsTransactionalAudit(typeName))
            return;

        string rel = Path.GetRelativePath(FindRepoRoot(), path);
        violations.Add($"{rel}: {typeName}.{method.Identifier.Text}");
    }

    private static void InspectMethodForRequiredSoftFail(MethodDeclarationSyntax method, string path, HashSet<string> violations)
    {
        SyntaxNode? bodyRoot = MethodBodyRoot(method);

        if (bodyRoot is null)
            return;

        string bodyText = bodyRoot.ToFullString();

        if (!bodyText.Contains("DurableAuditLogRetry.TryLogAsync", StringComparison.Ordinal))
            return;

        string typeName = FormatContainingType(method);
        string rel = Path.GetRelativePath(FindRepoRoot(), path);
        string location = $"{rel}: {typeName}.{method.Identifier.Text}";

        if (IsRequiredAuditHelperName(method.Identifier.Text))
        {
            violations.Add($"{location} — Required-named helper must not call TryLogAsync");
            return;
        }

        string? matched = FindRequiredTypeReference(bodyText);

        if (matched is not null)
            violations.Add($"{location} — Required type '{matched}' with TryLogAsync");
    }

    private static bool IsRequiredAuditHelperName(string methodName)
    {
        return methodName.Contains("LogRequired", StringComparison.Ordinal)
               || methodName.EndsWith("RequiredAsync", StringComparison.Ordinal);
    }

    private static string? FindRequiredTypeReference(string bodyText)
    {
        for (int i = 0; i < RequiredAuditEventTypes.ConstNames.Count; i++)
        {
            string constName = RequiredAuditEventTypes.ConstNames[i];
            string memberAccess = "AuditEventTypes." + constName;

            if (bodyText.Contains(memberAccess, StringComparison.Ordinal))
                return constName;
        }

        for (int i = 0; i < RequiredAuditEventTypes.All.Count; i++)
        {
            string wire = RequiredAuditEventTypes.All[i];
            string quoted = "\"" + wire + "\"";

            if (bodyText.Contains(quoted, StringComparison.Ordinal))
                return wire;
        }

        return null;
    }

    private static bool IsApiControllerTransactionalSurface(string filePath, string typeName)
    {
        if (!filePath.Contains($"ArchLucid.Api{Path.DirectorySeparatorChar}Controllers", StringComparison.OrdinalIgnoreCase))
            return false;

        return typeName.EndsWith("Controller", StringComparison.Ordinal);
    }

    private static bool TypeAllowsTransactionalAudit(string formattedTypeName)
    {
        foreach (string t in TransactionalAuditOwningTypes)
        {
            if (formattedTypeName == t || formattedTypeName.EndsWith("+" + t, StringComparison.Ordinal))
                return true;
        }

        return false;
    }

    private static SyntaxNode? MethodBodyRoot(MethodDeclarationSyntax method)
    {
        if (method.Body is not null)
            return method.Body;

        if (method.ExpressionBody is not null)
            return method.ExpressionBody.Expression;

        return null;
    }

    private static bool MethodUsesDurableRetry(SyntaxNode bodyRoot)
    {
        // Syntax-only checks are easy to get wrong for qualified/static member access; substring is stable for this guardrail.
        return bodyRoot.ToFullString().Contains("DurableAuditLogRetry.TryLogAsync", StringComparison.Ordinal)
            || bodyRoot.ToFullString().Contains("DurableAuditLogRetry.LogOrThrowAsync", StringComparison.Ordinal);
    }

    private static bool MethodHasMemberAccessLogAsync(SyntaxNode bodyRoot)
    {
        foreach (SyntaxNode n in bodyRoot.DescendantNodes())
        {
            if (n is InvocationExpressionSyntax { Expression: MemberAccessExpressionSyntax mem }
                && mem.Name.Identifier.Text == "LogAsync")
                return true;
        }

        return false;
    }

    private static bool HasInformationalAudit(MethodDeclarationSyntax method)
    {
        foreach (AttributeListSyntax list in method.AttributeLists)
        {
            foreach (AttributeSyntax attr in list.Attributes)
            {
                string name = attr.Name.ToString();

                if (name.EndsWith("InformationalAudit", StringComparison.Ordinal))
                    return true;
            }
        }

        return false;
    }

    private static string FormatContainingType(MethodDeclarationSyntax method)
    {
        Stack<string> names = new();

        for (SyntaxNode? n = method.Parent; n is not null; n = n.Parent)
        {
            if (n is TypeDeclarationSyntax td)
                names.Push(td.Identifier.Text);
        }

        return string.Join("+", names);
    }
}
