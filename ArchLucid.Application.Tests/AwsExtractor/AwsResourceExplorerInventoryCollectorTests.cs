using Amazon.ResourceExplorer2;
using Amazon.ResourceExplorer2.Model;

using ArchLucid.Integrations.AwsExtractor;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.AwsExtractor;

[Trait("Category", "Unit")]
public sealed class AwsResourceExplorerInventoryCollectorTests
{
    [Fact]
    public async Task SearchResourcesAsync_paginates_until_next_token_exhausted()
    {
        Mock<IAmazonResourceExplorer2> explorerClient = new();

        explorerClient
            .Setup(c => c.SearchAsync(
                It.Is<SearchRequest>(r => r.NextToken == null),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SearchResponse
            {
                Resources = [
                    new Resource { Arn = "arn:aws:ec2:us-east-1:123456789012:vpc/vpc-1", ResourceType = "AWS::EC2::VPC" }
                ],
                NextToken = "page-2"
            });

        explorerClient
            .Setup(c => c.SearchAsync(
                It.Is<SearchRequest>(r => r.NextToken == "page-2"),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SearchResponse
            {
                Resources = [
                    new Resource
                    {
                        Arn = "arn:aws:s3:::bucket-1",
                        ResourceType = "AWS::S3::Bucket"
                    }
                ],
                NextToken = null
            });

        List<AwsInventoryResourceEntry> resources = await AwsResourceExplorerInventoryCollector.CollectAsync(
            explorerClient.Object,
            "us-east-1",
            CancellationToken.None);

        resources.Should().HaveCount(2);
        resources[0].Name.Should().Contain("vpc-1");
        resources[1].Name.Should().Contain("bucket-1");

        explorerClient.Verify(
            c => c.SearchAsync(It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }
}
