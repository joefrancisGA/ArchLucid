using System.Collections.Immutable;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ArchLucid.Analyzers;

[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class ForeachToLinqAnalyzer : DiagnosticAnalyzer
{
    internal const string SelectSummary = "Select + AddRange";
    internal const string WhereSummary = "Where + AddRange";

    public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics
    {
        get;
    } =
        [Al0002ForeachToLinqDescriptor.Rule];

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

        context.RegisterSyntaxNodeAction(AnalyzeForeach, SyntaxKind.ForEachStatement);
    }

    internal static ForeachToLinqMatch? TryAnalyzeForeach(
        ForEachStatementSyntax foreachSyntax,
        SemanticModel semanticModel,
        CancellationToken cancellationToken)
    {
        if (!foreachSyntax.AwaitKeyword.IsKind(SyntaxKind.None))
            return null;

        if (foreachSyntax.Identifier.ValueText == "_")
            return null;

        ILocalSymbol? loopSymbol = semanticModel.GetDeclaredSymbol(foreachSyntax, cancellationToken);

        if (loopSymbol is null || loopSymbol.Kind != SymbolKind.Local)
            return null;

        if (foreachSyntax.Statement is not BlockSyntax body)
            return null;

        if (!BodyIsSimpleEnough(body))
            return null;

        if (SyntaxContainsAwait(body) || ContainsAsyncAnonymousFunction(body))
            return null;

        if (TryMatchSelectPattern(
                body,
                semanticModel,
                loopSymbol,
                cancellationToken,
                out InvocationExpressionSyntax? selectAddInvocation,
                out ExpressionSyntax? selectListReceiver))
        {
            if (!IsBuiltInListReceiverAndAddInvocation(
                    selectAddInvocation!,
                    selectListReceiver!,
                    semanticModel,
                    cancellationToken,
                    out _))
            {
                return null;
            }

            ExpressionSyntax addArg = selectAddInvocation!.ArgumentList.Arguments[0].Expression;

            if (!ExpressionSemanticallyTouchesLoop(loopSymbol, addArg, semanticModel, cancellationToken))
                return null;

            if (IsOrContainsAssignment(addArg) || ExpressionContainsRefOrOutKeywords(addArg))
                return null;

            return new ForeachToLinqMatch(
                ForeachToLinqKind.SelectAddRange,
                foreachSyntax,
                selectListReceiver!,
                addArg,
                whereCondition: null);
        }

        if (TryMatchWherePattern(
                body,
                semanticModel,
                loopSymbol,
                cancellationToken,
                out InvocationExpressionSyntax? whereAddInvocation,
                out ExpressionSyntax? whereListReceiver,
                out ExpressionSyntax? predicate))
        {
            if (!IsBuiltInListReceiverAndAddInvocation(
                    whereAddInvocation!,
                    whereListReceiver!,
                    semanticModel,
                    cancellationToken,
                    out _))
            {
                return null;
            }

            ExpressionSyntax addArgWhere = whereAddInvocation!.ArgumentList.Arguments[0].Expression;

            if (addArgWhere is not IdentifierNameSyntax filteredId ||
                !SymbolEqualityComparer.Default.Equals(
                    semanticModel.GetSymbolInfo(filteredId, cancellationToken).Symbol,
                    loopSymbol))
            {
                return null;
            }

            if (predicate is null ||
                !ExpressionSemanticallyTouchesLoop(loopSymbol, predicate, semanticModel, cancellationToken) ||
                IsOrContainsAssignment(predicate) ||
                ExpressionContainsRefOrOutKeywords(predicate))
            {
                return null;
            }

            return new ForeachToLinqMatch(
                ForeachToLinqKind.WhereAddRange,
                foreachSyntax,
                whereListReceiver!,
                addArgWhere,
                whereCondition: predicate);
        }

        return null;
    }

    private static bool ShouldAnalyzeAssembly(string? assemblyName)
    {
        if (assemblyName is not { Length: > 0 })
            return false;

        if (string.Equals(assemblyName, "ArchLucid.Analyzers", StringComparison.Ordinal))
            return false;

        if (assemblyName.EndsWith(".Tests", StringComparison.Ordinal))
            return false;

        return true;
    }

    private static void AnalyzeForeach(SyntaxNodeAnalysisContext context)
    {
        ForEachStatementSyntax foreachSyntax = (ForEachStatementSyntax)context.Node;
        ForeachToLinqMatch? match = TryAnalyzeForeach(foreachSyntax, context.SemanticModel, context.CancellationToken);

        if (match is null)
            return;

        string summary = match.Value.Kind == ForeachToLinqKind.SelectAddRange ? SelectSummary : WhereSummary;

        context.ReportDiagnostic(
            Al0002ForeachToLinqDescriptor.Create(foreachSyntax.ForEachKeyword.GetLocation(), summary));
    }

    private static bool BodyIsSimpleEnough(BlockSyntax body)
    {
        return body.Statements.Count == 1;
    }

    private static bool SyntaxContainsAwait(SyntaxNode node) =>
        node.DescendantNodesAndSelf().Any(static n => n is AwaitExpressionSyntax);

    private static bool ContainsAsyncAnonymousFunction(SyntaxNode node) =>
        node.DescendantNodesAndSelf().OfType<AnonymousFunctionExpressionSyntax>().Any(
            static a => a.AsyncKeyword.IsKind(SyntaxKind.AsyncKeyword));

    private static bool TryMatchSelectPattern(
        BlockSyntax body,
        SemanticModel semanticModel,
        ILocalSymbol loopSymbol,
        CancellationToken cancellationToken,
        out InvocationExpressionSyntax? addInvocation,
        out ExpressionSyntax? listReceiver)
    {
        addInvocation = null;
        listReceiver = null;

        if (body.Statements[0] is not ExpressionStatementSyntax { Expression: InvocationExpressionSyntax inv })
            return false;

        if (!TryGetListAddInvocation(inv, out ExpressionSyntax? recv))
            return false;

        if (ExpressionSemanticallyTouchesLoop(loopSymbol, recv, semanticModel, cancellationToken))
            return false;

        addInvocation = inv;
        listReceiver = recv;

        return true;
    }

    private static bool TryMatchWherePattern(
        BlockSyntax body,
        SemanticModel semanticModel,
        ILocalSymbol loopSymbol,
        CancellationToken cancellationToken,
        out InvocationExpressionSyntax? addInvocation,
        out ExpressionSyntax? listReceiver,
        out ExpressionSyntax? predicate)
    {
        addInvocation = null;
        listReceiver = null;
        predicate = null;

        if (body.Statements[0] is not IfStatementSyntax ifStmt)
            return false;

        if (ifStmt.ElseClause is not null)
            return false;

        predicate = ifStmt.Condition;

        if (!TryGetSingleAddStatement(ifStmt.Statement, out InvocationExpressionSyntax? inv))
            return false;

        if (!TryGetListAddInvocation(inv, out ExpressionSyntax? recv))
            return false;

        if (ExpressionSemanticallyTouchesLoop(loopSymbol, recv, semanticModel, cancellationToken))
            return false;

        addInvocation = inv;
        listReceiver = recv;

        return true;
    }

    private static bool TryGetSingleAddStatement(StatementSyntax statement, out InvocationExpressionSyntax? addInvocation)
    {
        StatementSyntax unwrap = StripSimpleBraces(statement);

        if (unwrap is ExpressionStatementSyntax { Expression: InvocationExpressionSyntax inv })
        {
            addInvocation = inv;

            return true;
        }

        addInvocation = null;

        return false;
    }

    private static StatementSyntax StripSimpleBraces(StatementSyntax statement)
    {
        if (statement is BlockSyntax { Statements.Count: 1 } b)
            return b.Statements[0];

        return statement;
    }

    private static bool TryGetListAddInvocation(InvocationExpressionSyntax inv, out ExpressionSyntax receiver)
    {
        receiver = null!;

        if (inv.ArgumentList.Arguments.Count != 1)
            return false;

        if (inv.Expression is not MemberAccessExpressionSyntax
            {
                Name: IdentifierNameSyntax { Identifier.Text: "Add" }, Expression: ExpressionSyntax recvExpr
            })
        {
            return false;
        }

        receiver = recvExpr;

        return true;
    }

    /// <summary>Returns true when the receiver type is or derives from <c>List&lt;T&gt;</c> and the invocation is an instance <c>Add</c> with one parameter.</summary>
    private static bool IsBuiltInListReceiverAndAddInvocation(
        InvocationExpressionSyntax addInvocation,
        ExpressionSyntax listReceiverExpression,
        SemanticModel semanticModel,
        CancellationToken cancellationToken,
        out INamedTypeSymbol? listReceiverType)
    {
        listReceiverType = null;

        if (semanticModel.GetSymbolInfo(addInvocation, cancellationToken).Symbol is not IMethodSymbol addMethod)
            return false;

        if (addMethod.IsStatic || addMethod.Name != "Add" || addMethod.Parameters.Length != 1)
            return false;

        if (addMethod.MethodKind == MethodKind.ReducedExtension)
            return false;

        ITypeSymbol? receiverType = semanticModel.GetTypeInfo(listReceiverExpression, cancellationToken).Type;

        if (receiverType is not INamedTypeSymbol named)
            return false;

        INamedTypeSymbol? listOriginal = semanticModel.Compilation.GetTypeByMetadataName("System.Collections.Generic.List`1");

        if (listOriginal is null)
            return false;

        for (INamedTypeSymbol? current = named; current is not null; current = current.BaseType)
        {
            if (!SymbolEqualityComparer.Default.Equals(current.OriginalDefinition, listOriginal))
                continue;

            listReceiverType = named;

            return true;
        }

        listReceiverType = null;

        return false;
    }

    private static bool ExpressionSemanticallyTouchesLoop(
        ILocalSymbol loopSymbol,
        SyntaxNode syntax,
        SemanticModel semanticModel,
        CancellationToken cancellationToken)
    {
        foreach (SyntaxNode descendant in syntax.DescendantNodesAndSelf())
        {
            if (descendant is not IdentifierNameSyntax id)
                continue;

            ISymbol? sym = semanticModel.GetSymbolInfo(id, cancellationToken).Symbol;

            if (SymbolEqualityComparer.Default.Equals(sym, loopSymbol))
                return true;
        }

        return false;
    }

    private static bool ExpressionContainsRefOrOutKeywords(ExpressionSyntax expression) =>
        expression.DescendantNodesAndSelf().OfType<ArgumentSyntax>().Any(static a =>
        {
            SyntaxKind k = a.RefKindKeyword.Kind();

            return k is SyntaxKind.RefKeyword or SyntaxKind.OutKeyword;
        });

    private static bool IsOrContainsAssignment(SyntaxNode node) =>
        node.DescendantNodesAndSelf().Any(static n => n is AssignmentExpressionSyntax);
}
