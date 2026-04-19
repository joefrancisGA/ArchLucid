using System.Collections.Immutable;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Formatting;
using Microsoft.CodeAnalysis.Text;

namespace RemoveEmbeddedStatementBraces;

/// <summary>
/// Removes braces around a single embedded statement for if/else/while/for/foreach/lock/using,
/// do/while, and switch sections (IDE0011 with <c>csharp_prefer_braces = false</c>).
/// Optionally collapses single-line <c>if</c> guard clauses (<c>return</c>/<c>throw</c>/<c>continue</c>/<c>break</c>/<c>goto</c>)
/// per <c>CSharp-Terse-01-GuardClausesSameLine</c> when the collapsed line is short enough and has no comments between <c>)</c> and the body.
/// Skips try/catch/finally bodies, local declarations, local functions, and multi-statement blocks.
/// </summary>
internal static class Program
{
    private static int Main(string[] args) => MainAsync(args).GetAwaiter().GetResult();

    private static async Task<int> MainAsync(string[] args)
    {
        string root = args.Length > 0 ? args[0] : FindRepoRoot();

        if (!Directory.Exists(root))
        {
            Console.Error.WriteLine($"Root not found: {root}");
            return 1;
        }

        string[] files = Directory
            .EnumerateFiles(root, "*.cs", SearchOption.AllDirectories)
            .Where(static p => !IsExcludedPath(p))
            .OrderBy(static p => p, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        int changedFiles = 0;
        CSharpParseOptions parseOptions = CSharpParseOptions.Default.WithLanguageVersion(LanguageVersion.Preview);

        foreach (string path in files)
        {
            string original = File.ReadAllText(path, Encoding.UTF8);
            SyntaxTree tree = CSharpSyntaxTree.ParseText(original, parseOptions, path: path, encoding: Encoding.UTF8);
            CompilationUnitSyntax rootNode = tree.GetCompilationUnitRoot();
            CompilationUnitSyntax current = rootNode;

            for (int pass = 0; pass < 32; pass++)
            {
                EmbeddedStatementBraceRewriter rewriter = new();
                CompilationUnitSyntax next = rewriter.Visit(current) as CompilationUnitSyntax ?? current;

                if (next.IsEquivalentTo(current))
                {
                    break;
                }

                current = next;
            }

            if (current.IsEquivalentTo(rootNode))
            {
                continue;
            }

            SyntaxNode formatted = await FormatCompilationUnitAsync(path, original, current).ConfigureAwait(false);

            bool useCrLf = original.Contains("\r\n", StringComparison.Ordinal);
            string text = formatted.ToFullString();
            string normalized = text.Replace("\r\n", "\n").Replace("\r", "\n");
            string originalNorm = original.Replace("\r\n", "\n").Replace("\r", "\n");

            if (string.Equals(normalized, originalNorm, StringComparison.Ordinal))
            {
                continue;
            }

            string outText = useCrLf ? normalized.Replace("\n", "\r\n") : normalized;
            File.WriteAllText(path, outText, Encoding.UTF8);
            changedFiles++;
            Console.WriteLine(path);
        }

        Console.Error.WriteLine($"Updated {changedFiles} file(s).");
        return 0;
    }

    private static async Task<SyntaxNode> FormatCompilationUnitAsync(string path, string original, CompilationUnitSyntax root)
    {
        using AdhocWorkspace workspace = new();
        ProjectId projectId = ProjectId.CreateNewId();
        VersionStamp stamp = VersionStamp.Create();

        ProjectInfo projectInfo = ProjectInfo
            .Create(projectId, stamp, "fmt", "fmt", LanguageNames.CSharp)
            .WithCompilationOptions(new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary))
            .WithMetadataReferences(MinimalMetadataReferences.Value);

        DocumentId documentId = DocumentId.CreateNewId(projectId, debugName: path);
        DocumentInfo documentInfo = DocumentInfo.Create(
            documentId,
            Path.GetFileName(path),
            loader: TextLoader.From(TextAndVersion.Create(SourceText.From(original, Encoding.UTF8), VersionStamp.Default)),
            filePath: path);

        Solution solution = workspace.CurrentSolution.AddProject(projectInfo).AddDocument(documentInfo);
        workspace.TryApplyChanges(solution);

        Document document = workspace.CurrentSolution.GetDocument(documentId)!;
        Document withRoot = document.WithSyntaxRoot(root);
        Document formattedDoc = await Formatter.FormatAsync(withRoot).ConfigureAwait(false);
        SyntaxNode? formatted = await formattedDoc.GetSyntaxRootAsync().ConfigureAwait(false);

        return formatted ?? root;
    }

