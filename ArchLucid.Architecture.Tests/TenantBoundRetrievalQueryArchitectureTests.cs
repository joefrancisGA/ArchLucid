using System.Text;

using FluentAssertions;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     RAG-V1-000: tenant-bound <c>RetrievalQuery</c> construction in product code must set <see cref="ArchLucid.Core.Retrieval.RetrievalQuery.TenantId" />.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TenantBoundRetrievalQueryArchitectureTests
{
    private static readonly string[] ProductRelativeRoots =
    [
        "ArchLucid.AgentRuntime",
        "ArchLucid.Host.Core",
        "ArchLucid.Api",
    ];

    private static string FindRepoRoot()
    {
        for (DirectoryInfo? directory = new(AppContext.BaseDirectory); directory is not null; directory = directory.Parent)
        {
            string solutionPath = Path.Combine(directory.FullName, "ArchLucid.sln");

            if (File.Exists(solutionPath))
                return directory.FullName;
        }

        throw new InvalidOperationException("ArchLucid.sln not found walking up from AppContext.BaseDirectory.");
    }

    [Fact]
    public void Product_code_new_RetrievalQuery_object_initializers_set_TenantId()
    {
        HashSet<string> violations = new(StringComparer.Ordinal);
        string root = FindRepoRoot();

        foreach (string relativeRoot in ProductRelativeRoots)
        {
            string directory = Path.Combine(root, relativeRoot);

            if (!Directory.Exists(directory))
                continue;

            foreach (string path in Directory.EnumerateFiles(directory, "*.cs", SearchOption.AllDirectories))
            {
                if (path.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase)
                    || path.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase))
                    continue;

                string text = File.ReadAllText(path, Encoding.UTF8);
                SyntaxTree tree = CSharpSyntaxTree.ParseText(text, path: path);
                CompilationUnitSyntax unit = tree.GetCompilationUnitRoot();

                foreach (SyntaxNode node in unit.DescendantNodes())
                {
                    if (node is not ObjectCreationExpressionSyntax creation)
                        continue;

                    if (creation.Type.ToString() != "RetrievalQuery")
                        continue;

                    if (creation.Initializer is null)
                    {
                        violations.Add($"{RelativePath(root, path)}:{creation.GetLocation().GetLineSpan().StartLinePosition.Line + 1} missing object initializer");
                        continue;
                    }

                    bool setsTenantId = creation.Initializer.Expressions
                        .OfType<AssignmentExpressionSyntax>()
                        .Any(static assignment => assignment.Left.ToString() == "TenantId");

                    if (!setsTenantId)
                    {
                        violations.Add($"{RelativePath(root, path)}:{creation.GetLocation().GetLineSpan().StartLinePosition.Line + 1} TenantId not set");
                    }
                }
            }
        }

        violations.Should().BeEmpty(
            "Tenant-bound RetrievalQuery must include TenantId in product code: "
            + string.Join(Environment.NewLine, violations.OrderBy(static s => s, StringComparer.Ordinal)));
    }

    private static string RelativePath(string repoRoot, string absolutePath)
    {
        return Path.GetRelativePath(repoRoot, absolutePath).Replace('\\', '/');
    }
}
