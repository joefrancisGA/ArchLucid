#!/usr/bin/env bash
# Installs k6 from dl.k6.io apt repo on Debian/Ubuntu (e.g. GitHub ubuntu-latest).
# GitHub-hosted runners may lack a usable gpg homedir and dirmngr; without them
# `gpg --keyserver ... --recv-keys` fails with "No dirmngr".
set -euo pipefail

sudo apt-get update
sudo apt-get install -y --no-install-recommends ca-certificates curl gnupg

# APT needs an exported OpenPGP keyring, not the GnuPG keybox created by
# "gpg --recv-keys". Use Grafana k6's HTTPS-published key; apt still verifies
# the repository InRelease signature against this scoped signed-by keyring.
curl -fsSL https://dl.k6.io/key.gpg | sudo gpg --batch --yes --dearmor \
  -o /usr/share/keyrings/k6-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list

sudo apt-get update
sudo apt-get install -y k6

k6 version
