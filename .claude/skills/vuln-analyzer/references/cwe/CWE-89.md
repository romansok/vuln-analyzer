# CWE-89: SQL Injection

## Plain-English explanation
User input is concatenated into a SQL string and the database parses it as part of the query. The attacker breaks out of the value position into the query position and runs SQL of their choosing — typically dumping data, modifying rows, or escalating to OS access through DB extensions.

## Typical attack pattern
A login form runs `SELECT * FROM users WHERE name = '<u>' AND pass = '<p>'`. The attacker supplies `u = "admin' --"`. The query becomes `SELECT * FROM users WHERE name = 'admin' --' AND pass = '<p>'` — the comment swallows the password check.

## Reachability hints
- String-built queries: `"SELECT ... WHERE id = " + req.params.id`, f-strings or `%` formatting in Python DB code, Ruby `#{...}` inside ActiveRecord raw-query helpers.
- ORM "raw" / "literal" escape hatches: Sequelize `query()`, SQLAlchemy `text()`, Knex `raw()`.
- Stored procedures that build dynamic SQL inside the DB (`EXECUTE sp_executesql @sql`).
- Reporting features that let users pick a column name or sort direction by name — those reach the SQL parse path.

## Common workarounds when a bump is blocked
- Parameterized queries / prepared statements everywhere. `WHERE id = ?` with a separate args array.
- ORMs: use the model-style API, not the raw-string API.
- For dynamic identifiers (table/column names), allowlist against a known set — never interpolate from user input.
- Run the application DB user with `SELECT` only on the tables it needs; rejection at the privilege layer reduces blast radius.

## Concrete code example

```js
// Vulnerable
db.query(`SELECT * FROM users WHERE id = ${req.params.id}`);

// Safe
db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
```
