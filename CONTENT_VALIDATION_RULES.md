# Content Validation Rules

The FileEditor component now includes real-time content validation to ensure proper formatting of term definition files according to the Spec-Up specification.

## Validation Rules

The editor enforces the following rules and displays warnings when they are not met:

### 1. First Line Format

**Rule**: The first line must start with `[[def:` or `[[tref:`

**Purpose**: This ensures that the file begins with either a term definition or a term reference, which is required for proper term processing.

**Example Valid First Lines**:

```text
[[def: my-term]]
[[def: my-term, alias1, alias2]]
[[tref: external-spec, term-name]]
```

### 2. Definition/Reference Placement

**Rule**: `[[def:` and `[[tref:` can only exist on the first line

**Purpose**: These markers should only be used to define the primary term at the beginning of the file. Multiple definitions in a single file are not allowed.

### 3. Reference Restriction

**Rule**: `[[ref:` and `[[xref:` cannot exist on the first line

**Purpose**: The first line should define or reference the main term, not reference other terms. References to other terms should appear in the content section.

### 4. Content Line Format

**Rule**: Every line after the first line must start with `~`

**Purpose**: Content lines that provide the actual definition or description must be prefixed with `~` to distinguish them from the term declaration.

**Example Valid Content**:

```text
[[def: my-term]]
~ This is the definition of my-term.
~ It can span multiple lines.
~ Each content line must start with ~.
```

## Warning Display

When validation rules are violated, a warning alert appears below the success/error messages with:

- An exclamation triangle icon
- A clear description of each validation issue
- Line numbers where applicable

## Validation Timing

Content validation occurs:

- When the file is initially loaded
- Every time the content is modified (on input change)
- Warnings are displayed immediately and update in real-time

## Technical Implementation

The validation is implemented in the `validateContent()` function which:

- Splits content into lines
- Checks each rule sequentially
- Collects all violations into a warnings array
- Updates the UI to show/hide warnings based on validation results

This validation helps ensure consistency and correctness of term definition files according to the Spec-Up specification.
