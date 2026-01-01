# Implementation Plan - Fix Field Reordering and Display

The user wants to:
1.  **Move fields in Edit**: Add ability to reorder fields in the `Editor`.
2.  **Fix display of added fields**: Ensure that subsequently added fields (e.g. valid secondary phone numbers or emails) are displayed in the "Information" list, instead of being hidden by the current filter logic.

## Proposed Changes

### 1. `src/App.jsx` - Editor Component

-   **Import Icons**: Add `ArrowUp`, `ArrowDown` (or similar) to `lucide-react` imports.
-   **Add Reorder Logic**:
    -   Create `moveField(index, direction)` function in `Editor`.
    -   Direction: -1 for up, +1 for down.
    -   Swap elements in the `fields` array.
-   **Update UI**:
    -   In the `fields.map` loop (dynamic fields), add "Up" and "Down" buttons next to the "Delete" button.
    -   Disable "Up" for first item, "Down" for last item.

### 2. `src/App.jsx` - CardPreview Component

-   **Fix `listFields` Logic**:
    -   Currently: `const listFields = fields.filter(f => !['title', 'company', 'phone', 'email', 'website', 'location'].includes(f.type));`
    -   Problem: This hides *all* fields of those types, even if there are multiple (e.g. 2nd Phone).
    -   Fix: Identify the *specific field instances* used for the main card display (Header/Actions) and only exclude *those* from the list.
    -   Logic:
        ```javascript
        const titleField = fields.find(f => f.type === 'title');
        const companyField = fields.find(f => f.type === 'company');
        const phoneField = fields.find(f => f.type === 'phone');
        const emailField = fields.find(f => f.type === 'email');
        const websiteField = fields.find(f => f.type === 'website');
        const locationField = fields.find(f => f.type === 'location');

        const consumedFields = [titleField, companyField, phoneField, emailField, websiteField, locationField].filter(Boolean);

        const listFields = fields.filter(f => !consumedFields.includes(f));
        ```

## Verification Plan

1.  **Automated Check**: I cannot run automated tests easily here, but I will verify the code changes via `view_file`.
2.  **User Verification**: The user will inspect the preview.
