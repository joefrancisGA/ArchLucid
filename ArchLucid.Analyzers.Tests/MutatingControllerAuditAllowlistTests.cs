using System.Collections.Immutable;

using ArchLucid.Analyzers;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Diagnostics;
using Microsoft.CodeAnalysis.Text;

namespace ArchLucid.Analyzers.Tests;

[Trait("Category", "Unit")]
public sealed class MutatingControllerAuditAllowlistTests
{
    [Fact]
    public void ReadFqAllowlistEntries_parses_comments_and_inline_trimming()
    {
        StringAdditionalText allowlist = new(
            MutatingControllerAuditAllowlist.AllowlistFileName,
            """
            # ignored comment
            ArchLucid.Api.Probe.ListedController.Allowlisted
            ArchLucid.Api.Probe.Second.Action // inline comment
            """);

        AnalyzerOptions options = new(
            ImmutableArray.Create<AdditionalText>(allowlist),
            new EmptyAnalyzerConfigOptionsProvider());

        ImmutableHashSet<string> entries =
            MutatingControllerAuditAllowlist.ReadFqAllowlistEntries(options, CancellationToken.None);

        Assert.Equal(2, entries.Count);
        Assert.Contains("ArchLucid.Api.Probe.ListedController.Allowlisted", entries);
        Assert.Contains("ArchLucid.Api.Probe.Second.Action", entries);
    }

    private sealed class StringAdditionalText(string path, string content) : AdditionalText
    {
        public override string Path => path;

        public override SourceText GetText(CancellationToken cancellationToken = default) =>
            SourceText.From(content);
    }

    private sealed class EmptyAnalyzerConfigOptionsProvider : AnalyzerConfigOptionsProvider
    {
        private static readonly EmptyAnalyzerConfigOptions Options = new();

        public override AnalyzerConfigOptions GlobalOptions => Options;

        public override AnalyzerConfigOptions GetOptions(SyntaxTree tree) => Options;

        public override AnalyzerConfigOptions GetOptions(AdditionalText textFile) => Options;
    }

    private sealed class EmptyAnalyzerConfigOptions : AnalyzerConfigOptions
    {
        public override bool TryGetValue(string key, out string value)
        {
            value = string.Empty;

            return false;
        }
    }
}
