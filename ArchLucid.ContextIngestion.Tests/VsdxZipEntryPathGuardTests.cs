using ArchLucid.ContextIngestion.Diagram;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class VsdxZipEntryPathGuardTests
{
    [Theory]
    [InlineData("visio/pages/page1.xml", true)]
    [InlineData("../evil.xml", false)]
    [InlineData("visio/pages/../../evil.xml", false)]
    public void IsSafeEntryPath_RejectsTraversal(string entryPath, bool expected)
    {
        VsdxZipEntryPathGuard.IsSafeEntryPath(entryPath).Should().Be(expected);
    }
}
