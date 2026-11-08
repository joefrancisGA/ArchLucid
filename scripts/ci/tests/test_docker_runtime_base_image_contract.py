"""Offline regression contract for the API Docker base and its CI prefetch.

This guards against selecting an unpublished ASP.NET patch/Alpine combination
or prefetching a different runtime from the one Docker actually builds.
"""
from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[3]
DOCKERFILE = ROOT / "ArchLucid.Api" / "Dockerfile"
PREFETCH = ROOT / "scripts" / "ci" / "prefetch-docker-dotnet-base-images.sh"
TRIVYIGNORE = ROOT / "security" / "docker-api-runtime.trivyignore"


def docker_runtime_image() -> str:
    match = re.search(
        r"^ARG DOTNET_ASPNET_IMAGE=(\S+)$",
        DOCKERFILE.read_text(encoding="utf-8"),
        re.MULTILINE,
    )
    if match is None:
        raise AssertionError("Dockerfile must provide an explicit ASP.NET runtime image")
    return match.group(1)


class DockerRuntimeBaseContractTests(unittest.TestCase):
    def test_serviced_aspnet_runtime_uses_published_alpine_band(self):
        image = docker_runtime_image()
        match = re.fullmatch(
            r"mcr\.microsoft\.com/dotnet/aspnet:10\.0\.(\d+)-alpine3\.(\d+)",
            image,
        )
        self.assertIsNotNone(match, f"ASP.NET runtime must pin a patch and Alpine band: {image}")
        self.assertGreaterEqual(int(match.group(1)), 13, "CVE-2026-70188 requires ASP.NET 10.0.13+")
        self.assertGreaterEqual(int(match.group(2)), 24, "10.0.13+ was not published for Alpine 3.23")

    def test_ci_prefetch_and_dockerfile_pin_the_same_runtime(self):
        prefetch = PREFETCH.read_text(encoding="utf-8")
        match = re.search(
            r'^DOTNET_ASPNET_IMAGE="\$\{DOTNET_ASPNET_IMAGE:-(\S+)\}"$',
            prefetch,
            re.MULTILINE,
        )
        self.assertIsNotNone(match, "Prefetch must have an explicit default ASP.NET image")
        self.assertEqual(match.group(1), docker_runtime_image())

    def test_no_obsolete_runtime_cve_suppression(self):
        ignore_lines = TRIVYIGNORE.read_text(encoding="utf-8").splitlines()
        active_cves = [line.strip() for line in ignore_lines if line.strip() and not line.lstrip().startswith("#")]
        self.assertNotIn("CVE-2026-70188", active_cves)


if __name__ == "__main__":
    unittest.main()
