# Implementation Plan - Fix Carousel Reset on Expansion

The user reports that viewing details on the 2nd card resets the view to the 1st card.
This is caused by the `Carousel` component being defined *inside* the `App` component.
Every time `App` re-renders (triggered by `setExpandedCardId`), `Carousel` is redefined, unmounted, and remounted, resetting its internal `activeIndex` state to 0.

## Proposed Changes

### 1. `src/App.jsx` - Move Carousel Component

-   **Extract**: Remove `Carousel` definition from inside `App` function (lines 1009-1052).
-   **Insert**: Place `Carousel` definition *outside* `App`, before `function App()`.
-   **Improvement**: Add `useEffect` to `Carousel` to clamp `activeIndex` if `items.length` decreases (e.g. after deletion).

## Verification Plan

1.  **Code Check**: Verify `Carousel` is top-level.
2.  **Deployment**: Deploy to Vercel.
3.  **User Test**: User will test on their device.
