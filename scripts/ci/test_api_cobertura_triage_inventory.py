"""Unit tests for api_cobertura_triage_inventory."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from api_cobertura_triage_inventory import (
    ClassifiedRow,
    GapClassRow,
    TestFileIndexEntry,
    build_api_test_index,
    classify_gap_row,
    parse_api_gap_section,
    render_inventory_markdown,
    upsert_inventory_section,
)
from datetime import date


class ApiCoberturaTriageInventoryTests(unittest.TestCase):
    def test_parse_api_gap_section_ignores_top_three_preview_table(self) -> None:
        markdown = """
### ArchLucid.Api (57.46% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Api.PreviewOnly` | `ArchLucid.Api\\PreviewOnly.cs` | 0.00 | 1 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Api.Real.Gap` | `ArchLucid.Api\\Real\\Gap.cs` | 0.00 | 1 | No |

### ArchLucid.Host.Core (71.86% line coverage)
"""
        rows = parse_api_gap_section(markdown)

        self.assertEqual(1, len(rows))
        self.assertEqual("ArchLucid.Api.Real.Gap", rows[0].type_name)

    def test_parse_api_gap_section_extracts_rows(self) -> None:
        markdown = """
#### All classes below 95% line coverage
| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Api.Controllers.Admin.AdminArchiveRunsBatchRequest` | `ArchLucid.Api\\Controllers\\Admin\\AdminArchiveRunsBatchRequest.cs` | 0.00 | 1 | No |
| 2 | `ArchLucid.Api.Controllers.Advisory.ProductLearningController` | `ArchLucid.Api\\Controllers\\Advisory\\ProductLearningController.cs` | 0.00 | 166 | No |

### ArchLucid.Host.Core (71.86% line coverage)
"""
        rows = parse_api_gap_section(markdown)

        self.assertEqual(2, len(rows))
        self.assertEqual("ArchLucid.Api.Controllers.Advisory.ProductLearningController", rows[1].type_name)

    def test_classify_pure_dto_request(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            api_dir = repo / "ArchLucid.Api" / "Controllers" / "Admin"
            api_dir.mkdir(parents=True)
            source = api_dir / "AdminArchiveRunsBatchRequest.cs"
            source.write_text(
                """
namespace ArchLucid.Api.Controllers.Admin;
public sealed class AdminArchiveRunsBatchRequest
{
    public DateTimeOffset CreatedBeforeUtc { get; set; }
}
""".strip(),
                encoding="utf-8",
            )

            row = GapClassRow(1, "ArchLucid.Api.Controllers.Admin.AdminArchiveRunsBatchRequest", str(source), 0.0, 1)
            classified = classify_gap_row(row, repo, [])

            self.assertEqual("pure-DTO", classified.bucket)

    def test_classify_integration_covered_controller(self) -> None:
        row = GapClassRow(
            1,
            "ArchLucid.Api.Controllers.Advisory.ProductLearningController",
            "ArchLucid.Api\\Controllers\\Advisory\\ProductLearningController.cs",
            0.0,
            166,
        )
        index = [
            TestFileIndexEntry(
                relative_path="ProductLearningControllerTests.cs",
                categories=frozenset({"Integration"}),
                content="ProductLearningController route smoke",
            ),
        ]

        classified = classify_gap_row(row, Path("."), index)

        self.assertEqual("integration-covered", classified.bucket)

    def test_upsert_inventory_section_is_idempotent(self) -> None:
        markdown = "### ArchLucid.Api\n\n### ArchLucid.Host.Core \n"
        block = "<!-- TB-635-API-COBERTURA-TRIAGE-START -->\ninventory\n<!-- TB-635-API-COBERTURA-TRIAGE-END -->\n"
        first = upsert_inventory_section(markdown, block)
        second = upsert_inventory_section(first, block.replace("inventory", "inventory-v2"))

        self.assertIn("inventory-v2", second)
        self.assertEqual(1, second.count("TB-635-API-COBERTURA-TRIAGE-START"))

    def test_render_inventory_markdown_includes_bucket_counts(self) -> None:
        classified = [
            ClassifiedRow(
                row=GapClassRow(1, "ArchLucid.Api.Foo", "ArchLucid.Api\\Foo.cs", 0.0, 1),
                bucket="pure-DTO",
                test_refs=(),
            ),
        ]
        rendered = render_inventory_markdown(classified, date(2026, 7, 6))

        self.assertIn("| pure-DTO | 1 |", rendered)
        self.assertIn("ArchLucid.Api.Foo", rendered)


if __name__ == "__main__":
    unittest.main()
