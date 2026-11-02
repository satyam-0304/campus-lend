# Agent Guidelines — CampusLend

> **Canonical Project Documentation**: See detailed architecture, API reference, schema, and rules in [`.agents/rules/INSTRUCTION.md`](.agents/rules/INSTRUCTION.md).

---

## 🚨 MANDATORY WORKFLOW RULES

### 1. Mandatory Branch-Per-Feature / Issue Workflow
Whenever asked to work on **ANY** feature, bug fix, enhancement, or issue:
1. **Always create and switch to a separate git branch first** before making any code modifications or creating files:
   ```bash
   git checkout -b <type>/<description>
   # Examples:
   # git checkout -b feature/<feature-name>
   # git checkout -b fix/<issue-name>
   ```
2. **NEVER make changes or work directly on `main`**.
3. All implementation, edits, tests, and commits for the issue must reside on that dedicated branch.

---

### 2. Core Project Invariants
- **No `email` on `profiles`**: The `profiles` table has no `email` column. Email lives strictly in `auth.users`.
- **Server-enforced IDs**: Always enforce `owner_id` and `borrower_id` from `req.user.id` on backend endpoints; never trust user input from the request body.
- **Backend RLS bypass**: The backend uses Supabase `serviceClient` which bypasses RLS. All permission checks must be explicitly enforced in route handler code.
- **Frontend DB Access**: The frontend Supabase client is used solely for authentication. All application data goes through the Express API (`/api/*`).

