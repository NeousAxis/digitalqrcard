# Implementation Plan - Add Signal/BitChat & Fix Display Order

## Objectives
1.  **Add Signal & BitChat**: Add these to the `FIELD_TYPES`.
2.  **Fix Display Order**: Ensure that the "More Information" list displays fields **exactly as they are ordered in the Editor**, excluding only the "Main Action" fields that are already displayed in the top bar (Main Phone, Main Email, Main Website, Main Address).

## Code Changes

### 1. `src/App.jsx` - Add Field Types
-   Add `{ value: 'signal', label: 'Signal', icon: MessageCircle, tier: 'basic' }`
-   Add `{ value: 'bitchat', label: 'BitChat', icon: MessageCircle, tier: 'basic' }`

### 2. `src/App.jsx` - Fix `listFields` Logic in `CardPreview`
-   **Current Logic**: Finds the *first* instance of title, company, phone, email, website, location to use as "Primary" fields. Then filters `fields` to remove those specific instances.
-   **Problem**: This logic technically works for exclusion, but if `fields` is just a filtered array, the loop mapping `listFields` should already preserve order.
-   **Verification**: The `fields` array in `CardPreview` comes from `card.fields`. If `card.fields` is ordered (which it is, from `Editor`), then `listFields` (which is `fields.filter(...)`) *should* preserve that relative order.
-   **Potential Issue**: If the filter logic creates a new array that doesn't respect the original index, or if the "consumed" logic is removing items in a way that feels reordered.
-   **Refinement**: Ensure that `consumedFields` are exactly the specific object references found earlier. The current code `const consumedFields = [...]` and `fields.filter(f => !consumedFields.includes(f))` *should* work.
-   **Wait**: The user says "apply in the same order".
    -   In `Editor`, the user drags/moves fields. This updates `fields` state array order.
    -   In `CardPreview`, we use `card.fields`.
    -   The `listFields` logic removes the *First* Title, *First* Company, *First* Phone, *First* Email, *First* Website.
    -   All *other* fields remain in the list.
    -   **Example**:
        1.  Phone (Main) -> Removed (Header)
        2.  Instagram -> List Item 1
        3.  Twitter -> List Item 2
        4.  Phone (Secondary) -> List Item 3
    -   If the user moves "Phone (Secondary)" to position 2 (between Insta and Twitter)?
        1.  Phone (Main) -> Removed
        2.  Instagram
        3.  Phone (Secondary)
        4.  Twitter
    -   The list should show: Instagram, Phone (Secondary), Twitter.
    -   **My current code already does this**. Why does the user think it doesn't?
        -   Maybe the "Header" extraction logic takes the *Last* one? No, `find` takes the first.
        -   Maybe `fields` in `CardPreview` is not what we think it is?
        -   **Ah!** In `CardPreview`, I have a fallback: `const fields = card.fields || [{... default ...}]`.
        -   If `card.fields` is saved correctly, it should be an ordered array.
    -   **Hypothesis**: Maybe the user is confused because the **Main** items (1st phone, 1st email) are *stripped* from the list. So if they put "Instagram" *before* "Phone", "Phone" becomes the main action button (hidden from list), and Instagram stays in list. This might feel like reordering?
    -   **Strict Order Mode**: Perhaps the user wants **ALL** fields to appear in the list in order, **even if** they are also in the header?
    -   **User phrase**: "je veux que les infos de la carte s'appliquent dans le même ordre quand mentionné dans EDIT".
    -   **Interpretation**: The info list (the expanded view) must strictly follow the editor order.
    -   **Action**: I will verify the logic. The logical issue might be that `title` and `company` are being pulled out to the header text, and thus removed from the list. If the user puts "Company" *after* "Phone", but "Company" is shown at the top of the card and "Phone" is shown in the text below... that's a fixed layout issue.
    -   **Clarification**: I cannot change the "Header" layout (Name/Title/Company are always top). But for the *list* (the bottom part), it respects `fields` order.
    -   **Fix**: I will implement the new fields first. For the order, I will just double check the `filter` doesn't mess it up. `filter` preserves order.

## Plan
1.  Add Signal, BitChat.
2.  Review `CardPreview` logic. I suspect the "migration" helper or default fields might be messing with order if it's an old card. But for new edits, it should be fine. I will explicitly ensure `listFields` is derived cleanly.

