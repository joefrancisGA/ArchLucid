"""Regroup flat `archlucid-ui/src/lib` modules into domain folders.

`src/lib` accumulated ~2.5k files in a single directory, so relatedness is encoded
in filename prefixes instead of folders. This codemod moves a prefix cluster into a
folder and rewrites every reference to it, one wave at a time.

Reference forms handled:

* alias imports        `@/lib/<stem>`            -> `@/lib/<folder>/<stem>`
* filesystem paths     `src/lib/<stem>.ts`       -> `src/lib/<folder>/<stem>.ts`
* relative specifiers  normalized to alias form first, so the two rules above cover them

Usage (dry run first):

    python scripts/agent/regroup_ui_lib_domains.py --group findings=finding,findings --dry-run
    python scripts/agent/regroup_ui_lib_domains.py --group findings=finding,findings
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
UI_SOURCE_DIR = REPO_ROOT / "archlucid-ui" / "src"

MODULE_EXTENSIONS = (".ts", ".tsx")


@dataclass(frozen=True)
class RegroupTarget:
    """The flat directory being regrouped, and how references to it are written.

    `src/lib` and `src/components` have the same problem and the same reference forms, so the
    codemod is parameterized on the directory rather than duplicated per directory.
    """

    name: str

    @property
    def directory(self) -> Path:
        return UI_SOURCE_DIR / self.name

    @property
    def alias_prefix(self) -> str:
        """Reference form used by ~94% of importers, e.g. `@/lib/`."""
        return f"@/{self.name}/"

    @property
    def repository_prefix(self) -> str:
        """Filesystem form cited by docs and scripts, e.g. `src/lib/`."""
        return f"src/{self.name}/"


# Set once by main() so the helpers below do not each need it threaded through.
TARGET = RegroupTarget("lib")

# Roots scanned for references. Docs are included because they cite filesystem paths.
SEARCH_ROOTS = (
    "archlucid-ui/src",
    "archlucid-ui/e2e",
    "archlucid-ui/scripts",
    "archlucid-ui/packages",
    "scripts",
    "docs",
    ".github/workflows",
)

SEARCH_EXTENSIONS = frozenset(
    {".ts", ".tsx", ".mjs", ".cjs", ".js", ".jsx", ".json", ".py", ".ps1", ".yml", ".yaml", ".md"}
)

EXCLUDED_DIRECTORY_NAMES = frozenset(
    {"node_modules", ".next", ".git", "bin", "obj", "dist", "coverage", "archive", "__pycache__"}
)

# Quoted module specifier in TS/JS: import ... from "x", vi.mock("x"), await import("x").
QUOTED_SPECIFIER_PATTERN = re.compile(r"""(?P<quote>['"])(?P<spec>\.{1,2}/[^'"]+)(?P=quote)""")


@dataclass
class PlannedMove:
    """A single top-level lib file and the domain folder it is being moved into."""

    source: Path
    folder: str

    @property
    def stem(self) -> str:
        """Module stem as referenced by importers, e.g. `finding-copy` or `finding-copy.test`."""
        return self.source.name[: -len(self.source.suffix)]

    @property
    def destination(self) -> Path:
        return self.source.parent / self.folder / self.source.name


@dataclass
class RewriteSummary:
    """Counts collected while rewriting, reported back to the operator."""

    files_changed: int = 0
    references_rewritten: int = 0
    changed_paths: list[str] = field(default_factory=list)


GIT_LOCK_RETRY_ATTEMPTS = 10
GIT_LOCK_RETRY_DELAY_SECONDS = 1.5


def run_git(arguments: list[str]) -> subprocess.CompletedProcess[str]:
    """Run a git command, retrying while another process holds `index.lock`.

    Editors and file watchers take the index lock for short bursts. A move wave issues
    hundreds of `git mv` calls, so a transient lock would otherwise abort it midway and
    leave the tree half-renamed.
    """

    last_error = ""

    for attempt in range(GIT_LOCK_RETRY_ATTEMPTS):
        # Diffs carry non-ASCII copy, so decode as UTF-8 rather than the console codepage.
        completed = subprocess.run(
            ["git", *arguments],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )

        if completed.returncode == 0:
            return completed

        last_error = (completed.stderr or "") + (completed.stdout or "")

        if "index.lock" not in last_error:
            break

        time.sleep(GIT_LOCK_RETRY_DELAY_SECONDS * (attempt + 1))

    raise SystemExit(f"git {' '.join(arguments)} failed:\n{last_error.strip()}")


def parse_group_argument(raw: str) -> tuple[str, tuple[str, ...]]:
    """Parse `folder=prefix1,prefix2` into its folder name and prefix tuple."""

    if "=" not in raw:
        raise argparse.ArgumentTypeError(f"expected folder=prefix[,prefix], got {raw!r}")

    folder, _, prefix_list = raw.partition("=")
    prefixes = tuple(part.strip() for part in prefix_list.split(",") if part.strip())

    if not folder.strip() or not prefixes:
        raise argparse.ArgumentTypeError(f"expected folder=prefix[,prefix], got {raw!r}")

    return folder.strip(), prefixes


def stem_matches_prefix(stem: str, prefix: str) -> bool:
    """True when `stem` belongs to the `prefix` cluster.

    Two naming conventions coexist: `src/lib` uses kebab-case (`finding-copy`) while
    `src/components` uses PascalCase (`FindingCopy`). Requiring a separator — a hyphen or the
    next word's capital — stops `run` from claiming `runs-page` or `RunsPage`.
    """

    if stem == prefix:
        return True

    if stem.startswith(f"{prefix}-"):
        return True

    return stem.startswith(prefix) and len(stem) > len(prefix) and stem[len(prefix)].isupper()


def dirty_repository_paths() -> frozenset[str]:
    """Forward-slash repo-relative paths with uncommitted changes (working-tree safety)."""

    completed = run_git(
        ["status", "--porcelain", "--", TARGET.directory.relative_to(REPO_ROOT).as_posix()]
    )
    paths: set[str] = set()

    for line in completed.stdout.splitlines():
        # Porcelain format is a two-character status, a space, then the path.
        candidate = line[3:].strip().strip('"')

        if candidate:
            paths.add(candidate)

    return frozenset(paths)


def folder_for_stem(stem: str, prefix_to_folder: dict[str, str]) -> str | None:
    """Destination folder for a module stem, longest matching prefix winning.

    Longest-first so a `Runs` cluster is not swallowed by a `Run` cluster.
    """

    for prefix in sorted(prefix_to_folder, key=len, reverse=True):

        if stem_matches_prefix(stem, prefix):
            return prefix_to_folder[prefix]

    return None


def plan_moves(
    groups: dict[str, tuple[str, ...]], excluded_stems: frozenset[str] = frozenset()
) -> list[PlannedMove]:
    """Match top-level lib modules against the requested prefixes.

    `excluded_stems` holds them back — used to leave a module and its test behind when they
    carry uncommitted work that should not ride along with a move wave.
    """

    prefix_to_folder: dict[str, str] = {}

    for folder, prefixes in groups.items():

        for prefix in prefixes:
            if prefix in prefix_to_folder:
                raise SystemExit(f"prefix {prefix!r} claimed by two folders")

            prefix_to_folder[prefix] = folder

    planned: list[PlannedMove] = []

    for candidate in sorted(TARGET.directory.iterdir()):

        if not candidate.is_file() or candidate.suffix not in MODULE_EXTENSIONS:
            continue

        stem = candidate.name[: -len(candidate.suffix)]

        # A test file is excluded alongside the module it covers.
        if stem in excluded_stems or stem.removesuffix(".test") in excluded_stems:
            continue

        folder = folder_for_stem(stem, prefix_to_folder)

        if folder is not None:
            planned.append(PlannedMove(source=candidate, folder=folder))

    return planned


QUOTED_STRING_PATTERN = re.compile(r"""(['"])[^'"]*\1""")


def unstaged_diff_only_changes_module_specifiers(relative_path: str) -> bool:
    """True when a file's uncommitted diff changes nothing but quoted module specifiers.

    A resumed wave re-encounters files this codemod already normalized. Those are safe to
    move, whereas a file carrying real user edits is not — so compare the changed lines
    with every quoted string blanked out and require them to be otherwise identical.
    """

    completed = run_git(["diff", "--unified=0", "--", relative_path])
    removed: list[str] = []
    added: list[str] = []

    for line in completed.stdout.splitlines():

        if line.startswith(("---", "+++", "@@", "diff ", "index ")):
            continue

        if line.startswith("-"):
            removed.append(QUOTED_STRING_PATTERN.sub('"~"', line[1:]))
        elif line.startswith("+"):
            added.append(QUOTED_STRING_PATTERN.sub('"~"', line[1:]))

    return len(removed) > 0 and sorted(removed) == sorted(added)


def assert_moves_are_safe(planned: list[PlannedMove], allow_codemod_dirty: bool) -> None:
    """Refuse to move dirty files or to clobber an existing destination."""

    dirty = dirty_repository_paths()
    blocked: list[str] = []
    clobbered: list[str] = []

    for move in planned:
        relative = move.source.relative_to(REPO_ROOT).as_posix()

        if relative in dirty:

            if not (allow_codemod_dirty and unstaged_diff_only_changes_module_specifiers(relative)):
                blocked.append(relative)

        if move.destination.exists():
            clobbered.append(move.destination.relative_to(REPO_ROOT).as_posix())

    if blocked:
        raise SystemExit(
            "refusing to move files with uncommitted changes:\n  " + "\n  ".join(sorted(blocked))
        )

    if clobbered:
        raise SystemExit("destination already exists:\n  " + "\n  ".join(sorted(clobbered)))


def iter_search_files() -> list[Path]:
    """All files that could reference a lib module."""

    found: list[Path] = []

    for root_name in SEARCH_ROOTS:
        root = REPO_ROOT / root_name

        if not root.exists():
            continue

        for candidate in root.rglob("*"):

            if candidate.suffix not in SEARCH_EXTENSIONS or not candidate.is_file():
                continue

            if EXCLUDED_DIRECTORY_NAMES.intersection(candidate.parts):
                continue

            found.append(candidate)

    return found


# Encoding each scanned file decoded as, so a rewrite can be written back unchanged.
# Some editors save TS/TSX as cp1252 when copy contains an em dash or ellipsis; decoding
# those as UTF-8 fails, and silently skipping them leaves dangling imports behind.
FALLBACK_READ_ENCODING = "cp1252"

_decoded_encodings: dict[Path, str] = {}


def try_read_text(path: Path) -> str | None:
    """Read a file, remembering its encoding, or None when it cannot be decoded at all.

    The scan covers docs and scripts as well as source, so a stray undecodable file must not
    abort a wave partway through — but a file that merely uses a legacy single-byte encoding
    must still be rewritten, otherwise its imports are left pointing at moved modules.
    """

    for encoding in ("utf-8", FALLBACK_READ_ENCODING):

        try:
            text = path.read_text(encoding=encoding)
        except UnicodeDecodeError:
            continue
        except OSError:
            return None

        _decoded_encodings[path] = encoding

        return text

    return None


def write_text_preserving_encoding(path: Path, text: str) -> None:
    """Write text back using the encoding the file was decoded with.

    Rewriting a cp1252 file as UTF-8 would reflow every non-ASCII character in the diff,
    turning a one-line import change into a whole-file change.
    """

    path.write_text(text, encoding=_decoded_encodings.get(path, "utf-8"))


def resolve_relative_specifier(containing_file: Path, specifier: str) -> Path | None:
    """Resolve a relative module specifier to an absolute path, or None if it escapes the repo."""

    resolved = (containing_file.parent / specifier).resolve()

    try:
        resolved.relative_to(REPO_ROOT)
    except ValueError:
        return None

    return resolved


def alias_for_resolved_path(resolved: Path) -> str | None:
    """Map an absolute path under `archlucid-ui/src` onto its `@/…` alias form."""

    source_root = REPO_ROOT / "archlucid-ui" / "src"

    try:
        relative = resolved.relative_to(source_root)
    except ValueError:
        return None

    return "@/" + relative.as_posix()


def normalize_relative_specifiers(
    files: list[Path], moved_absolute_paths: frozenset[Path], apply_changes: bool
) -> RewriteSummary:
    """Convert relative specifiers that touch the moved set into `@/…` alias form.

    Relative paths are the only references whose correct text depends on where the
    *importer* lives, so normalizing them to the alias convention (already used by
    ~94% of intra-lib imports) means the later rewrite is a pure string substitution.
    """

    summary = RewriteSummary()

    for candidate in files:

        if candidate.suffix not in MODULE_EXTENSIONS:
            continue

        original = try_read_text(candidate)

        if original is None:
            continue

        is_moving = candidate.resolve() in moved_absolute_paths
        replacements = 0

        def replace(match: re.Match[str]) -> str:
            nonlocal replacements
            specifier = match.group("spec")
            resolved = resolve_relative_specifier(candidate, specifier)

            if resolved is None:
                return match.group(0)

            # A file that is itself moving must lose every relative specifier; a file that
            # stays only needs rewriting when it points at something that is moving.
            targets_moved_module = any(
                resolved.with_suffix(extension) in moved_absolute_paths
                for extension in MODULE_EXTENSIONS
            )

            if not is_moving and not targets_moved_module:
                return match.group(0)

            for extension in MODULE_EXTENSIONS:

                if resolved.with_suffix(extension).exists():
                    alias = alias_for_resolved_path(resolved)

                    if alias is None:
                        return match.group(0)

                    replacements += 1
                    return f"{match.group('quote')}{alias}{match.group('quote')}"

            return match.group(0)

        updated = QUOTED_SPECIFIER_PATTERN.sub(replace, original)

        if replacements == 0 or updated == original:
            continue

        summary.files_changed += 1
        summary.references_rewritten += replacements
        summary.changed_paths.append(candidate.relative_to(REPO_ROOT).as_posix())

        if apply_changes:
            write_text_preserving_encoding(candidate, updated)

    return summary


def repair_relative_specifiers_in_moved_folders(
    groups: dict[str, tuple[str, ...]], apply_changes: bool
) -> RewriteSummary:
    """Add a `../` level to relative specifiers that broke by moving one directory deeper.

    Most relative imports are normalized to the `@/` alias, but a specifier pointing outside
    `archlucid-ui/src` (for example a JSON contract under `docs/`) has no alias form, so its
    depth has to be corrected instead.
    """

    summary = RewriteSummary()

    for folder in groups:
        folder_path = TARGET.directory / folder

        if not folder_path.is_dir():
            continue

        for candidate in folder_path.iterdir():

            if not candidate.is_file() or candidate.suffix not in MODULE_EXTENSIONS:
                continue

            original = try_read_text(candidate)

            if original is None:
                continue

            replacements = 0

            def resolves(specifier: str) -> bool:
                """True when the specifier names a real file, with or without an implied extension."""
                base = candidate.parent / specifier

                return base.exists() or any(
                    base.with_name(base.name + extension).exists()
                    for extension in (*MODULE_EXTENSIONS, ".mjs", ".js", ".json")
                )

            def replace(match: re.Match[str]) -> str:
                nonlocal replacements
                specifier = match.group("spec")

                if resolves(specifier):
                    return match.group(0)

                deeper = f"../{specifier}"

                if not resolves(deeper):
                    return match.group(0)

                replacements += 1
                return f"{match.group('quote')}{deeper}{match.group('quote')}"

            updated = QUOTED_SPECIFIER_PATTERN.sub(replace, original)

            if replacements == 0 or updated == original:
                continue

            summary.files_changed += 1
            summary.references_rewritten += replacements
            summary.changed_paths.append(candidate.relative_to(REPO_ROOT).as_posix())

            if apply_changes:
                write_text_preserving_encoding(candidate, updated)

    return summary


def stem_to_folder_from_destinations(groups: dict[str, tuple[str, ...]]) -> dict[str, str]:
    """Map every module now living in a target folder back to that folder.

    Derived from the destination rather than the move plan so the rewrite is idempotent:
    a resumed or repeated run still rewrites references for files moved earlier.
    """

    mapping: dict[str, str] = {}

    for folder in groups:
        folder_path = TARGET.directory / folder

        if not folder_path.is_dir():
            continue

        for candidate in folder_path.iterdir():

            if candidate.is_file() and candidate.suffix in MODULE_EXTENSIONS:
                mapping[candidate.name[: -len(candidate.suffix)]] = folder

    return mapping


def build_reference_patterns(stems: list[str]) -> tuple[re.Pattern[str], re.Pattern[str]]:
    """Build the alias and filesystem-path rewrite patterns for the moved stems.

    Stems are sorted longest-first so `api-types.generated` wins over `api-types`.
    """

    stems = sorted(stems, key=len, reverse=True)
    alternation = "|".join(re.escape(stem) for stem in stems)

    # Only top-level modules move, so a stem followed by `/` names a sibling *directory*
    # that shares the prefix (`@/lib/operator-static-demo/…` beside `operator-static-demo.ts`).
    # Excluding `/` keeps the rewrite off those untouched paths.
    boundary = r"(?![A-Za-z0-9._/-])"

    alias_pattern = re.compile(
        rf"(?P<prefix>{re.escape(TARGET.alias_prefix)})(?P<stem>{alternation}){boundary}"
    )

    path_pattern = re.compile(
        rf"(?P<prefix>(?<![A-Za-z0-9._-]){re.escape(TARGET.repository_prefix)})(?P<stem>{alternation})"
        rf"(?=\.tsx?(?![A-Za-z0-9])|{boundary})"
    )

    return alias_pattern, path_pattern


def rewrite_references(
    files: list[Path], stem_to_folder: dict[str, str], apply_changes: bool
) -> RewriteSummary:
    """Insert the domain folder into every alias and filesystem reference to a moved stem."""

    alias_pattern, path_pattern = build_reference_patterns(list(stem_to_folder))
    summary = RewriteSummary()

    for candidate in files:
        original = try_read_text(candidate)

        # Cheap pre-filter: skip files that cannot reference the target directory at all.
        if original is None or f"/{TARGET.name}/" not in original:
            continue

        replacements = 0

        def replace(match: re.Match[str]) -> str:
            nonlocal replacements
            stem = match.group("stem")
            replacements += 1
            return f"{match.group('prefix')}{stem_to_folder[stem]}/{stem}"

        updated = path_pattern.sub(replace, alias_pattern.sub(replace, original))

        if replacements == 0 or updated == original:
            continue

        summary.files_changed += 1
        summary.references_rewritten += replacements
        summary.changed_paths.append(candidate.relative_to(REPO_ROOT).as_posix())

        if apply_changes:
            write_text_preserving_encoding(candidate, updated)

    return summary


def move_files(planned: list[PlannedMove]) -> None:
    """Move each planned file with `git mv` so rename history survives."""

    for folder in sorted({move.folder for move in planned}):
        (TARGET.directory / folder).mkdir(exist_ok=True)

    for move in planned:
        run_git(
            [
                "mv",
                move.source.relative_to(REPO_ROOT).as_posix(),
                move.destination.relative_to(REPO_ROOT).as_posix(),
            ]
        )


def report(
    planned: list[PlannedMove],
    stem_to_folder: dict[str, str],
    normalize: RewriteSummary,
    rewrite: RewriteSummary,
) -> None:
    """Print a short operator-facing summary of the wave."""

    print(f"planned moves: {len(planned)}")

    for folder in sorted(set(stem_to_folder.values())):
        moved_now = sum(1 for move in planned if move.folder == folder)
        total = sum(1 for value in stem_to_folder.values() if value == folder)
        print(f"  {TARGET.repository_prefix}{folder}/  <- {moved_now} moved this run, {total} present")

    print(
        f"relative specifiers normalized: {normalize.references_rewritten} "
        f"in {normalize.files_changed} files"
    )

    print(
        f"references rewritten: {rewrite.references_rewritten} in {rewrite.files_changed} files"
    )


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__)

    parser.add_argument(
        "--group",
        action="append",
        required=True,
        type=parse_group_argument,
        metavar="FOLDER=PREFIX[,PREFIX]",
        help="domain folder and the filename prefixes that belong in it",
    )

    parser.add_argument(
        "--target",
        default="lib",
        choices=("lib", "components"),
        help="flat directory under archlucid-ui/src to regroup (default: lib)",
    )

    parser.add_argument("--dry-run", action="store_true", help="report without touching files")

    parser.add_argument(
        "--exclude",
        action="append",
        default=[],
        metavar="STEM",
        help="leave this module (and its .test sibling) at the top level",
    )

    parser.add_argument(
        "--allow-codemod-dirty",
        action="store_true",
        help="permit moving files whose only uncommitted change is a module specifier (resume)",
    )

    arguments = parser.parse_args(argv)

    global TARGET
    TARGET = RegroupTarget(arguments.target)

    groups: dict[str, tuple[str, ...]] = {}

    for folder, prefixes in arguments.group:
        groups.setdefault(folder, ())
        groups[folder] = groups[folder] + prefixes

    planned = plan_moves(groups, frozenset(arguments.exclude))
    assert_moves_are_safe(planned, arguments.allow_codemod_dirty)

    moved_absolute_paths = frozenset(move.source.resolve() for move in planned)
    search_files = iter_search_files()
    apply_changes = not arguments.dry_run

    normalize = normalize_relative_specifiers(search_files, moved_absolute_paths, apply_changes)

    if apply_changes:
        move_files(planned)
        # Re-scan so files that just moved are rewritten at their new paths, not their old ones.
        search_files = iter_search_files()

    # Built after the move so a resumed run also rewrites references for earlier waves.
    stem_to_folder = stem_to_folder_from_destinations(groups)

    if arguments.dry_run:
        stem_to_folder.update({move.stem: move.folder for move in planned})

    if not stem_to_folder:
        raise SystemExit("no top-level lib files matched the requested prefixes")

    repair = repair_relative_specifiers_in_moved_folders(groups, apply_changes)
    normalize.files_changed += repair.files_changed
    normalize.references_rewritten += repair.references_rewritten

    rewrite = rewrite_references(search_files, stem_to_folder, apply_changes)
    report(planned, stem_to_folder, normalize, rewrite)

    if arguments.dry_run:
        print("dry run — nothing written")

    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
