"""Scoped remediation paging must filter before pagination and preserve full totals."""
from pathlib import Path
import unittest

SOURCE = Path(__file__).resolve().parents[3] / "ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/IRemediationInstanceRepository.cs"

class ScopedRemediationPagingTests(unittest.TestCase):
    def test_scope_filter_precedes_page_and_count_is_full_match_count(self):
        code = SOURCE.read_text()
        method = code.split("ListByCloudResourceIdPagedInScopeAsync(", 1)[1].split("Task<IReadOnlyList<RemediationInstanceRecord>> ListByFindingIdAsync(", 1)[0]
        self.assertNotIn("ListByCloudResourceIdPagedAsync(scope.TenantId", method)
        self.assertIn("ListByScopeAsync(scope, cancellationToken)", method)
        self.assertIn("scope.Matches(row.TenantId, row.WorkspaceId, row.ProjectId)", method)
        self.assertIn("row.CloudResourceId == cloudResourceId", method)
        self.assertLess(method.index(".Where("), method.index(".Skip("))
        self.assertIn("return (items, filtered.Count)", method)

if __name__ == "__main__":
    unittest.main()
