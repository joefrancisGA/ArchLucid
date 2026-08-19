using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tests.Drafts;

internal sealed class FixedDraftIntakeBranchOptionsMonitor(DraftIntakeBranchOptions value) : IOptionsMonitor<DraftIntakeBranchOptions>
{
    public DraftIntakeBranchOptions CurrentValue => value;

    public DraftIntakeBranchOptions Get(string? name) => value;

    public IDisposable OnChange(Action<DraftIntakeBranchOptions, string?> listener) => NullDisposable.Instance;

    private sealed class NullDisposable : IDisposable
    {
        internal static readonly NullDisposable Instance = new();

        public void Dispose()
        {
        }
    }
}
