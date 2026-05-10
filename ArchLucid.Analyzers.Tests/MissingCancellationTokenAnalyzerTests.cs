using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Testing;
using Microsoft.CodeAnalysis.Testing;

namespace ArchLucid.Analyzers.Tests;

public sealed class MissingCancellationTokenAnalyzerTests
{
    [Fact]
    public async Task Reports_IFooService_Task_method_without_CancellationToken()
    {
        const string testCode = """
namespace N;

public interface IFooService
{
    System.Threading.Tasks.Task DoWorkAsync();
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<MissingCancellationTokenAnalyzer, DefaultVerifier>.Diagnostic(Arch003Descriptor.Rule)
            .WithSpan(5, 33, 5, 44)
            .WithArguments("N.IFooService.DoWorkAsync()");

        CSharpAnalyzerTest<MissingCancellationTokenAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net80
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Does_not_report_when_CancellationToken_is_present()
    {
        const string testCode = """
namespace N;

public interface IFooService
{
    System.Threading.Tasks.Task DoWorkAsync(System.Threading.CancellationToken cancellationToken);
}
""";

        CSharpAnalyzerTest<MissingCancellationTokenAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net80
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Does_not_report_non_interface_classes()
    {
        const string testCode = """
namespace N;

public sealed class NotAService
{
    public System.Threading.Tasks.Task RunAsync() => System.Threading.Tasks.Task.CompletedTask;
}
""";

        CSharpAnalyzerTest<MissingCancellationTokenAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net80
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Does_not_report_when_suppressed_with_ARCH003()
    {
        const string testCode = """
using System.Diagnostics.CodeAnalysis;

namespace N;

public interface IFooService
{
    [SuppressMessage("ArchLucid.Analyzers", "ARCH003")]
    System.Threading.Tasks.Task DoWorkAsync();
}
""";

        CSharpAnalyzerTest<MissingCancellationTokenAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net80
        };

        await test.RunAsync();
    }
}
