using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace ArchLucid.Analyzers;

internal static class TenantScopedSqlExpressionResolver
{
    private static readonly HashSet<string> RecognizedScopeHelperMethods = new(StringComparer.Ordinal)
    {
        "InnerJoinRuns",
        "AndTripleWhere",
        "AndProjectIdTripleWhere",
        "AndScopeProjectIdTripleWhere",
    };

    internal sealed class ResolutionResult
    {
        internal ResolutionResult(string? sqlText, bool isStaticallyResolved, bool hasScopeHelperInvocation)
        {
            SqlText = sqlText;
            IsStaticallyResolved = isStaticallyResolved;
            HasScopeHelperInvocation = hasScopeHelperInvocation;
        }

        internal string? SqlText { get; }

        internal bool IsStaticallyResolved { get; }

        internal bool HasScopeHelperInvocation { get; }

        internal ResolutionResult WithScopeHelper(bool hasScopeHelperInvocation) =>
            new ResolutionResult(SqlText, IsStaticallyResolved, hasScopeHelperInvocation);
    }

    internal static ResolutionResult Resolve(ExpressionSyntax? expression, SemanticModel semanticModel)
    {
        if (expression is null)
            return new ResolutionResult(null, false, false);

        return ResolveCore(expression, semanticModel, visitingInterpolatedHole: false);
    }

    private static ResolutionResult ResolveCore(
        ExpressionSyntax expression,
        SemanticModel semanticModel,
        bool visitingInterpolatedHole)
    {
        switch (expression)
        {
            case LiteralExpressionSyntax literal when literal.IsKind(SyntaxKind.StringLiteralExpression):
                return new ResolutionResult(literal.Token.ValueText, true, false);

            case IdentifierNameSyntax identifier:
                return ResolveFromSymbol(identifier, semanticModel);

            case MemberAccessExpressionSyntax memberAccess:
                if (IsRecognizedScopeHelper(memberAccess, semanticModel))
                    return new ResolutionResult(string.Empty, true, true);

                return ResolveFromSymbol(memberAccess, semanticModel);

            case InvocationExpressionSyntax invocation:
                if (IsRecognizedScopeHelperInvocation(invocation, semanticModel))
                    return new ResolutionResult(string.Empty, true, true);

                if (invocation.Expression is MemberAccessExpressionSyntax concatAccess &&
                    (string.Equals(concatAccess.Name.Identifier.Text, "Concat", StringComparison.Ordinal) ||
                     string.Equals(concatAccess.Name.Identifier.Text, "Join", StringComparison.Ordinal)))
                    return ResolveStringConcat(invocation, semanticModel);

                return ResolveFromSymbol(invocation, semanticModel);

            case BinaryExpressionSyntax { RawKind: (int)SyntaxKind.AddExpression } add:
                return ResolveBinaryAdd(add, semanticModel);

            case InterpolatedStringExpressionSyntax interpolated:
                return ResolveInterpolatedString(interpolated, semanticModel);

            case ParenthesizedExpressionSyntax parenthesized:
                return ResolveCore(parenthesized.Expression, semanticModel, visitingInterpolatedHole);

            default:
                if (visitingInterpolatedHole)
                    return new ResolutionResult(null, false, IsScopeHelperExpression(expression, semanticModel));

                return new ResolutionResult(null, false, IsScopeHelperExpression(expression, semanticModel));
        }
    }

    private static ResolutionResult ResolveBinaryAdd(BinaryExpressionSyntax add, SemanticModel semanticModel)
    {
        ResolutionResult left = ResolveCore(add.Left, semanticModel, visitingInterpolatedHole: false);
        ResolutionResult right = ResolveCore(add.Right, semanticModel, visitingInterpolatedHole: false);

        if (!left.IsStaticallyResolved || !right.IsStaticallyResolved)
        {
            return new ResolutionResult(
                null,
                false,
                left.HasScopeHelperInvocation || right.HasScopeHelperInvocation ||
                IsScopeHelperExpression(add.Left, semanticModel) ||
                IsScopeHelperExpression(add.Right, semanticModel));
        }

        return new ResolutionResult(
            (left.SqlText ?? string.Empty) + (right.SqlText ?? string.Empty),
            true,
            left.HasScopeHelperInvocation || right.HasScopeHelperInvocation);
    }

    private static ResolutionResult ResolveInterpolatedString(
        InterpolatedStringExpressionSyntax interpolated,
        SemanticModel semanticModel)
    {
        bool hasScopeHelper = false;
        bool allStatic = true;
        System.Text.StringBuilder builder = new();

        foreach (InterpolatedStringContentSyntax content in interpolated.Contents)
        {
            switch (content)
            {
                case InterpolatedStringTextSyntax text:
                    builder.Append(text.TextToken.ValueText);

                    break;

                case InterpolationSyntax interpolation:
                    ResolutionResult hole = ResolveCore(interpolation.Expression, semanticModel, visitingInterpolatedHole: true);

                    if (hole.HasScopeHelperInvocation)
                        hasScopeHelper = true;

                    if (hole.IsStaticallyResolved && hole.SqlText is not null)
                        builder.Append(hole.SqlText);
                    else if (IsScopeHelperExpression(interpolation.Expression, semanticModel))
                        hasScopeHelper = true;
                    else
                        allStatic = false;

                    break;
            }
        }

        if (allStatic)
            return new ResolutionResult(builder.ToString(), true, hasScopeHelper);

        return new ResolutionResult(null, false, hasScopeHelper);
    }

