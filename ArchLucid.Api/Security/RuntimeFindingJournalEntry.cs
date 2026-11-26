using System.Data;
using System.Security.Cryptography;
using System.Text.Json;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Persistence.Connections;
using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Security;

internal sealed record RuntimeFindingJournalEntry(DateTime RecordedUtc, string PayloadHash,
    RuntimeCatalogAssessment Assessment);
