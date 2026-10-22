using System.Text;

namespace ArchLucid.Core.Tests.Pagination;

/// <summary>
///     Builds a cursor from raw JSON so decode-side guard branches (missing keys, unparseable timestamps,
///     empty identifiers) can be exercised without a matching <c>Encode</c> overload.
/// </summary>
internal static class JsonCursorTestHelper
{
    internal static string EncodeJsonCursor(string json)
    {
        string base64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(json));

        return base64.TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }
}
