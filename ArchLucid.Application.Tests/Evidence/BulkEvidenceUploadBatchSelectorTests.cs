using ArchLucid.Application.Evidence;

using FluentAssertions;

using Microsoft.AspNetCore.Http;

using Moq;

namespace ArchLucid.Application.Tests.Evidence;

[Trait("Category", "Unit")]
public sealed class BulkEvidenceUploadBatchSelectorTests
{
    [Fact]
    public void SelectBatch_without_token_returns_all_files()
    {
        IFormFileCollection files = BuildFiles(3);

        IReadOnlyList<IFormFile> batch = BulkEvidenceUploadBatchSelector.SelectBatch(files, null, 10);

        batch.Should().HaveCount(3);
    }

    [Fact]
    public void SelectBatch_with_token_returns_slice()
    {
        IFormFileCollection files = BuildFiles(25);

        IReadOnlyList<IFormFile> batch = BulkEvidenceUploadBatchSelector.SelectBatch(files, "1", 10);

        batch.Should().HaveCount(10);
        batch[0].FileName.Should().Be("file-10.txt");
    }

    [Fact]
    public void SelectBatch_extreme_token_returns_empty_instead_of_first_files()
    {
        IFormFileCollection files = BuildFiles(3);

        BulkEvidenceUploadBatchSelector.SelectBatch(files, int.MaxValue.ToString(), 200)
            .Should().BeEmpty();
    }

    [Fact]
    public void SumDeclaredBytes_sums_non_empty_lengths()
    {
        List<Mock<IFormFile>> mocks =
        [
            CreateFileMock(100),
            CreateFileMock(0),
            CreateFileMock(50),
        ];

        long total = BulkEvidenceUploadBatchSelector.SumDeclaredBytes(mocks.Select(static mock => mock.Object));

        total.Should().Be(150);
    }

    [Fact]
    public void SumDeclaredBytes_saturates_instead_of_wrapping_negative()
    {
        List<Mock<IFormFile>> mocks = [CreateFileMock(long.MaxValue), CreateFileMock(1)];

        BulkEvidenceUploadBatchSelector.SumDeclaredBytes(mocks.Select(static mock => mock.Object))
            .Should().Be(long.MaxValue);
    }

    private static IFormFileCollection BuildFiles(int count)
    {
        List<IFormFile> files = [];

        for (int index = 0; index < count; index++)
        {
            files.Add(CreateFileMock(10, $"file-{index}.txt").Object);
        }

        FormFileCollection collection = new();
        foreach (IFormFile file in files)
        {
            collection.Add(file);
        }
        return collection;
    }

    private static Mock<IFormFile> CreateFileMock(long length, string fileName = "file.txt")
    {
        Mock<IFormFile> mock = new();
        mock.Setup(static file => file.Length).Returns(length);
        mock.Setup(static file => file.FileName).Returns(fileName);
        mock.Setup(static file => file.Name).Returns(fileName);

        return mock;
    }
}
