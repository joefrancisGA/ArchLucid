using System.Collections.Immutable;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ArchLucid.Analyzers;

[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class MutatingControllerAuditAnalyzer : DiagnosticAnalyzer
{
    internal const string HttpPostAttributeShortName = "HttpPostAttribute";
    internal const string HttpPutAttributeShortName = "HttpPutAttribute";
    internal const string HttpDeleteAttributeShortName = "HttpDeleteAttribute";

    private static readonly SymbolDisplayFormat AllowlistFqTypeFormat =
        new(globalNamespaceStyle: SymbolDisplayGlobalNamespaceStyle.Omitted,
            typeQualificationStyle: SymbolDisplayTypeQualificationStyle.NameAndContainingTypesAndNamespaces);

    public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics { get; } =
        ImmutableArray.Create(Al0003MutatingControllerAuditDescriptor.Rule);

    public override void Initialize(AnalysisContext analysisContext)
    {
        analysisContext.ConfigureGeneratedCodeAnalysis(GeneratedCodeAnalysisFlags.None);
        analysisContext.EnableConcurrentExecution();
        analysisContext.RegisterCompilationStartAction(OnCompilationStart);
    }

    private static void OnCompilationStart(CompilationStartAnalysisContext compilationStartAnalysisContext)
    {
        Compilation compilation = compilationStartAnalysisContext.Compilation;

        if (!string.Equals(compilation.AssemblyName, "ArchLucid.Api", StringComparison.Ordinal))
            return;

        INamedTypeSymbol? controllerBaseType =
            compilation.GetTypeByMetadataName("Microsoft.AspNetCore.Mvc.ControllerBase");

        INamedTypeSymbol? auditInterfaceType =
            compilation.GetTypeByMetadataName("ArchLucid.Core.Audit.IAuditService");

        INamedTypeSymbol? nonActionAttributeType =
            compilation.GetTypeByMetadataName("Microsoft.AspNetCore.Mvc.NonActionAttribute");

        INamedTypeSymbol? exclusionAttribute =
            compilation.GetTypeByMetadataName(
                "ArchLucid.Core.Audit.MutatingAuditExcludedAttribute");

        if (controllerBaseType is null || auditInterfaceType is null)
            return;

        ImmutableHashSet<string> allowFqEntries =
            MutatingControllerAuditAllowlist.ReadFqAllowlistEntries(
                compilationStartAnalysisContext.Options,
                compilationStartAnalysisContext.CancellationToken);

        compilationStartAnalysisContext.RegisterSemanticModelAction(AnalyzeSemanticModel);

        void AnalyzeSemanticModel(SemanticModelAnalysisContext semanticModelAnalysisContext)
        {
            SemanticModel semanticModelScoped = semanticModelAnalysisContext.SemanticModel;

            Compilation compilationScoped = semanticModelScoped.Compilation;

            if (!string.Equals(compilationScoped.AssemblyName,
                    "ArchLucid.Api",
                    StringComparison.Ordinal))
            {
                return;
            }

            CancellationToken cancellationTokenScoped = semanticModelAnalysisContext.CancellationToken;
            SyntaxTree syntaxTreeScoped = semanticModelScoped.SyntaxTree;
            SyntaxNode syntaxTreeRootScoped = syntaxTreeScoped.GetRoot(cancellationTokenScoped);

            foreach (MethodDeclarationSyntax methodDeclarationScoped in syntaxTreeRootScoped.DescendantNodes()
                         .OfType<MethodDeclarationSyntax>())
            {
                if (methodDeclarationScoped.Body is null && methodDeclarationScoped.ExpressionBody is null)
                    continue;

                IMethodSymbol? methodDeclaredSymbol =
                    semanticModelScoped.GetDeclaredSymbol(methodDeclarationScoped, cancellationTokenScoped);

                if (methodDeclaredSymbol is null ||
                    !MutatingControllerAuditAnalyzer.MethodIsCandidateApiAction(methodDeclaredSymbol,
                        controllerBaseType,
                        nonActionAttributeType))
                {
                    continue;
                }

                if (!MutatingControllerAuditAnalyzer.MethodSpecifiesTrackedVerb(methodDeclaredSymbol))
                    continue;

                string fqAllowlistKeyScoped = MutatingControllerAuditAnalyzer.FormatAllowlistKey(methodDeclaredSymbol);

                if (allowFqEntries.Contains(fqAllowlistKeyScoped))
                    continue;

                if (MutatingControllerAuditAnalyzer.MutatingAuditExcludeApplies(exclusionAttribute, methodDeclaredSymbol))
                    continue;

                if (!MutatingControllerAuditAnalyzer.SemanticBodiesInvokeAuditLogAsync(
                        semanticModelScoped,
                        auditInterfaceType,
                        methodDeclaredSymbol,
                        cancellationTokenScoped))
                {
                    Location identifierLocationScoped = methodDeclarationScoped.Identifier.GetLocation();

                    semanticModelAnalysisContext.ReportDiagnostic(
                        Al0003MutatingControllerAuditDescriptor.Create(identifierLocationScoped,
                            fqAllowlistKeyScoped));
                }
            }
        }
    }

    internal static bool MethodIsCandidateApiAction(
        IMethodSymbol methodDeclaredSymbol,
        INamedTypeSymbol controllerBaseTypeSymbolScoped,
        INamedTypeSymbol? nonActionAttributeTypeSymbolScoped)
    {
        if (methodDeclaredSymbol.MethodKind != MethodKind.Ordinary ||
            methodDeclaredSymbol.IsStatic ||
            methodDeclaredSymbol.AssociatedSymbol is not null ||
            methodDeclaredSymbol.DeclaredAccessibility != Accessibility.Public)
        {
            return false;
        }

        if (!InheritsControllerBase(methodDeclaredSymbol.ContainingType, controllerBaseTypeSymbolScoped))
            return false;

        if (nonActionAttributeTypeSymbolScoped is null)
            return true;

        return !methodDeclaredSymbol.GetAttributes().Any(a =>
            SymbolEqualityComparer.Default.Equals(a.AttributeClass, nonActionAttributeTypeSymbolScoped));
    }

    private static bool InheritsControllerBase(
        INamedTypeSymbol declaringTypeSymbolScoped,
        INamedTypeSymbol controllerBaseTypeSymbolScoped)
    {
        for (INamedTypeSymbol? walkerScoped = declaringTypeSymbolScoped;
             walkerScoped is not null;
             walkerScoped = walkerScoped.BaseType)
        {
            if (SymbolEqualityComparer.Default.Equals(walkerScoped, controllerBaseTypeSymbolScoped))
                return true;
        }

        return false;
    }

    internal static string FormatAllowlistKey(IMethodSymbol methodDeclaredSymbolScoped) =>
        $"{FormatAllowlistFqType(methodDeclaredSymbolScoped.ContainingType)}.{methodDeclaredSymbolScoped.Name}";

    internal static string FormatAllowlistFqType(INamedTypeSymbol namedTypeSymbolScoped)
    {
        string raw = namedTypeSymbolScoped.ToDisplayString(AllowlistFqTypeFormat).Trim();

        if (raw.StartsWith("global::", StringComparison.Ordinal))
            raw = raw.Substring("global::".Length).Trim();

        return raw;
    }

    internal static IEnumerable<SyntaxNode> EnumerateMethodBodies(
        MethodDeclarationSyntax methodDeclarationSyntaxScoped)
    {
        BlockSyntax? blockSyntaxScoped = methodDeclarationSyntaxScoped.Body;

        if (blockSyntaxScoped is not null)
            yield return blockSyntaxScoped;

        ArrowExpressionClauseSyntax? arrowClauseScoped = methodDeclarationSyntaxScoped.ExpressionBody;

        if (arrowClauseScoped is null)
            yield break;

        yield return arrowClauseScoped.Expression;
    }

    internal static bool TrackedVerbAttribute(string attributeSimpleNameScoped)
    {
        return attributeSimpleNameScoped == HttpPostAttributeShortName ||
               attributeSimpleNameScoped == HttpPutAttributeShortName ||
               attributeSimpleNameScoped == HttpDeleteAttributeShortName;
    }

    private static bool MethodSpecifiesTrackedVerb(IMethodSymbol methodDeclaredSymbolScoped)
    {
        foreach (AttributeData attributeDataScoped in methodDeclaredSymbolScoped.GetAttributes())
        {
            INamedTypeSymbol? attributeWalkerNameScoped = attributeDataScoped.AttributeClass;

            for (; attributeWalkerNameScoped is not null;
                   attributeWalkerNameScoped = attributeWalkerNameScoped.BaseType)
            {
                if (TrackedVerbAttribute(attributeWalkerNameScoped.Name))
                    return true;
            }
        }

        return false;
    }

    internal static bool MutatingAuditExcludeApplies(
        INamedTypeSymbol? exclusionAttributeSymbolScoped,
        IMethodSymbol methodDeclaredSymbolScoped)
    {
        if (exclusionAttributeSymbolScoped is null)
            return false;

        foreach (AttributeData attributeDataExcluded in methodDeclaredSymbolScoped.GetAttributes())
        {
            if (SymbolEqualityComparer.Default.Equals(attributeDataExcluded.AttributeClass,
                    exclusionAttributeSymbolScoped))
                return true;
        }

        INamedTypeSymbol? typeWalkerExcluded = methodDeclaredSymbolScoped.ContainingType;

        while (typeWalkerExcluded is not null)
        {
            foreach (AttributeData owningTypeExcluded in typeWalkerExcluded.GetAttributes())
            {
                if (SymbolEqualityComparer.Default.Equals(owningTypeExcluded.AttributeClass,
                        exclusionAttributeSymbolScoped))
                    return true;
            }

            typeWalkerExcluded = typeWalkerExcluded.ContainingType;
        }

        return false;
    }

    internal static bool SemanticBodiesInvokeAuditLogAsync(
        SemanticModel semanticModelScoped,
        INamedTypeSymbol auditInterfaceDeclaredTypeSymbolScoped,
        IMethodSymbol controllerActionDeclaredSymbolScoped,
        CancellationToken cancellationTokenScoped)
    {
        SyntaxTree semanticModelTreeScoped = semanticModelScoped.SyntaxTree;

        foreach (SyntaxReference declaringReferenceScoped in controllerActionDeclaredSymbolScoped
                     .DeclaringSyntaxReferences)
        {
            if (!ReferenceEquals(declaringReferenceScoped.SyntaxTree, semanticModelTreeScoped))
                continue;

            SyntaxNode syntaxFromReferenceScoped =
                declaringReferenceScoped.GetSyntax(cancellationTokenScoped);

            if (syntaxFromReferenceScoped.FirstAncestorOrSelf<MethodDeclarationSyntax>() is not
                MethodDeclarationSyntax methodAnchorSyntax)
            {
                continue;
            }

            foreach (SyntaxNode bodySubtreeScoped in EnumerateMethodBodies(methodAnchorSyntax))
            {
                foreach (InvocationExpressionSyntax invocationSyntaxScoped in bodySubtreeScoped
                             .DescendantNodesAndSelf()
                             .OfType<InvocationExpressionSyntax>())
                {
                    if (InvocationMatchesAuditInterfaceSemantic(
                            semanticModelScoped,
                            auditInterfaceDeclaredTypeSymbolScoped,
                            invocationSyntaxScoped,
                            cancellationTokenScoped))
                    {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    internal static bool InvocationMatchesAuditInterfaceSemantic(
        SemanticModel semanticModelSemanticInvocation,
        INamedTypeSymbol auditInterfaceDeclaredTypeSymbolScopedSemantic,
        InvocationExpressionSyntax invocationExpressionSyntaxSemantic,
        CancellationToken cancellationTokenSemantic)
    {
        if (semanticModelSemanticInvocation.GetSymbolInfo(invocationExpressionSyntaxSemantic,
                   cancellationTokenSemantic)
               .Symbol
               is not IMethodSymbol calleeSemantic)
            return false;

        if (!string.Equals(calleeSemantic.Name, "LogAsync", StringComparison.Ordinal))
            return false;

        if (!SymbolEqualityComparer.Default.Equals(
                calleeSemantic.ContainingType?.OriginalDefinition,
                auditInterfaceDeclaredTypeSymbolScopedSemantic.OriginalDefinition))
        {
            return false;
        }

        return true;
    }
}
