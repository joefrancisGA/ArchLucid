using System.Collections.Immutable;
using System.Composition;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CodeActions;
using Microsoft.CodeAnalysis.CodeFixes;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Formatting;

namespace ArchLucid.Analyzers;

[ExportCodeFixProvider(LanguageNames.CSharp, Name = nameof(ForeachToLinqCodeFixProvider))]
[Shared]
public sealed class ForeachToLinqCodeFixProvider : CodeFixProvider
{
    public override ImmutableArray<string> FixableDiagnosticIds =>
        ImmutableArray.Create(Al0002ForeachToLinqDescriptor.Rule.Id);

    public override FixAllProvider? GetFixAllProvider() =>
        WellKnownFixAllProviders.BatchFixer;

    public override async Task RegisterCodeFixesAsync(CodeFixContext context)
    {
        Document document = context.Document;
        CancellationToken cancellationToken = context.CancellationToken;
        SyntaxNode? root = await document.GetSyntaxRootAsync(cancellationToken).ConfigureAwait(false);

        if (root is null)
            return;

        foreach (Diagnostic diagnostic in context.Diagnostics)
        {
            SyntaxToken tokenAt = root.FindToken(diagnostic.Location.SourceSpan.Start);

            ForEachStatementSyntax? foreachSyntax =
                tokenAt.Parent?.AncestorsAndSelf().OfType<ForEachStatementSyntax>().FirstOrDefault();

            if (foreachSyntax is null)
                continue;

            SemanticModel? semanticModel = await document.GetSemanticModelAsync(cancellationToken).ConfigureAwait(false);

            if (semanticModel is null)
                continue;

            ForeachToLinqMatch? matchOrNull =
                ForeachToLinqAnalyzer.TryAnalyzeForeach(foreachSyntax, semanticModel, cancellationToken);

            if (matchOrNull is not { } match)
                continue;

            string title = match.Kind == ForeachToLinqKind.SelectAddRange
                ? "Use LINQ Select + AddRange"
                : "Use LINQ Where + AddRange";

            context.RegisterCodeFix(
                CodeAction.Create(
                    title,
                    ct => ReplaceWithLinqBulkAddAsync(document, root, foreachSyntax, match, ct),
                    equivalenceKey: nameof(ForeachToLinqCodeFixProvider) + ":" + match.Kind),
                diagnostic);
        }
    }

    private static async Task<Document> ReplaceWithLinqBulkAddAsync(
        Document document,
        SyntaxNode rootSnapshot,
        ForEachStatementSyntax foreachSyntax,
        ForeachToLinqMatch match,
        CancellationToken cancellationToken)
    {
        SyntaxToken trimmedIteratorIdentifier = foreachSyntax.Identifier.WithoutTrivia();

        ExpressionSyntax enumerated = FluentReceiverForExtensionChain(foreachSyntax.Expression);
        ParameterSyntax lambdaParameter = SyntaxFactory.Parameter(trimmedIteratorIdentifier);

        ExpressionSyntax linqIntermediate = match.Kind == ForeachToLinqKind.SelectAddRange
            ? BuildInvocation(
                enumerated,
                "Select",
                SyntaxFactory.SimpleLambdaExpression(lambdaParameter, match.AddArgumentExpression))
            : BuildInvocation(
                enumerated,
                "Where",
                SyntaxFactory.SimpleLambdaExpression(lambdaParameter, match.WhereCondition!));

        InvocationExpressionSyntax addRangeInvocation = BuildInvocation(match.ListReceiver, "AddRange", linqIntermediate);

        ExpressionStatementSyntax newStatement =
            SyntaxFactory.ExpressionStatement(addRangeInvocation)
                .WithLeadingTrivia(foreachSyntax.GetLeadingTrivia())
                .WithTrailingTrivia(foreachSyntax.GetTrailingTrivia());

        SyntaxNode updatedRoot = rootSnapshot.ReplaceNode(foreachSyntax, newStatement);

        if (updatedRoot is CompilationUnitSyntax compilationUnitSyntax && CompilationUnitUsesSystemLinq(compilationUnitSyntax) is false)
        {
            UsingDirectiveSyntax usingDirective =
                SyntaxFactory.UsingDirective(SyntaxFactory.ParseName("System.Linq"))
                    .WithTrailingTrivia(SyntaxFactory.ElasticMarker);

            updatedRoot =
                compilationUnitSyntax.AddUsings(usingDirective.WithAdditionalAnnotations(Formatter.Annotation));
        }

        Document unformatted = document.WithSyntaxRoot(updatedRoot);

        return await Formatter.FormatAsync(unformatted, cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    private static bool CompilationUnitUsesSystemLinq(CompilationUnitSyntax compilationUnitSyntax)
    {
        foreach (UsingDirectiveSyntax u in compilationUnitSyntax.Usings)
        {
            if (IsSystemLinqUsing(u))
                return true;
        }

        return false;
    }

    private static bool IsSystemLinqUsing(UsingDirectiveSyntax u)
    {
        if (!u.StaticKeyword.IsKind(SyntaxKind.None) ||
            u.Alias is not null ||
            !u.GlobalKeyword.IsKind(SyntaxKind.None))
        {
            return false;
        }

        if (u.Name is null)
            return false;

        return NamesEqual(u.Name.ToString(), "System.Linq");

        static bool NamesEqual(string leftName, string rightName) =>
            string.Equals(leftName, rightName, StringComparison.Ordinal);
    }

    private static InvocationExpressionSyntax BuildInvocation(
        ExpressionSyntax receiver,
        string methodName,
        ExpressionSyntax argumentExpression) =>
        SyntaxFactory.InvocationExpression(
                SyntaxFactory.MemberAccessExpression(
                    SyntaxKind.SimpleMemberAccessExpression,
                    receiver,
                    SyntaxFactory.IdentifierName(methodName)),
                SyntaxFactory.ArgumentList(
                    SyntaxFactory.SingletonSeparatedList(SyntaxFactory.Argument(argumentExpression))))

        ;

    private static InvocationExpressionSyntax BuildInvocation(
        ExpressionSyntax receiver,
        string methodName,
        LambdaExpressionSyntax lambdaExpression) =>
        BuildInvocation(receiver, methodName, (ExpressionSyntax)lambdaExpression);

    private static ExpressionSyntax FluentReceiverForExtensionChain(ExpressionSyntax expression)
    {
        if (expression is IdentifierNameSyntax or MemberAccessExpressionSyntax or InvocationExpressionSyntax or LiteralExpressionSyntax
            or ThisExpressionSyntax or BaseExpressionSyntax or ObjectCreationExpressionSyntax or CastExpressionSyntax
            or ImplicitObjectCreationExpressionSyntax or ParenthesizedExpressionSyntax or ElementAccessExpressionSyntax)
        {
            return expression;
        }

        ParenthesizedExpressionSyntax parens =
            SyntaxFactory.ParenthesizedExpression(expression.WithoutTrivia());

        return parens.WithLeadingTrivia(expression.GetLeadingTrivia()).WithTrailingTrivia(expression.GetTrailingTrivia());
    }
}
