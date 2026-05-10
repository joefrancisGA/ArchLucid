using System.Collections.Immutable;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ArchLucid.Analyzers;

[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class MutableStaticAnalyzer : DiagnosticAnalyzer
{
    public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics
    {
        get;
    } =
        [Arch005Descriptor.Rule];

    public override void Initialize(AnalysisContext context)
    {
        context.ConfigureGeneratedCodeAnalysis(GeneratedCodeAnalysisFlags.None);
        context.EnableConcurrentExecution();
        context.RegisterCompilationStartAction(OnCompilationStart);
    }

    private static void OnCompilationStart(CompilationStartAnalysisContext context)
    {
        if (!ShouldAnalyzeAssembly(context.Compilation.AssemblyName))
            return;

        context.RegisterSymbolAction(AnalyzeField, SymbolKind.Field);
        context.RegisterSymbolAction(AnalyzeProperty, SymbolKind.Property);
    }

    private static bool ShouldAnalyzeAssembly(string? assemblyName)
    {
        if (assemblyName is not { Length: > 0 } name)
            return false;

        return string.Equals(name, "ArchLucid.Application", StringComparison.Ordinal) ||
               string.Equals(name, "ArchLucid.AgentRuntime", StringComparison.Ordinal);
    }

    private static void AnalyzeField(SymbolAnalysisContext context)
    {
        var field = (IFieldSymbol)context.Symbol;

        if (!field.IsStatic || field.IsConst || field.IsReadOnly)
            return;

        if (field.IsImplicitlyDeclared)
            return;

        if (HasThreadStatic(field))
            return;

        Location loc = field.Locations.Length > 0 ? field.Locations[0] : Location.None;

        context.ReportDiagnostic(Arch005Descriptor.Create(loc, field.ToDisplayString()));
    }

    private static void AnalyzeProperty(SymbolAnalysisContext context)
    {
        var property = (IPropertySymbol)context.Symbol;

        if (!property.IsStatic || property.IsIndexer)
            return;

        IMethodSymbol? setter = property.SetMethod;

        if (setter is null)
            return;

        if (setter.DeclaredAccessibility != Accessibility.Public &&
            setter.DeclaredAccessibility != Accessibility.Internal)
            return;

        Location loc = property.Locations.Length > 0 ? property.Locations[0] : Location.None;

        context.ReportDiagnostic(Arch005Descriptor.Create(loc, property.ToDisplayString()));
    }

    private static bool HasThreadStatic(IFieldSymbol field)
    {
        foreach (AttributeData attr in field.GetAttributes())
        {
            if (attr.AttributeClass is { Name: "ThreadStaticAttribute" or "ThreadStatic" })
                return true;

            string? display = attr.AttributeClass?.ToDisplayString();

            if (display is not null &&
                string.Equals(display, "System.ThreadStaticAttribute", StringComparison.Ordinal))
                return true;
        }

        return false;
    }
}
