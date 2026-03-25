namespace ArchiForge.Api.Tests;

public sealed class ExecuteRunResponseDto
{
    public string RunId { get; set; } = string.Empty;
    public List<object> Results { get; set; } = [];
}