    private static ResolutionResult ResolveStringConcat(InvocationExpressionSyntax invocation, SemanticModel semanticModel)
    {
        bool hasScopeHelper = false;
        bool allStatic = true;
        System.Text.StringBuilder builder = new();

        foreach (ExpressionSyntax argument in invocation.ArgumentList.Arguments.Select(a => a.Expression))
        {
            ResolutionResult part = ResolveCore(argument, semanticModel, visitingInterpolatedHole: false);

            if (part.HasScopeHelperInvocation)
                hasScopeHelper = true;

            if (part.IsStaticallyResolved && part.SqlText is not null)
                builder.Append(part.SqlText);
            else if (IsScopeHelperExpression(argument, semanticModel))
                hasScopeHelper = true;
            else
                allStatic = false;
        }

        if (allStatic)
            return new ResolutionResult(builder.ToString(), true, hasScopeHelper);

        return new ResolutionResult(null, false, hasScopeHelper);
    }

    private static ResolutionResult ResolveFromSymbol(ExpressionSyntax expression, SemanticModel semanticModel)
    {
        ISymbol? symbol = semanticModel.GetSymbolInfo(expression).Symbol;

        if (symbol is IFieldSymbol { IsConst: true } field && field.ConstantValue is string constValue)
            return new ResolutionResult(constValue, true, false);

        if (symbol is ILocalSymbol { IsConst: true } local && local.ConstantValue is string localConst)
            return new ResolutionResult(localConst, true, false);

        ResolutionResult? fromInitializer = TryResolveFromDeclaratorInitializer(symbol, semanticModel);

        if (fromInitializer is not null)
            return fromInitializer;

        if (expression is MemberAccessExpressionSyntax member &&
            (string.Equals(member.Name.Identifier.Text, "ScopeWhereClause", StringComparison.Ordinal) ||
             string.Equals(member.Name.Identifier.Text, "RunChildScopeWhereClause", StringComparison.Ordinal)) &&
            (member.Expression.ToString().Contains("RunChildRunScopeSql", StringComparison.Ordinal) ||
             member.Expression.ToString().Contains("PersistenceTenantScope", StringComparison.Ordinal)))
            return new ResolutionResult(RunChildScopeWhereClauseMarker, true, true);

        Optional<object?> constant = semanticModel.GetConstantValue(expression);

        if (constant.HasValue && constant.Value is string constantSql)
            return new ResolutionResult(constantSql, true, false);

        return new ResolutionResult(null, false, IsScopeHelperExpression(expression, semanticModel));
    }

    private static ResolutionResult? TryResolveFromDeclaratorInitializer(ISymbol? symbol, SemanticModel semanticModel)
    {
        SyntaxReference? syntaxReference = symbol?.DeclaringSyntaxReferences.FirstOrDefault();

        if (syntaxReference is null)
            return null;

        SyntaxNode syntax = syntaxReference.GetSyntax();
        SemanticModel modelForSyntax = GetSemanticModelForSyntax(syntax, semanticModel);

        if (symbol is ILocalSymbol or IFieldSymbol &&
            syntax is VariableDeclaratorSyntax declarator &&
            declarator.Initializer?.Value is ExpressionSyntax declaratorInitializer)
        {
            return ResolveCore(declaratorInitializer, modelForSyntax, visitingInterpolatedHole: false);
        }

        if (symbol is IPropertySymbol &&
            syntax is PropertyDeclarationSyntax propertyDeclaration &&
            propertyDeclaration.Initializer?.Value is ExpressionSyntax propertyInitializer)
        {
            return ResolveCore(propertyInitializer, modelForSyntax, visitingInterpolatedHole: false);
        }

        return null;
    }

    private static SemanticModel GetSemanticModelForSyntax(SyntaxNode syntax, SemanticModel semanticModel)
    {
        if (ReferenceEquals(syntax.SyntaxTree, semanticModel.SyntaxTree))
            return semanticModel;

        return semanticModel.Compilation.GetSemanticModel(syntax.SyntaxTree, ignoreAccessibility: false);
    }

    private const string RunChildScopeWhereClauseMarker =
        "run_scope.TenantId = @TenantId AND run_scope.WorkspaceId = @WorkspaceId AND run_scope.ScopeProjectId = @ScopeProjectId";

    private static bool IsRecognizedScopeHelperInvocation(InvocationExpressionSyntax invocation, SemanticModel semanticModel)
    {
        if (invocation.Expression is not MemberAccessExpressionSyntax memberAccess)
            return false;

        return IsRecognizedScopeHelper(memberAccess, semanticModel);
    }

    private static bool IsRecognizedScopeHelper(MemberAccessExpressionSyntax memberAccess, SemanticModel semanticModel)
    {
        string methodName = memberAccess.Name.Identifier.Text;

        if (!RecognizedScopeHelperMethods.Contains(methodName))
            return false;

        ISymbol? symbol = semanticModel.GetSymbolInfo(memberAccess).Symbol;

        if (symbol is not IMethodSymbol method)
            return false;

        string containingType = method.ContainingType.ToDisplayString();

        return containingType.Contains("RunChildRunScopeSql", StringComparison.Ordinal) ||
               containingType.Contains("RepositoryScopePredicate", StringComparison.Ordinal) ||
               containingType.Contains("PersistenceTenantScope", StringComparison.Ordinal);
    }

    private static bool IsScopeHelperExpression(ExpressionSyntax expression, SemanticModel semanticModel)
    {
        if (expression is InvocationExpressionSyntax invocation)
            return IsRecognizedScopeHelperInvocation(invocation, semanticModel);

        if (expression is MemberAccessExpressionSyntax memberAccess)
            return IsRecognizedScopeHelper(memberAccess, semanticModel);

        return false;
    }
}
