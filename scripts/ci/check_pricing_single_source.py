"""
check_pricing_single_source.py
--------------------------------
Enforces the single-source-of-truth rule for locked ArchLucid list prices.

Locked price strings must appear ONLY in the files listed in ALLOWED_PATHS.
Any match found outside those files fails the build with a non-zero exit code.

Allowed source files (relative to repo root):
  - docs/go-to-market/PRICING_PHILOSOPHY.md   (canonical price source)
  - docs/go-to-market/ORDER_FORM_TEMPLATE.md  (order form; prices referenced by link, totals may appear)
  - docs/go-to-market/ROI_MODEL.md            (ROI model; worked cost totals derived from locked prices)
  - docs/go-to-market/TRIAL_AND_SIGNUP.md     (trial parameters section)
  - docs/CHANGELOG.md                          (historical record of price freeze entry)
  - scripts/ci/check_pricing_single_source.py  (this script — strings appear as literals in PRICE_PATTERNS)

Run: python scripts/ci/check_pricing_single_source.py
Exit 0 = clean. Exit 1 = violation(s) found.
"""

import os
import sys

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

REPO_ROOT = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)

# Files (repo-root-relative, normalised) that are allowed to contain price strings.
ALLOWED_PATHS_REL = {
    os.path.normpath("docs/go-to-market/PRICING_PHILOSOPHY.md"),
    os.path.normpath("docs/go-to-market/ORDER_FORM_TEMPLATE.md"),
    # ROI_MODEL.md computes worked totals from locked prices (same role as ORDER_FORM_TEMPLATE.md).
    os.path.normpath("docs/go-to-market/ROI_MODEL.md"),
    os.path.normpath("docs/go-to-market/TRIAL_AND_SIGNUP.md"),
    os.path.normpath("docs/CHANGELOG.md"),
    # Rename checklist is a historical append-only log (like CHANGELOG) so it may record prices in entries.
    os.path.normpath("docs/ARCHLUCID_RENAME_CHECKLIST.md"),
    os.path.normpath("scripts/ci/check_pricing_single_source.py"),
}

# Exact price strings that must not appear outside ALLOWED_PATHS.
# These match the locked list prices from PRICING_PHILOSOPHY.md §5.2.
PRICE_PATTERNS = [
    "$199",
    "$899",
    "$79",
    "$179",
    "$60,000",
    "$15,000",
]

# Extensions to scan. Skip binary files and generated artefacts.
SCAN_EXTENSIONS = {
    ".md", ".txt", ".yaml", ".yml", ".json", ".cs", ".ts", ".tsx",
    ".js", ".jsx", ".py", ".sh", ".ps1", ".cmd", ".tf", ".toml",
}

# Directories to skip entirely.
SKIP_DIRS = {
    ".git", "node_modules", "artifacts", ".next", "coverage-report-full",
    "nupkg", "_docker_publish_*",
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def should_skip_dir(dirname: str) -> bool:
    """Return True when a directory should be excluded from scanning."""
    for pattern in SKIP_DIRS:
        if dirname == pattern or (pattern.endswith("*") and dirname.startswith(pattern[:-1])):
            return True

    return False


def rel_path(abs_path: str) -> str:
    """Return the repo-root-relative path with forward slashes for display."""
    return os.path.relpath(abs_path, REPO_ROOT).replace("\\", "/")


def is_allowed(abs_path: str) -> bool:
    """Return True when abs_path is in the allowed-sources set."""
    rel = os.path.normpath(os.path.relpath(abs_path, REPO_ROOT))

    return rel in ALLOWED_PATHS_REL


# ---------------------------------------------------------------------------
# Main scan
# ---------------------------------------------------------------------------


def scan() -> list[tuple[str, int, str, str]]:
    """Walk the repo and return a list of (path, lineno, pattern, line) violations."""
    violations: list[tuple[str, int, str, str]] = []

    for dirpath, dirnames, filenames in os.walk(REPO_ROOT):
        # Prune skipped directories in-place so os.walk does not descend into them.
        dirnames[:] = [d for d in dirnames if not should_skip_dir(d)]

        for filename in filenames:
            _, ext = os.path.splitext(filename)

            if ext.lower() not in SCAN_EXTENSIONS:
                continue

            abs_path = os.path.join(dirpath, filename)

            if is_allowed(abs_path):
                continue

            try:
                with open(abs_path, encoding="utf-8", errors="replace") as fh:
                    for lineno, line in enumerate(fh, start=1):
                        for pattern in PRICE_PATTERNS:
                            if pattern in line:
                                violations.append((abs_path, lineno, pattern, line.rstrip()))
            except OSError:
                # Unreadable files are silently skipped (e.g. locked binary files on Windows).
                pass

    return violations


def main() -> int:
    print("check_pricing_single_source: scanning for price strings outside allowed files …")
    violations = scan()

    if not violations:
        print("check_pricing_single_source: OK — no violations found.")
        return 0

    print(
        f"\ncheck_pricing_single_source: FAILED — {len(violations)} violation(s) found.\n"
        "Price strings must appear ONLY in:\n"
        "  docs/go-to-market/PRICING_PHILOSOPHY.md  (canonical source)\n"
        "  docs/go-to-market/ORDER_FORM_TEMPLATE.md\n"
        "  docs/go-to-market/ROI_MODEL.md\n"
        "  docs/go-to-market/TRIAL_AND_SIGNUP.md\n"
        "  docs/CHANGELOG.md\n"
        "  docs/ARCHLUCID_RENAME_CHECKLIST.md\n"
        "  scripts/ci/check_pricing_single_source.py\n"
        "\nViolations:"
    )

    for abs_path, lineno, pattern, line in violations:
        print(f"  {rel_path(abs_path)}:{lineno}: pattern '{pattern}' found in: {line[:120]}")

    print(
        "\nFix: replace the hard-coded price with a link to "
        "docs/go-to-market/PRICING_PHILOSOPHY.md §5."
    )

    return 1


if __name__ == "__main__":
    sys.exit(main())
