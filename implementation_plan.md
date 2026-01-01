# Implementation Plan - Fix Display Order to Strictly Match Editor

**The Issue**: The user is angry because the "More Information" list reorders items.
**The Cause**: The current code *hardcodes* the display of the **primary** Phone, Email, Website, and Location at the top of the list, and *only then* renders the rest of the fields. This forces "Email" to appear before a "Secondary Phone" even if the user ordered them differently in the editor.

**The Fix**:
1.  **Remove Hardcoded Render**: In `CardPreview`, inside the `isExpanded` block, remove the manual rendering of `phone`, `email`, `website`, `location`.
2.  **Unified Rendering Loop**: Instead, iterate through the entire `fields` array (which preserves user order).
3.  **Dynamic Rendering**: For each field in the loop, determine the styling (Icon, Label) based on its `type`.
    -   If type is 'title' or 'company', skip it (as it's in the header).
    -   For 'phone', 'email', 'website', 'location', 'facebook', etc., render them using a generic renderer that picks the right icon from `FIELD_TYPES`.

## Detailed Logic in `App.jsx`

Inside `CardPreview`:
```javascript
{isExpanded && (
  <div className="pro-details-list">
    {fields.map((field, idx) => {
       // Skip Title/Company as they are in the header
       if (['title', 'company'].includes(field.type)) return null;

       // Find definition to get Icon and Label
       const def = FIELD_TYPES.find(t => t.value === field.type);
       const Icon = def ? def.icon : Star;
       const label = field.label || def?.label || field.type;

       return (
         <div key={idx} className="pro-detail-item">
            {/* Render Icon and Value */}
         </div>
       )
    })}
  </div>
)}
```

This guarantees that if the user puts `Phone1`, `Phone2`, `Email`, the list will show `Phone1`, `Phone2`, `Email`.

## Verification
-   User's specific case: Phone 1, Phone 2, Email.
-   Result: Phone 1, Phone 2, Email.

## Additional Note
The user also asked to add **Signal** and **BitChat**. I already did this in the previous step, but I will double check they are there and working with this new logic.
