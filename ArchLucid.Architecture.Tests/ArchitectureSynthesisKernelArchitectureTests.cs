using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     EK-10: the synthesis kernel must not start review execute or the authority Seq.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSynthesisKernelArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void ArchitectureSynthesisKernel_source_does_not_reference_review_execute_or_authority_seq()
    {
        string path = Path.Combine(RepoRoot, "ArchLucid.Application", "Architecture", "ArchitectureSynthesisKernel.cs");
        File.Exists(path).Should().BeTrue(path);

        string source = File.ReadAllText(path);

        source.Should().NotContain("IArchitectureRunExecuteOrchestrator");
        source.Should().NotContain("IAuthorityRunOrchestrator");
        source.Should().NotContain("AuthorityPipelineStagesExecutor");
        source.Should().NotContain("EnsureCommitReadyAgentResults");
    }
}
