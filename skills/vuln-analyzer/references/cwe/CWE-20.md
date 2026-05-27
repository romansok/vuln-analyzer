# CWE-20: Improper Input Validation

## Plain-English explanation
The app accepts whatever the user sends without checking it's the shape, size, or type it expected. Once bad input is inside, downstream code makes assumptions that no longer hold and breaks in dangerous ways — wrong arithmetic, oversized arrays, panics, or worse, it becomes the foothold for another bug.

## Typical attack pattern
An API endpoint takes a JSON body and uses one of the fields directly as a numeric index, a length, or a path. The attacker sends a value the field "shouldn't" hold — a negative number, a 50MB string, a deeply nested object, the string `"__proto__"`. The endpoint crashes, exposes data via an error path, or amplifies into RCE through a parser further downstream.

## Reachability hints
- Functions that read user input from a request body / query / form and pass it to a parser, calculator, allocator, or filesystem operation **without** a schema check.
- Use of `JSON.parse(...)`, `parseInt`, `Number`, `parseFloat` on untrusted strings, then arithmetic.
- Allocation sized from request input: `new Array(n)`, `Buffer.alloc(n)`, `slice(0, n)`.
- Absence of a schema library (Zod / Joi / Yup / Pydantic / Marshmallow / `validator`).

## Common workarounds when a bump is blocked
- Wrap the entry point in a typed schema (Zod / Pydantic / Joi). Reject before the input reaches business logic.
- Add explicit `if (typeof x !== 'string' || x.length > 256) throw …` guards at every untrusted boundary.
- Set framework body-size limits (`express.json({ limit: '64kb' })`, `body_parser`'s `parameterLimit`).
- Add a request-validation middleware so it can't be forgotten on new routes.

## Concrete code example

```js
// Vulnerable
app.post('/items', (req, res) => {
  const items = new Array(req.body.count);  // count = -1 → RangeError; 1e9 → OOM
  res.json(items);
});

// Safe
const Body = z.object({ count: z.number().int().min(0).max(1000) });
app.post('/items', (req, res) => {
  const { count } = Body.parse(req.body);   // throws ZodError on bad input
  res.json(new Array(count));
});
```
