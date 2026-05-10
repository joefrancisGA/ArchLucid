using System.Text;

using FluentAssertions;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     INV-003: every <see cref="ArchLucid.Core.Audit.IAuditService" /> member-invocation audit write in product code is
///     either wrapped in <see cref="ArchLucid.Core.Audit.DurableAuditLogRetry" /> within the same method, marked
///     <c>[InformationalAudit]</c>, or treated as intentionally transactional (allow-listed).
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
    ///     Types where every <c>IAuditService.LogAsync</c> call is part of a transactional contract unless a method is
    ///     explicitly marked <c>[InformationalAudit]</c>.
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
        "RunExportAuditService",
        "ComparisonAuditService",
        "AdvisoryScanRunner",
        "AgentExecutionTraceRecorder",
        "ScimGroupService",
        "ScimUserService"
    ];

    private static string FindRepoRoot()
    {
        for (DirectoryInfo? d = new(AppContext.BaseDirectory); d != null; d = d.Parent)
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
                    WalkTopMember(member, path, violations);
            }
        }

        violations.Should().BeEmpty(
            "Unclassified IAuditService.LogAsync call sites (add DurableAuditLogRetry in-method, [InformationalAudit], declare a transactional controller action, or extend TransactionalAuditOwningTypes): "
            + string.Join(Environment.NewLine, violations.OrderBy(static s => s, StringComparer.Ordinal)));
    }

    private static void WalkTopMember(MemberDeclarationSyntax member, string path, HashSet<string> violations)
    {
        switch (member)
        {
            case BaseNamespaceDeclarationSyntax ns:
            {
                foreach (MemberDeclarationSyntax inner in ns.Members)
                    WalkTopMember(inner, path, violations);

                break;
            }
            case TypeDeclarationSyntax type:
                WalkTypeMembers(type, path, violations);
                break;
        }
    }

    private static void WalkTypeMembers(TypeDeclarationSyntax type, string path, HashSet<string> violations)
    {
        foreach (MemberDeclarationSyntax inner in type.Members)
        {
            switch (inner)
            {
                case TypeDeclarationSyntax nested:
                    WalkTypeMembers(nested, path, violations);
                    break;
                case MethodDeclarationSyntax method:
                    InspectMethod(method, path, violations);
                    break;
            }
        }
    }

    private static void InspectMethod(MethodDeclarationSyntax method, string path, HashSet<string> violations)
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

        if (IsTransactionalApiControllerAction(path, method))
            return;

        if (TypeAllowsTransactionalAudit(FormatContainingType(method)))
            return;

        string typeName = FormatContainingType(method);
        string rel = Path.GetRelativePath(FindRepoRoot(), path);
        violations.Add($"{rel}: {typeName}.{method.Identifier.Text}");
    }

    private static bool IsTransactionalApiControllerAction(string filePath, MethodDeclarationSyntax method)
    {
        if (!filePath.Contains($"ArchLucid.Api{Path.DirectorySeparatorChar}Controllers", StringComparison.OrdinalIgnoreCase))
            return false;

        return method.Modifiers.Any(m => m.IsKind(SyntaxKind.PublicKeyword));
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

    private static bool MethodUsesDurableRetry(SyntaxNode bodyRoot) =>
        bodyRoot.DescendantNodes(descendIntoTrivia: false, descendIntoChildren: _ => true)
            .Any(n => n is InvocationExpressionSyntax inv
                && inv.Expression is MemberAccessExpressionSyntax mem
                && mem.Name.Identifier.Text == "TryLogAsync"
                && mem.Expression is MemberAccessExpressionSyntax inner
                && inner.Name.Identifier.Text == "DurableAuditLogRetry");

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

        for (SyntaxNode? n = method.Parent; n != null; n = n.Parent)
        {
            if (n is TypeDeclarationSyntax td)
                names.Push(td.Identifier.Text);
        }

        return string.Join("+", names);
    }
}
