using Microsoft.CodeAnalysis.Text;

using System.Collections.Immutable;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ArchLucid.Analyzers;

[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class TenantScopedQueryScopeBindingAnalyzer : DiagnosticAnalyzer
{
    private const string PersistenceAssemblyName = "ArchLucid.Persistence";

    private static readonly ImmutableHashSet<string> DapperQueryMethodNames = ImmutableHashSet.Create(
        StringComparer.Ordinal,
        "Execute",
        "ExecuteAsync",
        "Query",
        "QueryAsync",
        "QuerySingle",
        "QuerySingleAsync",
        "QuerySingleOrDefault",
        "QuerySingleOrDefaultAsync",
        "QueryFirst",
        "QueryFirstAsync",
        "QueryFirstOrDefault",
        "QueryFirstOrDefaultAsync",
        "ExecuteScalar",
        "ExecuteScalarAsync",
        "ExecuteReader",
        "ExecuteReaderAsync");

    public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics { get; } =
    [
        Arch006Descriptor.UnscopedTableRule,
        Arch006Descriptor.UnanalyzableSqlRule,
        Arch006Descriptor.EmptyExemptionJustificationRule,
    ];

    public override void Initialize(AnalysisContext context)
    {
        context.ConfigureGeneratedCodeAnalysis(GeneratedCodeAnalysisFlags.None);
        context.EnableConcurrentExecution();
        context.RegisterCompilationStartAction(OnCompilationStart);
    }

    private static void OnCompilationStart(CompilationStartAnalysisContext context)
    {
        if (!string.Equals(context.Compilation.AssemblyName, PersistenceAssemblyName, StringComparison.Ordinal))
            return;

        TenantScopedTableRegistry registry = LoadRegistry(context.Options);

        if (registry == TenantScopedTableRegistry.Empty)
            return;

        context.RegisterSyntaxNodeAction(
            c => AnalyzeInvocation(c, registry),
            SyntaxKind.InvocationExpression);

        context.RegisterSyntaxNodeAction(
            c => AnalyzeObjectCreation(c, registry),
            SyntaxKind.ObjectCreationExpression);

        context.RegisterSyntaxNodeAction(
            c => AnalyzeTypeDeclaration(c, context.Compilation),
            SyntaxKind.ClassDeclaration);

        context.RegisterSyntaxNodeAction(
            c => AnalyzeMethodDeclaration(c, context.Compilation),
            SyntaxKind.MethodDeclaration);
    }

    private static TenantScopedTableRegistry LoadRegistry(AnalyzerOptions options)
    {
        foreach (AdditionalText additionalFile in options.AdditionalFiles)
        {
            if (!additionalFile.Path.EndsWith("tenant_scoped_tables.v1.json", StringComparison.OrdinalIgnoreCase))
                continue;

            SourceText? text = additionalFile.GetText();

            if (text is null)
                continue;

            return TenantScopedTableRegistry.LoadFromAdditionalFile(text.ToString());
        }

        return TenantScopedTableRegistry.Empty;
    }

    private static void AnalyzeTypeDeclaration(SyntaxNodeAnalysisContext context, Compilation compilation)
    {
        if (context.Node is not ClassDeclarationSyntax classDeclaration)
            return;

        ISymbol? symbol = context.SemanticModel.GetDeclaredSymbol(classDeclaration);

        if (symbol is null)
            return;

        foreach (Diagnostic diagnostic in TenantScopeExemptSymbolHelper.ValidateExemptionAttributes(symbol, compilation))
            context.ReportDiagnostic(diagnostic);
    }

    private static void AnalyzeMethodDeclaration(SyntaxNodeAnalysisContext context, Compilation compilation)
    {
        if (context.Node is not MethodDeclarationSyntax methodDeclaration)
            return;

        ISymbol? symbol = context.SemanticModel.GetDeclaredSymbol(methodDeclaration);

        if (symbol is null)
            return;

        foreach (Diagnostic diagnostic in TenantScopeExemptSymbolHelper.ValidateExemptionAttributes(symbol, compilation))
            context.ReportDiagnostic(diagnostic);
    }

    private static void AnalyzeInvocation(SyntaxNodeAnalysisContext context, TenantScopedTableRegistry registry)
    {
        if (context.Node is not InvocationExpressionSyntax invocation)
            return;

        if (!TryGetSqlArgument(invocation, context.SemanticModel, out ExpressionSyntax? sqlExpression))
            return;

        AnalyzeSqlExpression(context, registry, sqlExpression, invocation.GetLocation());
    }

    private static void AnalyzeObjectCreation(SyntaxNodeAnalysisContext context, TenantScopedTableRegistry registry)
    {
        if (context.Node is not ObjectCreationExpressionSyntax objectCreation)
            return;

        ITypeSymbol? type = context.SemanticModel.GetTypeInfo(objectCreation).Type;

        if (type is null || !string.Equals(type.Name, "CommandDefinition", StringComparison.Ordinal))
            return;

        if (objectCreation.ArgumentList?.Arguments.Count is not > 0)
            return;

        ExpressionSyntax? sqlExpression = TryGetCommandDefinitionSqlExpression(objectCreation);

        if (sqlExpression is null)
            return;

        AnalyzeSqlExpression(context, registry, sqlExpression, objectCreation.GetLocation());
    }

    private static ExpressionSyntax? TryGetCommandDefinitionSqlExpression(ObjectCreationExpressionSyntax objectCreation)
    {
        if (objectCreation.ArgumentList is null)
            return null;

        foreach (ArgumentSyntax argument in objectCreation.ArgumentList.Arguments)
        {
            string? parameterName = argument.NameColon?.Name.Identifier.Text;

            if (parameterName is not null &&
                (string.Equals(parameterName, "command", StringComparison.Ordinal) ||
                 string.Equals(parameterName, "commandText", StringComparison.Ordinal)))
                return argument.Expression;
        }

        return objectCreation.ArgumentList.Arguments[0].Expression;
    }

    private static void AnalyzeSqlExpression(
        SyntaxNodeAnalysisContext context,
        TenantScopedTableRegistry registry,
        ExpressionSyntax sqlExpression,
        Location reportLocation)
    {
        ISymbol? containingSymbol = context.ContainingSymbol;

        if (TenantScopeExemptSymbolHelper.TryGetExemption(containingSymbol, context.Compilation) is not null)
            return;

        TenantScopedSqlExpressionResolver.ResolutionResult resolution =
            TenantScopedSqlExpressionResolver.Resolve(sqlExpression, context.SemanticModel);

        if (!resolution.IsStaticallyResolved || resolution.SqlText is null)
        {
            ReportUnanalyzableIfScopedTableReferenced(context, registry, resolution, reportLocation);

            return;
        }

        AnalyzeResolvedSql(context, registry, resolution, reportLocation);
    }

    private static void AnalyzeResolvedSql(
        SyntaxNodeAnalysisContext context,
        TenantScopedTableRegistry registry,
        TenantScopedSqlExpressionResolver.ResolutionResult resolution,
        Location reportLocation)
    {
        string sqlText = resolution.SqlText ?? string.Empty;
        IReadOnlyList<string> targets = TenantScopedQuerySqlInspector.GetTopLevelScopedTargets(sqlText);

        foreach (string table in targets)
        {
            if (!registry.IsTenantScoped(table))
                continue;

            bool requiresTriple = registry.RequiresTripleScope(table);

            if (TenantScopedQuerySqlInspector.IsScopeBoundForTable(
                    sqlText,
                    table,
                    requiresTriple,
                    resolution.HasScopeHelperInvocation))
                continue;

            context.ReportDiagnostic(Arch006Descriptor.CreateUnscopedTable(reportLocation, table));
        }
    }

    private static void ReportUnanalyzableIfScopedTableReferenced(
        SyntaxNodeAnalysisContext context,
        TenantScopedTableRegistry registry,
        TenantScopedSqlExpressionResolver.ResolutionResult resolution,
        Location reportLocation)
    {
        if (resolution.HasScopeHelperInvocation)
            return;

        if (context.Node is not ExpressionSyntax expression)
            return;

        string expressionText = expression.ToString();

        foreach (string table in GuessTablesFromExpressionText(expressionText))
        {
            if (!registry.IsTenantScoped(table))
                continue;

            context.ReportDiagnostic(Arch006Descriptor.CreateUnanalyzableSql(reportLocation, table));

            return;
        }
    }

    private static IEnumerable<string> GuessTablesFromExpressionText(string expressionText)
    {
        foreach (System.Text.RegularExpressions.Match match in System.Text.RegularExpressions.Regex.Matches(
                     expressionText,
                     @"(?:FROM|JOIN|INTO|UPDATE|DELETE\s+FROM|MERGE)\s+(?:\[?dbo\]?\.)?\[?(?<table>[A-Za-z_][A-Za-z0-9_]*)\]?",
                     System.Text.RegularExpressions.RegexOptions.IgnoreCase))
        {
            string? normalized = TenantScopedTableRegistry.NormalizeTableName(match.Groups["table"].Value);

            if (normalized is not null)
                yield return normalized;
        }
    }

    private static bool TryGetSqlArgument(
        InvocationExpressionSyntax invocation,
        SemanticModel semanticModel,
        out ExpressionSyntax sqlExpression)
    {
        sqlExpression = null!;

        if (invocation.Expression is not MemberAccessExpressionSyntax memberAccess)
            return false;

        if (!DapperQueryMethodNames.Contains(memberAccess.Name.Identifier.Text))
            return false;

        IMethodSymbol? method = semanticModel.GetSymbolInfo(memberAccess).Symbol as IMethodSymbol;

        if (method is null)
            return false;

        if (!IsDapperSqlMapperMethod(method))
            return false;

        if (invocation.ArgumentList.Arguments.Count == 0)
            return false;

        ExpressionSyntax? sql = TryGetSqlArgumentExpression(invocation, method);

        if (sql is null)
            return false;

        sqlExpression = sql;

        return true;
    }

    private static ExpressionSyntax? TryGetSqlArgumentExpression(
        InvocationExpressionSyntax invocation,
        IMethodSymbol method)
    {
        SeparatedSyntaxList<ArgumentSyntax> arguments = invocation.ArgumentList.Arguments;

        for (int index = 0; index < arguments.Count; index++)
        {
            ArgumentSyntax argument = arguments[index];
            string? parameterName = argument.NameColon?.Name.Identifier.Text;

            if (parameterName is not null)
            {
                if (IsSqlParameterName(parameterName))
                    return argument.Expression;

                continue;
            }

            if (index >= method.Parameters.Length)
                continue;

            IParameterSymbol parameter = method.Parameters[index];

            if (IsSqlParameterName(parameter.Name))
                return argument.Expression;
        }

        return null;
    }

    private static bool IsSqlParameterName(string parameterName) =>
        string.Equals(parameterName, "sql", StringComparison.Ordinal) ||
        string.Equals(parameterName, "command", StringComparison.Ordinal) ||
        string.Equals(parameterName, "commandText", StringComparison.Ordinal);

    private static bool IsDapperSqlMapperMethod(IMethodSymbol method)
    {
        INamedTypeSymbol containingType = method.ContainingType;

        return string.Equals(containingType.Name, "SqlMapper", StringComparison.Ordinal) &&
               string.Equals(containingType.ContainingNamespace.ToDisplayString(), "Dapper", StringComparison.Ordinal);
    }
}
