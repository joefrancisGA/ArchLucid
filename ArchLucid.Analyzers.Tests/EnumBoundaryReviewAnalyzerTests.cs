using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Testing;
using Microsoft.CodeAnalysis.Testing;

namespace ArchLucid.Analyzers.Tests;

[Trait("Category", "Unit")]
public sealed class EnumBoundaryReviewAnalyzerTests
{
    [Fact]
    public async Task Reports_raw_BCL_enum_parsing_and_runtime_casts()
    {
        const string code = """
using System;

namespace Demo;

enum Choice { A = 1, B = 2 }

class C
{
    void M(string text, int number)
    {
        var a = {|ENUM002:Enum.Parse<Choice>(text)|};
        var b = {|ENUM001:Enum.TryParse<Choice>(text, out _)|};
        var c = {|ENUM001:(Choice)number|};
        var d = {|ENUM002:Enum.ToObject(typeof(Choice), number)|};
        {|ENUM002:Enum.TryParse<Choice>(text, out _)|};
    }
}
""";
        CSharpAnalyzerTest<EnumBoundaryReviewAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = code,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { ProductAssembly },
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Does_not_flag_named_members_or_declared_constant_casts_or_unrelated_methods()
    {
        const string code = """
namespace Demo;

enum Choice { A = 1, B = 2 }

class Parser
{
    public static Choice Parse(string text) => Choice.A;
}

class C
{
    void M(string text)
    {
        var a = Choice.A;
        var b = (Choice)2;
        var c = Parser.Parse(text);
    }
}
""";
        CSharpAnalyzerTest<EnumBoundaryReviewAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = code,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { ProductAssembly },
        };

        await test.RunAsync();
    }

    private static Solution ProductAssembly(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "ArchLucid.Application");
}
