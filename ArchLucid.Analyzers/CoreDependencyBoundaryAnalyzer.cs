using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ArchLucid.Analyzers;

/// <summary>
/// Semantic dependency guard for the pure core assembly. Unlike source-token
/// scanning this resolves actual referenced symbols (including aliases).
/// Its descriptor remains informational; ArchLucid.Core/.editorconfig upgrades
/// FND017001 to an error only for production Core source files.
/// </summary>
[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class CoreDependencyBoundaryAnalyzer : DiagnosticAnalyzer
{
    public const string DiagnosticId = "FND017001";

    private static readonly DiagnosticDescriptor Rule = new(
        DiagnosticId,
        "Core must not depend on API or persistence implementation",
        "Core dependency '{0}' crosses the application architecture boundary",
        "Architecture",
        DiagnosticSeverity.Info,
        isEnabledByDefault: true,
        description: "Core must not reference API, persistence or HTTP hosting types.");

    public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics =>
        ImmutableArray.Create(Rule);

    public override void Initialize(AnalysisContext context)
    {
        context.ConfigureGeneratedCodeAnalysis(GeneratedCodeAnalysisFlags.None);
        context.EnableConcurrentExecution();
        context.RegisterCompilationStartAction(start =>
        {
            if (start.Compilation.AssemblyName != "ArchLucid.Core")
                return;
            start.RegisterSyntaxNodeAction(AnalyzeType,
                Microsoft.CodeAnalysis.CSharp.SyntaxKind.IdentifierName,
                Microsoft.CodeAnalysis.CSharp.SyntaxKind.GenericName);
        });
    }

    private static void AnalyzeType(SyntaxNodeAnalysisContext context)
    {
        if (context.Node is not SimpleNameSyntax name)
            return;
        // Only check the rightmost name in qualified syntax to avoid duplicates.
        if (name.Parent is QualifiedNameSyntax qualified &&
            !ReferenceEquals(qualified.Right, name))
            return;
        // A type may appear as a static member receiver, for example
        // SecretService.Touch(). Skipping the expression side of member access
        // would miss that forbidden dependency. Namespace and member symbols
        // are filtered by the INamedTypeSymbol check below.

        var symbol = context.SemanticModel.GetSymbolInfo(name, context.CancellationToken).Symbol;
        if (symbol is IAliasSymbol alias)
            symbol = alias.Target;
        if (symbol is not INamedTypeSymbol type)
            return;
        var assembly = type.ContainingAssembly?.Name;
        if (assembly is null)
            return;
        if (assembly == "ArchLucid.Api" ||
            assembly == "ArchLucid.Persistence" ||
            assembly.StartsWith("ArchLucid.Host.", StringComparison.Ordinal))
            context.ReportDiagnostic(Diagnostic.Create(Rule, name.GetLocation(),
                type.ToDisplayString()));
    }
}
