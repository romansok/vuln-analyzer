# Grype JSON schema cheatsheet

Field paths verified against a representative grype scan output (181
matches, vulnerability DB v6.1.4).

## Top level

```
{
  "descriptor": { ... },         # tool + db metadata
  "distro":     { ... },         # detected distro (image scans)
  "matches":    [ ... ],         # ← the array we operate on
  "source":     { ... }          # what was scanned
}
```

## One match — every field we care about

```
matches[i]
├── vulnerability                                  # the finding
│   ├── id                       # "CVE-…"  or  "GHSA-…"
│   ├── dataSource               # canonical URL
│   ├── namespace                # e.g. "github:language:javascript"
│   ├── severity                 # "Critical"|"High"|"Medium"|"Low"|"Negligible"
│   ├── urls[]                   # advisory URLs (advisory, commit, release, NVD, gist…)
│   ├── description              # short text
│   ├── cvss[]                   # ← 0..N entries (Primary / Secondary, NVD / GHSA…)
│   │   ├── source               # "nvd@nist.gov", "security-advisories@github.com", …
│   │   ├── type                 # "Primary" | "Secondary"
│   │   ├── version              # "2.0", "3.0", "3.1", "4.0"
│   │   ├── vector               # CVSS vector string
│   │   └── metrics
│   │       ├── baseScore        # ← the number we sort by
│   │       ├── exploitabilityScore
│   │       └── impactScore
│   ├── epss[]                   # exploit prediction
│   │   ├── cve                  # canonical CVE
│   │   ├── epss                 # 0..1
│   │   ├── percentile           # 0..1
│   │   └── date
│   ├── cwes[]                   # ← weakness taxonomy
│   │   ├── cve
│   │   ├── cwe                  # "CWE-74"
│   │   ├── source
│   │   └── type
│   ├── fix
│   │   ├── versions[]           # ← the bump target(s)
│   │   ├── state                # "fixed" | "not-fixed"
│   │   └── available[]
│   ├── advisories[]
│   └── risk                     # ← grype's unified score (CVSS+EPSS+KEV+fix-availability)
│
├── relatedVulnerabilities[]                       # same shape; e.g., GHSA → CVE
│
├── matchDetails[]
│   ├── type                     # "exact-direct-match", …
│   ├── matcher                  # "javascript-matcher", …
│   ├── searchedBy.package.name  # canonical package name
│   ├── searchedBy.package.version
│   ├── found.vulnerabilityID
│   └── found.versionConstraint  # e.g. "<3.9.18 (semantic)"
│
└── artifact                                        # the affected package
    ├── id
    ├── name                     # "vm2"
    ├── version                  # "3.9.17"
    ├── type                     # "npm", "python", "go-module", "apk", …
    ├── language                 # "javascript", "python", "go", …
    ├── licenses[]
    ├── cpes[]
    ├── purl                     # ← stable cross-ecosystem id, e.g. "pkg:npm/vm2@3.9.17"
    ├── upstreams[]
    └── locations[]              # ← where the package was found
        ├── path                 # "/juice-shop/package-lock.json"
        ├── accessPath
        └── annotations          # {evidence: "primary"}
```

## Picking a CVSS score

A match can have 0, 1, or multiple CVSS entries. The grype `risk` field
already takes care of this — sorting by `.vulnerability.risk` is the
right answer for ranking.

When you need a single "headline" CVSS to display:
1. Prefer `type == "Primary"` (NVD canonical).
2. Else pick the highest `metrics.baseScore` across entries.
3. Else fall back to the `relatedVulnerabilities[]` entry of the same
   match (a GHSA-only match usually has the Primary NVD score there).
4. Else `null` and render as `-`.

## Picking the canonical CVE id from a GHSA match

```
matches[i].relatedVulnerabilities[]
  | select(.id | startswith("CVE-"))
  | .id
```

## What `risk` actually is

Grype's `risk` is a single float that fuses:
- CVSS base score (highest among Primary/Secondary).
- EPSS percentile (exploit-prediction; how likely is real-world exploitation soon).
- KEV / CISA-known-exploited presence.
- Fix availability and recency.

It's what `grype` itself orders results by. We sort by it for that reason.
