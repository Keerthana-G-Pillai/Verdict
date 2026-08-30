# VERDICT — Known Limitations

> An honest assessment of VERDICT's current scope, boundaries, and growth opportunities.

---

## Current Scope

VERDICT is a production-quality web application that performs AI-enhanced semantic analysis of engineering changes. It operates on submitted content — diffs, code snippets, pull request descriptions, and engineering decisions — and produces evidence-based verdicts using a four-agent adversarial pipeline and deterministic scoring engine.

All analysis is performed through pattern recognition and AI reasoning on the submitted text. VERDICT does not execute code, access live repositories, or run in a sandbox environment.

---

## Known Limitations

### Analysis Method

| Limitation | Detail |
|---|---|
| **Static and semantic analysis only** | VERDICT performs pattern-based semantic analysis and AI-enhanced reasoning. It does not execute code in a sandbox or runtime environment. All findings are based on static analysis or inferred risk — never fabricated execution results. |
| **Content-based input** | Input is currently a diff, code snippet, PR description, or engineering decision text. Full repository or folder upload is not supported. VERDICT analyzes what is submitted, not the entire codebase. |
| **Conflict template coverage** | The semantic conflict engine uses 13 behavioral templates across 10 engineering domains. Novel conflict patterns outside these templates may not be detected deterministically, though AI reasoning may still flag them. |

### AI Provider

| Limitation | Detail |
|---|---|
| **Groq is the active AI provider** | Groq (`llama-3.1-8b-instant`, free tier) is the working AI provider. Rate limits may apply under heavy concurrent load. |
| **watsonx not configured** | IBM watsonx / Granite provider code is fully implemented (`watsonx-provider.ts`) but `WATSONX_API_KEY` and `WATSONX_PROJECT_ID` are not configured in this submission. The provider manager would activate watsonx automatically once credentials are set. |
| **Free tier constraints** | Both Groq and OpenRouter are used on free tiers. Production deployment would use paid tiers for higher rate limits and reliability. |

### Data Persistence

| Limitation | Detail |
|---|---|
| **Engineering Memory is client-side** | Engineering Memory is persisted in the browser's localStorage. It is not automatically synchronized across devices or browsers. Supabase integration exists for authentication and database, but full cloud sync of analysis history requires a logged-in session. |

### Integration

| Limitation | Detail |
|---|---|
| **Standalone web application** | VERDICT is currently a web application, not a Git hook, GitHub Action, or CI/CD pipeline plugin. Integration with existing development workflows requires manual submission. |

---

## Future Opportunities

These limitations define the boundaries of the current version. Each represents a clear growth path:

| Area | Opportunity |
|---|---|
| **Sandboxed execution** | Adding code execution in a sandboxed environment would enable `EXECUTION_EVIDENCE` level findings — the highest confidence tier in VERDICT's evidence model. |
| **Repository indexing** | Full repository upload and indexing would enable cross-file dependency tracing and richer contextual analysis. |
| **Expanded conflict templates** | Growing the template bank beyond 13 and adding vector-similarity matching would improve detection of novel conflict patterns. |
| **CI/CD integration** | A CLI tool, GitHub Action, or GitLab CI plugin would embed VERDICT directly into existing development workflows. |
| **Cloud-synced memory** | Full Supabase cloud sync for Engineering Memory would enable team-wide knowledge sharing across devices and users. |
| **watsonx activation** | Configuring IBM watsonx credentials would activate IBM Granite as a provider option, leveraging IBM's enterprise AI capabilities. |

---

These limitations are scope boundaries, not defects. VERDICT is designed to be transparent about what it can and cannot verify — this honesty is itself a core product principle.