    private static string FindRepoRoot()
    {
        string? dir = AppContext.BaseDirectory;

        while (dir != null)
        {
            if (File.Exists(Path.Combine(dir, "ArchLucid.sln")))
            {
                return dir;
            }

            dir = Directory.GetParent(dir)?.FullName;
        }

        return Directory.GetCurrentDirectory();
    }

    private static bool IsExcludedPath(string fullPath)
    {
        string n = fullPath.Replace('\\', '/');

        if (n.Contains("/bin/", StringComparison.OrdinalIgnoreCase)
            || n.Contains("/obj/", StringComparison.OrdinalIgnoreCase)
            || n.Contains("/.git/", StringComparison.OrdinalIgnoreCase)
            || n.Contains("/scripts/RemoveEmbeddedStatementBraces/", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (n.EndsWith(".g.cs", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return false;
    }

    /// <summary>Core + common refs so Formatter can resolve symbols well enough for whitespace.</summary>
    private static class MinimalMetadataReferences
    {
        internal static readonly ImmutableArray<MetadataReference> Value = Build();

        private static ImmutableArray<MetadataReference> Build()
        {
            ImmutableArray<MetadataReference>.Builder b = ImmutableArray.CreateBuilder<MetadataReference>();
            AppendAssemblyContaining(typeof(object));
            AppendAssemblyContaining(typeof(Enumerable));
            AppendAssemblyContaining(typeof(ImmutableArray));
            AppendAssemblyContaining(typeof(System.Text.RegularExpressions.Regex));
            AppendAssemblyContaining(typeof(System.Net.Http.HttpClient));

            AppendAssemblyContaining(typeof(Microsoft.Extensions.DependencyInjection.IServiceCollection));

            return b.ToImmutable();

            void AppendAssemblyContaining(Type t)
            {
                string? loc = t.Assembly.Location;

                if (!string.IsNullOrEmpty(loc))
                {
                    b.Add(MetadataReference.CreateFromFile(loc));
                }
            }
        }
    }
}

internal sealed class EmbeddedStatementBraceRewriter : CSharpSyntaxRewriter
{
    public EmbeddedStatementBraceRewriter()
        : base(visitIntoStructuredTrivia: false)
    {
    }

    public override SyntaxNode? VisitIfStatement(IfStatementSyntax node)
    {
        IfStatementSyntax n = (IfStatementSyntax)base.VisitIfStatement(node)!;

        if (n.Statement is BlockSyntax b)
        {
            StatementSyntax? u = TryUnwrapBlock(b);

            if (u != null)
            {
                n = n.WithStatement(u);
            }
        }

        if (n.Else?.Statement is BlockSyntax eb)
        {
            StatementSyntax? u = TryUnwrapBlock(eb);

            if (u != null)
            {
                n = n.WithElse(n.Else!.WithStatement(u));
            }
        }

        return TryCollapseSameLineIfGuard(n);
    }

    public override SyntaxNode? VisitWhileStatement(WhileStatementSyntax node)
    {
        WhileStatementSyntax n = (WhileStatementSyntax)base.VisitWhileStatement(node)!;

        if (n.Statement is BlockSyntax b)
        {
            StatementSyntax? u = TryUnwrapBlock(b);

            if (u != null)
            {
                n = n.WithStatement(u);
            }
        }

        return n;
    }

    public override SyntaxNode? VisitForStatement(ForStatementSyntax node)
    {
        ForStatementSyntax n = (ForStatementSyntax)base.VisitForStatement(node)!;

        if (n.Statement is BlockSyntax b)
        {
            StatementSyntax? u = TryUnwrapBlock(b);

            if (u != null)
            {
                n = n.WithStatement(u);
            }
        }

        return n;
    }

    public override SyntaxNode? VisitForEachStatement(ForEachStatementSyntax node)
    {
        ForEachStatementSyntax n = (ForEachStatementSyntax)base.VisitForEachStatement(node)!;

        if (n.Statement is BlockSyntax b)
        {
            StatementSyntax? u = TryUnwrapBlock(b);

            if (u != null)
            {
                n = n.WithStatement(u);
            }
        }

        return n;
    }

    public override SyntaxNode? VisitForEachVariableStatement(ForEachVariableStatementSyntax node)
    {
        ForEachVariableStatementSyntax n = (ForEachVariableStatementSyntax)base.VisitForEachVariableStatement(node)!;

        if (n.Statement is BlockSyntax b)
        {
            StatementSyntax? u = TryUnwrapBlock(b);

            if (u != null)
            {
                n = n.WithStatement(u);
            }
        }

        return n;
    }

    public override SyntaxNode? VisitLockStatement(LockStatementSyntax node)
    {
        LockStatementSyntax n = (LockStatementSyntax)base.VisitLockStatement(node)!;

        if (n.Statement is BlockSyntax b)
        {
            StatementSyntax? u = TryUnwrapBlock(b);

            if (u != null)
            {
                n = n.WithStatement(u);
            }
        }

        return n;
    }

    public override SyntaxNode? VisitUsingStatement(UsingStatementSyntax node)
    {
        UsingStatementSyntax n = (UsingStatementSyntax)base.VisitUsingStatement(node)!;

        if (n.Statement is BlockSyntax b)
        {
            StatementSyntax? u = TryUnwrapBlock(b);

            if (u != null)
            {
                n = n.WithStatement(u);
            }
        }

        return n;
    }

    public override SyntaxNode? VisitSwitchSection(SwitchSectionSyntax node)
    {
        SwitchSectionSyntax n = (SwitchSectionSyntax)base.VisitSwitchSection(node)!;

        if (n.Statements.Count != 1 || n.Statements[0] is not BlockSyntax b)
        {
            return n;
        }

        StatementSyntax? u = TryUnwrapBlock(b);

        if (u == null)
        {
            return n;
        }

        return n.WithStatements(SyntaxFactory.SingletonList(u));
    }

    public override SyntaxNode? VisitDoStatement(DoStatementSyntax node)
    {
        DoStatementSyntax n = (DoStatementSyntax)base.VisitDoStatement(node)!;

        if (n.Statement is BlockSyntax b)
        {
            StatementSyntax? u = TryUnwrapBlock(b);

            if (u != null)
            {
                n = n.WithStatement(u);
            }
        }

        return n;
    }

    private static StatementSyntax? TryUnwrapBlock(BlockSyntax block)
    {
        if (block.Statements.Count != 1)
        {
            return null;
        }

        StatementSyntax inner = block.Statements[0];

        if (inner is LocalDeclarationStatementSyntax)
        {
            return null;
        }

        if (inner is LocalFunctionStatementSyntax)
        {
            return null;
        }

        if (inner is BlockSyntax)
        {
            return null;
        }

        SyntaxToken open = block.OpenBraceToken;
        SyntaxToken close = block.CloseBraceToken;

        SyntaxTriviaList leading = open
            .LeadingTrivia.AddRange(open.TrailingTrivia)
            .AddRange(inner.GetLeadingTrivia());

        SyntaxTriviaList trailing = inner
            .GetTrailingTrivia()
            .AddRange(close.LeadingTrivia)
            .AddRange(close.TrailingTrivia);

        return inner.WithLeadingTrivia(leading).WithTrailingTrivia(trailing);
    }

    /// <summary>Maximum length of the synthesized <c>if (…) guard;</c> line before skipping collapse.</summary>
    private const int SameLineGuardMaxChars = 160;

    private static IfStatementSyntax TryCollapseSameLineIfGuard(IfStatementSyntax n)
    {
        if (n.Statement is BlockSyntax)
        {
            return n;
        }

        if (!IsSameLineGuardBody(n.Statement))
        {
            return n;
        }

        if (!HasNewLineBetweenCloseParenAndStatement(n))
        {
            return n;
        }

        if (HasCommentBetweenCloseParenAndStatement(n))
        {
            return n;
        }

        SyntaxTree tree = n.SyntaxTree;
        FileLinePositionSpan stmtSpan = tree.GetLineSpan(n.Statement.Span);

        if (stmtSpan.StartLinePosition.Line != stmtSpan.EndLinePosition.Line)
        {
            return n;
        }

        if (EstimateCollapsedIfGuardLineLength(n) > SameLineGuardMaxChars)
        {
            return n;
        }

        SyntaxToken newCloseParen = n.CloseParenToken.WithTrailingTrivia(SyntaxFactory.TriviaList(SyntaxFactory.Whitespace(" ")));
        StatementSyntax newStatement = n.Statement.WithLeadingTrivia(SyntaxTriviaList.Empty);

        return n.WithCloseParenToken(newCloseParen).WithStatement(newStatement);
    }

    private static bool IsSameLineGuardBody(StatementSyntax statement) => statement switch
    {
        ReturnStatementSyntax => true,
        ThrowStatementSyntax => true,
        ContinueStatementSyntax => true,
        BreakStatementSyntax => true,
        GotoStatementSyntax => true,
        _ => false,
    };

    private static bool HasNewLineBetweenCloseParenAndStatement(IfStatementSyntax n)
    {
        foreach (SyntaxTrivia t in n.CloseParenToken.TrailingTrivia)
        {
            if (t.IsKind(SyntaxKind.EndOfLineTrivia))
            {
                return true;
            }
        }

        foreach (SyntaxTrivia t in n.Statement.GetLeadingTrivia())
        {
            if (t.IsKind(SyntaxKind.EndOfLineTrivia))
            {
                return true;
            }
        }

        return false;
    }

    private static bool HasCommentBetweenCloseParenAndStatement(IfStatementSyntax n)
    {
        foreach (SyntaxTrivia t in n.CloseParenToken.TrailingTrivia)
        {
            if (t.IsKind(SyntaxKind.SingleLineCommentTrivia)
                || t.IsKind(SyntaxKind.MultiLineCommentTrivia)
                || t.IsKind(SyntaxKind.DocumentationCommentExteriorTrivia))
            {
                return true;
            }
        }

        foreach (SyntaxTrivia t in n.Statement.GetLeadingTrivia())
        {
            if (t.IsKind(SyntaxKind.SingleLineCommentTrivia)
                || t.IsKind(SyntaxKind.MultiLineCommentTrivia)
                || t.IsKind(SyntaxKind.DocumentationCommentExteriorTrivia))
            {
                return true;
            }
        }

        return false;
    }

    private static int EstimateCollapsedIfGuardLineLength(IfStatementSyntax n)
    {
        StringBuilder sb = new();
        sb.Append("if (");
        sb.Append(n.Condition.ToString());
        sb.Append(") ");
        sb.Append(Regex.Replace(n.Statement.ToString(), @"\s+", " ").Trim());

        return sb.Length;
    }
}
