using System.Collections.Concurrent;

using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Data.Repositories;

using FindingDispositionKind = ArchLucid.Contracts.Findings.FindingDisposition;

namespace ArchLucid.Application.Tests.Governance.FindingDisposition.Support;

/// <summary>Thread-safe in-memory disposition CAS for TB-988 / ADR 0076 tests.</summary>
internal sealed class InMemoryFindingDispositionConcurrencyRepository : IFindingDispositionConcurrencyRepository
{
    private readonly IFindingReviewTrailRepository _trailRepository;

    private readonly ConcurrentDictionary<string, PointerRow> _pointers = new(StringComparer.Ordinal);

    private readonly object _gate = new();

    public InMemoryFindingDispositionConcurrencyRepository(IFindingReviewTrailRepository trailRepository)
    {
        _trailRepository = trailRepository ?? throw new ArgumentNullException(nameof(trailRepository));
    }

    public async Task<FindingDispositionRecordResult> RecordAsync(
        FindingReviewEventRecord reviewEvent,
        byte[]? expectedCurrentRowVersion,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(reviewEvent);

        string key = BuildKey(reviewEvent);

        lock (_gate)
        {
            _pointers.TryGetValue(key, out PointerRow? current);

            if (current is not null)
            {
                if (expectedCurrentRowVersion is null
                    || expectedCurrentRowVersion.Length == 0
                    || !current.RowVersion.AsSpan().SequenceEqual(expectedCurrentRowVersion))
                {
                    return new FindingDispositionRecordResult
                    {
                        Status = FindingDispositionRecordStatus.Conflict,
                        Conflict = BuildConflict(reviewEvent.FindingId, current),
                    };
                }
            }
            else if (expectedCurrentRowVersion is not null && expectedCurrentRowVersion.Length > 0)
            {
                return new FindingDispositionRecordResult
                {
                    Status = FindingDispositionRecordStatus.Conflict,
                    Conflict = new FindingDispositionConflictDetail
                    {
                        FindingId = reviewEvent.FindingId,
                        Disposition = reviewEvent.Disposition ?? FindingDispositionKind.Accepted,
                        ReviewerUserId = string.Empty,
                        OccurredAtUtc = DateTimeOffset.MinValue,
                        CurrentDispositionRowVersionBase64 = string.Empty,
                    },
                };
            }
        }

        await _trailRepository.AppendAsync(reviewEvent, cancellationToken);

        byte[] newRowVersion = Guid.NewGuid().ToByteArray();

        lock (_gate)
        {
            PointerRow pointer = new()
            {
                EventId = reviewEvent.EventId,
                FindingId = reviewEvent.FindingId,
                Disposition = reviewEvent.Disposition ?? FindingDispositionKind.Accepted,
                ReviewerUserId = reviewEvent.ReviewerUserId,
                OccurredAtUtc = reviewEvent.OccurredAtUtc,
                RowVersion = newRowVersion,
            };

            _pointers[key] = pointer;
        }

        return new FindingDispositionRecordResult
        {
            Status = FindingDispositionRecordStatus.Recorded,
            NewCurrentRowVersion = newRowVersion,
        };
    }

    private static string BuildKey(FindingReviewEventRecord reviewEvent)
    {
        return $"{reviewEvent.TenantId:N}:{reviewEvent.WorkspaceId:N}:{reviewEvent.ProjectId:N}:{reviewEvent.FindingId.Trim()}";
    }

    private static FindingDispositionConflictDetail BuildConflict(string findingId, PointerRow current)
    {
        return new FindingDispositionConflictDetail
        {
            EventId = current.EventId,
            FindingId = findingId,
            Disposition = current.Disposition,
            ReviewerUserId = current.ReviewerUserId,
            OccurredAtUtc = current.OccurredAtUtc,
            CurrentDispositionRowVersionBase64 = Convert.ToBase64String(current.RowVersion),
        };
    }

    private sealed class PointerRow
    {
        public Guid EventId
        {
            get;
            init;
        }

        public string FindingId
        {
            get;
            init;
        } = string.Empty;

        public FindingDispositionKind Disposition
        {
            get;
            init;
        }

        public string ReviewerUserId
        {
            get;
            init;
        } = string.Empty;

        public DateTimeOffset OccurredAtUtc
        {
            get;
            init;
        }

        public byte[] RowVersion
        {
            get;
            init;
        } = [];
    }
}
