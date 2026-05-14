using System.Text;
using ArchLucid.Api.Client.Generated;

namespace ArchLucid.Api.Client.Tests;

[Trait("Suite", "Core")]
public sealed class FileParameterTests
{
    [Fact]
    public void Constructor_stream_only_sets_defaults_for_name_and_content_type()
    {
        using MemoryStream data = new MemoryStream(Encoding.UTF8.GetBytes("x"));

        FileParameter fp = new FileParameter(data);

        Assert.Same(data, fp.Data);
        Assert.Null(fp.FileName);
        Assert.Null(fp.ContentType);
    }

    [Fact]
    public void Constructor_with_fileName_passes_through()
    {
        using MemoryStream data = new MemoryStream();

        FileParameter fp = new FileParameter(data, "a.json");

        Assert.Equal("a.json", fp.FileName);
        Assert.Null(fp.ContentType);
    }

    [Fact]
    public void Constructor_with_fileName_and_contentType_sets_all_properties()
    {
        using MemoryStream data = new MemoryStream();

        FileParameter fp = new FileParameter(data, "b.bin", "application/octet-stream");

        Assert.Equal("b.bin", fp.FileName);
        Assert.Equal("application/octet-stream", fp.ContentType);
    }

    [Fact]
    public void Constructor_null_stream_throws()
    {
        Assert.Throws<ArgumentNullException>(() => new FileParameter(null!));
    }
}
