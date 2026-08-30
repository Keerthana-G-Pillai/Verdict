# VERDICT — Project Overview

> **"Git sees no conflict. VERDICT found one."**

## What It Does

VERDICT is an AI-powered change intelligence platform that analyzes proposed engineering changes and detects risks that Git, linters, and conventional code review tools cannot see. It issues evidence-based verdicts — Approved, Approved with Conditions, or Requires Revision — backed by a four-agent adversarial AI pipeline and deterministic scoring.

## The Problem

Git detects textual conflicts — overlapping lines in the same file. But many of the most dangerous engineering failures come from changes that merge cleanly:

- A "simplification" commit that replaces a parameterized SQL query with direct string interpolation — introducing a SQL injection vulnerability in syntactically valid code
- A "validation improvement" that adds input checking but silently changes the API contract for existing clients
- Two developers working on the same authentication system — one migrating to JWT tokens, the other extending session lifetimes — where Git sees no conflict but the refresh flow breaks for every user

These are **semantic conflicts**: behavioral incompatibilities that pass lint, pass tests, and merge without a single conflict marker.

## The Solution

VERDICT runs a four-agent adversarial pipeline on every submitted change:

1. **Risk Intelligence** — argues the strongest case *against* the change
2. **Safety Validation** — argues the strongest case *for* the change
3. **Validation Engine** — runs deterministic static analysis with no fabricated results
4. **Decision Engine** — synthesizes all evidence into a verdict with explanation

Risk and Safety agents run in **parallel with completely independent contexts** — neither sees the other's output before forming its assessment. This produces genuinely adversarial, unanchored evaluations.

The **deterministic verdict engine** is always the source of truth for pass/fail thresholds. AI enhances the rationale — it never overrides safety scores.

## Core Features

### Change Analysis
Submit a diff, code snippet, pull request, or engineering decision. VERDICT analyzes it through the four-agent pipeline and produces a verdict with risk score, confidence level, detailed findings, and actionable conditions.

### Merge Simulation
Submit two concurrent changes and simulate what happens when they meet. VERDICT's semantic conflict engine detects behavioral incompatibilities across 13 conflict templates spanning authentication, database contracts, API compatibility, payment processing, async ordering, caching, and configuration.

### Engineering Memory
Every saved analysis becomes part of a searchable knowledge base. Search across code content, change descriptions, verdicts, domains, and risk scores. Over time, teams accumulate institutional knowledge about what kinds of changes require caution.

### Dashboard
A live engineering intelligence dashboard tracks analyses run, attention-requiring items, approval rates, and recent activity.

## Typical User Workflow

1. **Submit a change** — paste a diff, code snippet, or PR description into the analysis form
2. **Watch the pipeline** — VERDICT runs the four-agent analysis with a live pipeline visualization
3. **Review the verdict** — see the verdict card (risk score, confidence, critical findings count)
4. **Read the findings** — scroll through individual finding cards with evidence and recommendations
5. **Save to memory** — store the analysis in Engineering Memory for future reference
6. **Simulate merges** — submit two concurrent changes to detect semantic conflicts before they reach production

## Why It Matters

Every team that uses Git has a gap. Git prevents textual merge conflicts. But it cannot detect:

- Authentication systems removing infrastructure that another change depends on
- Security regressions hidden in "simplification" commits
- API contract breaks disguised as "validation improvements"
- Database schema changes that break services still referencing old column names

VERDICT closes that gap — catching the risks that pass lint, pass tests, merge cleanly, and still break production.
