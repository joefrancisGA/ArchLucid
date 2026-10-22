using System.Text;

using FluentAssertions;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Durable Task Framework types must stay out of <c>ArchLucid.Application</c> and <c>ArchLucid.Contracts</c> so the
///     domain boundary does not depend on worker/orchestration SDKs (improvement #26).
/// </summary>
[Trait("Category", "Architecture")]
[Trait("Suite", "Core")]
public sealed class DtfNamespaceBoundaryArchitectureTests
{
    private const string ForbiddenPrefix = "Microsoft.DurableTask";

    private static readonly string[] MonitoredRelativeRoots =
    [
        "ArchLucid.Application",
        "ArchLucid.Contracts"
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
    public void DtfTypes_DoNotLeakIntoApplicationOrContracts()
    {
        HashSet<string> violations = new(StringComparer.Ordinal);
        string root = FindRepoRoot();

        foreach (string rel in MonitoredRelativeRoots)
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

                foreach (UsingDirectiveSyntax usingDir in unit.DescendantNodes(descendIntoTrivia: false).OfType<UsingDirectiveSyntax>())
                {
                    if (usingDir.Name is null)
                        continue;

                    string imported = usingDir.Name.ToFullString();

                    if (!ReferencesForbiddenDurableTaskNamespace(imported))
                        continue;

                    violations.Add(FormatViolation(tree, path, root, usingDir, imported));
                }

                foreach (TypeSyntax typeSyntax in unit.DescendantNodes(descendIntoTrivia: false).OfType<TypeSyntax>())
                {
                    if (IsNameSyntaxOfUsingDirective(typeSyntax))
                        continue;

                    if (IsInsideStringOrCharacterLiteral(typeSyntax))
                        continue;

                    string typeText = typeSyntax.ToFullString();

                    if (!ReferencesForbiddenDurableTaskNamespace(typeText))
                        continue;

                    violations.Add(FormatViolation(tree, path, root, typeSyntax, typeText));
                }
            }
        }

        violations.Should().BeEmpty(
            "Microsoft.DurableTask must not appear in ArchLucid.Application or ArchLucid.Contracts (move DTF wiring to host/worker): "
            + string.Join(Environment.NewLine, violations.OrderBy(static s => s, StringComparer.Ordinal)));
    }

    /// <summary>
    ///     Treats <c>global::Microsoft.DurableTask...</c> as a leak (explicit global qualification).
    /// </summary>
    private static bool ReferencesForbiddenDurableTaskNamespace(string text)
    {
        string normalized = text;

        if (normalized.StartsWith("global::", StringComparison.Ordinal))
            normalized = normalized["global::".Length..];

        return normalized.StartsWith(ForbiddenPrefix, StringComparison.Ordinal);
    }

    /// <summary>
    ///     Avoid double-reporting <c>using Microsoft.DurableTask.*;</c> — the name is both <see cref="UsingDirectiveSyntax.Name" />
    ///     and a <see cref="TypeSyntax" /> in the syntax model.
    /// </summary>
    private static bool IsNameSyntaxOfUsingDirective(SyntaxNode node)
    {
        return node.Parent is UsingDirectiveSyntax ud && ReferenceEquals(ud.Name, node);
    }

    private static bool IsInsideStringOrCharacterLiteral(SyntaxNode node)
    {
        for (SyntaxNode? n = node.Parent; n != null; n = n.Parent)
        {
            if (n is LiteralExpressionSyntax les
                && (les.IsKind(SyntaxKind.StringLiteralExpression) || les.IsKind(SyntaxKind.CharacterLiteralExpression)))
                return true;
        }

        return false;
    }

    private static string FormatViolation(SyntaxTree tree, string absolutePath, string repoRoot, SyntaxNode offendingNode, string offendingTypeName)
    {
        FileLinePositionSpan lineSpan = tree.GetLineSpan(offendingNode.Span);
        int line = lineSpan.StartLinePosition.Line + 1;
        string rel = Path.GetRelativePath(repoRoot, absolutePath);

        return $"{rel}({line}): {offendingTypeName}";
    }
}
