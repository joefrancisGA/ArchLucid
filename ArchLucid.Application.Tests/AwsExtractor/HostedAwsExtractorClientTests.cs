using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Integrations.AwsExtractor;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.AwsExtractor;

[Trait("Category", "Unit")]
public sealed class HostedAwsExtractorClientTests
{
    [Fact]
    public async Task CollectZipAsync_rejects_role_arn_account_mismatch()
    {
        Mock<IAwsOidcWebIdentityTokenProvider> tokenProvider = new();
        HostedAwsExtractorClient client = new(tokenProvider.Object, NullLogger<HostedAwsExtractorClient>.Instance);

        HostedAwsExtractorCollectionRequest request = new()
        {
            AccountId = "123456789012",
            Region = "us-east-1",
            RoleArn = "arn:aws:iam::999999999999:role/ReadOnly"
        };

        Func<Task> act = () => client.CollectZipAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*does not match IAM role ARN account*");

        tokenProvider.Verify(
            p => p.GetWebIdentityTokenAsync(It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CollectZipAsync_rejects_blank_region_before_token_fetch()
    {
        Mock<IAwsOidcWebIdentityTokenProvider> tokenProvider = new();
        HostedAwsExtractorClient client = new(tokenProvider.Object, NullLogger<HostedAwsExtractorClient>.Instance);

        HostedAwsExtractorCollectionRequest request = new()
        {
            AccountId = "123456789012",
            Region = "   ",
            RoleArn = "arn:aws:iam::123456789012:role/ReadOnly"
        };

        Func<Task> act = () => client.CollectZipAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();

        tokenProvider.Verify(
            p => p.GetWebIdentityTokenAsync(It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CollectZipAsync_rejects_blank_account_id_before_token_fetch()
    {
        Mock<IAwsOidcWebIdentityTokenProvider> tokenProvider = new();
        HostedAwsExtractorClient client = new(tokenProvider.Object, NullLogger<HostedAwsExtractorClient>.Instance);

        HostedAwsExtractorCollectionRequest request = new()
        {
            AccountId = "   ",
            Region = "us-east-1",
            RoleArn = "arn:aws:iam::123456789012:role/ReadOnly"
        };

        Func<Task> act = () => client.CollectZipAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();

        tokenProvider.Verify(
            p => p.GetWebIdentityTokenAsync(It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
