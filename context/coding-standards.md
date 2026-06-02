# Coding Standards

## TypeScript

- **Strict Configuration:** `"strict": true` in your `tsconfig.json` is mandatory. It is the foundation for catching null references and enforcing robust checks.
- **The `satisfies` Operator:** Use `satisfies` to validate the shape of complex objects against a type while retaining the most specific, narrow literal types of their properties.
- **Interfaces vs. Types:** Always use `interface` for defining standard object shapes. Reserve `type` aliases strictly for unions, intersections, and mapped utility types.
- **Smart Inference:** Do not manually type primitives (strings, booleans, numbers) upon initialization. Let the compiler do the work.
- **`const` Type Parameters:** Use `const` modifiers on generic type parameters (`<const T>`) so the compiler infers exact literal types instead of widening them to general strings or numbers.
- **Zero `any` Tolerance:** Banish `any` completely. When handling unpredictable data (like API payloads), type it as `unknown` and force the use of explicit type guards before allowing interaction.
- **Discriminated Unions:** Manage complex state by grouping related properties under a literal string tag (e.g., `status: "loading" | "success" | "error"`). This guarantees type safety and prevents impossible states.
- **Utility Types:** Heavily utilize `Omit`, `Pick`, `Partial`, and `Record` to transform existing types rather than duplicating declarations throughout your codebase.

## React

- Functional components only (no class components)
- Use hooks for state and side effects
- Keep components focused - one job per component
- Extract reusable logic into custom hooks


## Naming

- Components: PascalCase (`ItemCard.tsx`)
- Files: Match component name or kebab-case
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase (no prefix)

## Styling

- Tailwind CSS for all styling
- Use shadcn/ui components where applicable
- No inline styles
- Dark mode first, light mode as option


## Error Handling

- Use try/catch in Server Actions
- Return `{ success, data, error }` pattern from actions
- Display user-friendly error messages via toast

## Code Quality

- No commented-out code unless specified
- No unused imports or variables
- Keep functions under 50 lines when possible