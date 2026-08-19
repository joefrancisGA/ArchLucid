using System.Text;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Locates public test fixture types (<c>*Tests</c>) under <c>*.Tests</c> project folders and verifies class-level
///     xUnit <see cref="Xunit.TraitAttribute" /> categorization (<c>Suite</c> or <c>Category</c>).
/// </summary>
internal static class TestClassTraitConventionScanner
{
    internal static string FindRepositoryRoot()
    {
        for (DirectoryInfo? directory = new(AppContext.BaseDirectory); directory is not null; directory = directory.Parent)
        {
            string solutionPath = Path.Combine(directory.FullName, "ArchLucid.sln");

            if (File.Exists(solutionPath))
                return directory.FullName;
        }

        throw new InvalidOperationException("ArchLucid.sln not found walking up from AppContext.BaseDirectory.");
    }

    internal static IReadOnlyList<string> FindUncategorizedTestClasses(string repositoryRoot)
    {
        List<string> violations = [];

        foreach (string testProjectDirectory in EnumerateTestProjectDirectories(repositoryRoot))
        {
            ScanTestProjectDirectory(testProjectDirectory, repositoryRoot, violations);
        }

        return violations;
    }

    private static IEnumerable<string> EnumerateTestProjectDirectories(string repositoryRoot)
    {
        foreach (string directory in Directory.EnumerateDirectories(repositoryRoot))
        {
            string name = Path.GetFileName(directory);

            if (name.EndsWith(".Tests", StringComparison.Ordinal))
                yield return directory;
        }

        string templateTests = Path.Combine(
            repositoryRoot,
            "templates",
            "archlucid-finding-engine",
            "ArchLucidFindingEngine.Tests");

        if (Directory.Exists(templateTests))
            yield return templateTests;
    }

    private static void ScanTestProjectDirectory(string testProjectDirectory, string repositoryRoot, List<string> violations)
    {
        foreach (string path in Directory.EnumerateFiles(testProjectDirectory, "*.cs", SearchOption.AllDirectories))
        {
            if (IsExcludedSourcePath(path))
                continue;

            ScanSourceFile(path, repositoryRoot, violations);
        }
    }

    private static bool IsExcludedSourcePath(string path)
    {
        string normalized = path.Replace('\\', '/');

        return normalized.Contains("/bin/", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("/obj/", StringComparison.OrdinalIgnoreCase);
    }

    private static void ScanSourceFile(string path, string repositoryRoot, List<string> violations)
    {
        string text = File.ReadAllText(path, Encoding.UTF8);
        SyntaxTree tree = CSharpSyntaxTree.ParseText(text, path: path);
        CompilationUnitSyntax unit = tree.GetCompilationUnitRoot();

        foreach (MemberDeclarationSyntax member in unit.Members)
            WalkMember(member, path, repositoryRoot, violations);
    }

    private static void WalkMember(MemberDeclarationSyntax member, string path, string repositoryRoot, List<string> violations)
    {
        switch (member)
        {
            case BaseNamespaceDeclarationSyntax namespaceDeclaration:
            {
                foreach (MemberDeclarationSyntax inner in namespaceDeclaration.Members)
                    WalkMember(inner, path, repositoryRoot, violations);

                break;
            }
            case TypeDeclarationSyntax typeDeclaration:
                InspectTypeDeclaration(typeDeclaration, path, repositoryRoot, violations);
                break;
        }
    }

    private static void InspectTypeDeclaration(
        TypeDeclarationSyntax typeDeclaration,
        string path,
        string repositoryRoot,
        List<string> violations)
    {
        string typeName = typeDeclaration.Identifier.Text;

        if (typeName.EndsWith("Tests", StringComparison.Ordinal)
            && typeDeclaration.Modifiers.Any(static m => m.IsKind(SyntaxKind.PublicKeyword))
            && !TypeHasSuiteOrCategoryTrait(typeDeclaration))
        {
            string relativePath = Path.GetRelativePath(repositoryRoot, path);
            int line = typeDeclaration.GetLocation().GetLineSpan().StartLinePosition.Line + 1;
            violations.Add($"{relativePath}:{line}: {FormatQualifiedTypeName(typeDeclaration)}");
        }

        foreach (MemberDeclarationSyntax inner in typeDeclaration.Members)
        {
            if (inner is TypeDeclarationSyntax nested)
                InspectTypeDeclaration(nested, path, repositoryRoot, violations);
        }
    }

    private static string FormatQualifiedTypeName(TypeDeclarationSyntax typeDeclaration)
    {
        List<string> segments = [];

        for (SyntaxNode? node = typeDeclaration; node is TypeDeclarationSyntax type; node = node.Parent)
            segments.Insert(0, type.Identifier.Text);

        string? namespaceName = FindContainingNamespaceName(typeDeclaration);

        if (string.IsNullOrWhiteSpace(namespaceName))
            return string.Join(".", segments);

        return namespaceName + "." + string.Join(".", segments);
    }

    private static string? FindContainingNamespaceName(TypeDeclarationSyntax typeDeclaration)
    {
        for (SyntaxNode? node = typeDeclaration.Parent; node is not null; node = node.Parent)
        {
            if (node is BaseNamespaceDeclarationSyntax namespaceDeclaration)
                return namespaceDeclaration.Name.ToString();
        }

        return null;
    }

    private static bool TypeHasSuiteOrCategoryTrait(TypeDeclarationSyntax typeDeclaration)
    {
        foreach (AttributeListSyntax attributeList in typeDeclaration.AttributeLists)
        {
            if (AttributeListDeclaresSuiteOrCategoryTrait(attributeList))
                return true;
        }

        return false;
    }

    private static bool AttributeListDeclaresSuiteOrCategoryTrait(AttributeListSyntax attributeList)
    {
        foreach (AttributeSyntax attribute in attributeList.Attributes)
        {
            if (!IsTraitAttribute(attribute))
                continue;

            if (TraitAttributeTargetsSuiteOrCategory(attribute))
                return true;
        }

        return false;
    }

    private static bool IsTraitAttribute(AttributeSyntax attribute)
    {
        string name = attribute.Name.ToString();

        return name.Equals("Trait", StringComparison.Ordinal)
            || name.Equals("TraitAttribute", StringComparison.Ordinal)
            || name.EndsWith(".Trait", StringComparison.Ordinal)
            || name.EndsWith(".TraitAttribute", StringComparison.Ordinal);
    }

    private static bool TraitAttributeTargetsSuiteOrCategory(AttributeSyntax attribute)
    {
        SeparatedSyntaxList<AttributeArgumentSyntax>? arguments = attribute.ArgumentList?.Arguments;

        if (arguments is null || arguments.Value.Count == 0)
            return false;

        ExpressionSyntax firstArgument = arguments.Value[0].Expression;

        if (firstArgument is not LiteralExpressionSyntax literal)
            return false;

        string? key = literal.Token.ValueText;

        return string.Equals(key, "Suite", StringComparison.Ordinal)
            || string.Equals(key, "Category", StringComparison.Ordinal);
    }
}
