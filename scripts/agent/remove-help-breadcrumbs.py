#!/usr/bin/env python3
"""Remove OperatorPageBreadcrumb usage from help topic pages and tests."""

from __future__ import annotations

import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
HELP_DIR = REPO_ROOT / "archlucid-ui" / "src" / "app" / "(operator)" / "help"

BREADCRUMB_PROP_RE = re.compile(
    r"\n\s*breadcrumb=\{\s*<OperatorPageBreadcrumb[\s\S]*?/>\s*\}",
    re.MULTILINE,
)
BREADCRUMB_IMPORT_RE = re.compile(
    r'^import \{ OperatorPageBreadcrumb \} from "@/components/operator/OperatorPageBreadcrumb";\n',
    re.MULTILINE,
)
BREADCRUMB_CONSTANT_IMPORT_RE = re.compile(
    r",?\s*\n\s*DATA_HANDLING_TENANT_ISOLATION_HELP_BREADCRUMB_[A-Z_]+",
)
BREADCRUMB_TEST_BLOCK_RE = re.compile(
    r"\n\s*const breadcrumb = screen\.getByTestId\([^)]+\);[\s\S]*?"
    r"(?=\n\s*(?:const |expect\(screen\.|for \(|it\(|describe\(|}\);|\}\)))",
    re.MULTILINE,
)
BREADCRUMB_TEST_LINE_RE = re.compile(
    r"^\s*expect\(screen\.getByTestId\([^)]*breadcrumb[^)]*\)\)[^\n]*\n",
    re.MULTILINE,
)
BREADCRUMB_LINK_LINE_RE = re.compile(
    r"^\s*expect\(screen\.getByRole\(\"link\", \{ name: \"Help\" \}\)\)\.toHaveAttribute\(\"href\", \"/help\"\);\n",
    re.MULTILINE,
)
COMMENT_BREADCRUMB_RE = re.compile(r"help breadcrumb,?\s*", re.IGNORECASE)
TEST_NAME_BREADCRUMB_RE = re.compile(
    r'(it\("[^"]*), breadcrumb,?([^"]*")',
)


def clean_component_file(path: Path) -> bool:
    original = path.read_text(encoding="utf-8")
    updated = original
    updated = BREADCRUMB_PROP_RE.sub("", updated)
    updated = BREADCRUMB_IMPORT_RE.sub("", updated)
    updated = COMMENT_BREADCRUMB_RE.sub("", updated)

    if "HelpDataHandlingTenantIsolationGuideView" in path.name:
        updated = BREADCRUMB_CONSTANT_IMPORT_RE.sub("", updated)
        updated = re.sub(
            r'^import \{ inAppHelpHref \} from "@/lib/product-documentation-registry";\n',
            "",
            updated,
            flags=re.MULTILINE,
        )

    if updated == original:
        return False

    path.write_text(updated, encoding="utf-8")
    return True


def clean_test_file(path: Path) -> bool:
    original = path.read_text(encoding="utf-8")
    updated = original
    updated = BREADCRUMB_TEST_BLOCK_RE.sub("\n", updated)
    updated = BREADCRUMB_TEST_LINE_RE.sub("", updated)
    updated = BREADCRUMB_LINK_LINE_RE.sub("", updated)
    updated = TEST_NAME_BREADCRUMB_RE.sub(r"\1\2", updated)
    updated = re.sub(
        r", breadcrumb,",
        ",",
        updated,
    )
    updated = re.sub(
        r"breadcrumb, ",
        "",
        updated,
    )
    updated = re.sub(
        r" and breadcrumb",
        "",
        updated,
    )

    if "HelpTopicDataHandlingTenantIsolation.test" in path.name:
        updated = re.sub(
            r",?\s*\n\s*DATA_HANDLING_TENANT_ISOLATION_HELP_BREADCRUMB_[A-Z_]+",
            "",
            updated,
        )

    if updated == original:
        return False

    path.write_text(updated, encoding="utf-8")
    return True


def main() -> None:
    component_changes = 0
    test_changes = 0

    for path in sorted(HELP_DIR.rglob("*.tsx")):
        text = path.read_text(encoding="utf-8")
        if "breadcrumb" not in text.lower() and "OperatorPageBreadcrumb" not in text:
            continue

        if path.name.endswith(".test.tsx") or ".test." in path.name:
            if clean_test_file(path):
                test_changes += 1
                print(f"test: {path.relative_to(REPO_ROOT)}")
        elif "OperatorPageBreadcrumb" in text or "breadcrumb=" in text:
            if clean_component_file(path):
                component_changes += 1
                print(f"component: {path.relative_to(REPO_ROOT)}")

    print(f"Updated {component_changes} components and {test_changes} tests.")


if __name__ == "__main__":
    main()
