# Fitnex — Coding Standards & Engineering Rules (RULES.md)

This document establishes the mandatory engineering standards for all Fitnex development, synthesizing principles from:
- **Andrej Karpathy's Guidelines**: Think before coding, surgical changes, simplicity first, verifiable goal-driven execution.
- **Ponytail Dev Principles**: Minimal diffs that fully solve the problem, zero speculative bloat, YAGNI.
- **Vercel Best Practices**: Eliminating waterfalls (`Promise.all`), avoiding barrel import bloat, sub-30ms read paths.
- **Compound Engineering**: Systematic plan -> execute -> verify -> compound cycle.

---

## 1. Core Engineering Tenets

### 1.1 Think Before Coding
- **Never guess**: State assumptions explicitly before implementing.
- **Surface tradeoffs**: If a simpler approach exists, choose simplicity over abstraction.
- **Clarify ambiguities**: Never silently invent behavior not specified in the PRD.

### 1.2 Simplicity First (YAGNI & Ponytail)
- **Minimum code that works**: Write the smallest robust implementation that satisfies requirements.
- **No speculative features**: No "for later" parameters, configuration flags, or unrequested abstractions.
- **Single-use code needs no abstraction**: If a function or service is called once, keep it straightforward.
- **Comments**: Only comment the *why* that the code cannot self-evidently convey.

### 1.3 Surgical Changes
- **Touch only what is necessary**: Never reformat, "clean up", or alter unrelated code, comments, or dependencies.
- **Zero collateral damage**: Never touch or break frontend styling, color schemes, themes, or existing layouts unless explicitly requested.
- **Clean up your own mess**: Remove any imports or variables orphaned by your changes.

### 1.4 Goal-Driven Execution
- Define verifiable success criteria before editing code.
- Write or run automated regression tests after every change.
- Never declare a phase complete without verified test execution.

---

## 2. Backend Coding Standards (NestJS & TypeScript)

1. **Strict Typing & DTO Validation**:
   - Every incoming request body and query param must have a dedicated DTO with `class-validator` and `class-transformer` decorators.
   - For numbers passed in queries or paths, use `@Type(() => Number)` alongside `@IsInt()` or `@IsNumber()`.
2. **Database & Schema Defense-in-Depth**:
   - Sensitive fields (`password`, `refreshTokenHash`, `verificationToken`, `resetPasswordToken`) must be defined with `select: false` in Mongoose schemas.
   - Use Mongoose `toJSON` transforms to convert `_id` to string `id` and strip `__v` and internal fields.
   - Use compound indexes for common query patterns (e.g., `{ userId: 1, isActive: 1 }`).
3. **Async Performance & Waterfalls**:
   - Never serialize independent asynchronous operations in a loop; use `Promise.all()` for concurrent queries.
   - Exclude heavy unneeded fields (such as localized translations `i18n`) from catalog listings (`.select('-i18n')`).
4. **Route Naming Conventions**:
   - Endpoints follow RESTful plural nouns: `/exercises`, `/workouts`, `/plans`, `/history`, `/meals`.
   - Specific sub-resources or actions precede dynamic parameter paths (e.g. `/plans/active/me` **before** `/plans/:id`).

---

## 3. Frontend Coding Standards (React 18 & Vite)

1. **State Scoping & Persistence**:
   - User-scoped local storage keys must use prefixes (`fx:${user.id}:...`) to prevent data bleeding between accounts.
2. **Contrast & Accessibility**:
   - Input fields must maintain high-contrast dark text `#0f172a` on light container `#f8fafc`.
   - Brand buttons use `#ff5e1a` with high-contrast readable white labels.
3. **No Waterfalls in Components**:
   - Pre-fetch critical datasets in parallel.
   - Decouple live timers from heavy re-rendering trees.
