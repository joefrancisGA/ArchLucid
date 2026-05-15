using ArchLucid.Decisioning.Compliance.Loaders;
using ArchLucid.Decisioning.Compliance.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Decisioning.Tests.Compliance.Loaders;

[Trait("Category", "Unit")]
public sealed class FileComplianceRulePackProviderTests
{
    [Fact]
    public async Task GetRulePackAsync_delegates_to_loader()
    {
        ComplianceRulePack expected = new() { Rules = [] };
        Mock<IComplianceRulePackLoader> loader = new(MockBehavior.Strict);

        loader
            .Setup(x => x.LoadAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        FileComplianceRulePackProvider sut = new(loader.Object);

        ComplianceRulePack actual = await sut.GetRulePackAsync(CancellationToken.None);

        actual.Should().BeSameAs(expected);
        loader.Verify(x => x.LoadAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
