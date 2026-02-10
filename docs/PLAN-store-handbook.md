# Plan: Store Information Handbook (Sổ tay thông tin tiệm)

## Overview
Create a new feature "Sổ tay thông tin tiệm" to manage and store social media accounts and notes for various shops/stores. This will be a central repository for AMs and Support teams to quickly look up store details.

## Project Type
**WEB** (React + Firebase)

## Success Criteria
1.  **Data Storage**: Successfully store Facebook, Instagram, Google Maps, Yelp, Other, and Notes for each store in Firestore.
2.  **Management**: Users can Add, Edit, and Delete store records.
3.  **UI**: A clean, searchable grid or list view of stores.
4.  **Accessibility**: Easy access via the Sidebar (likely under "Quy trình & Hướng dẫn" or a new item).

## Tech Stack
-   **Frontend**: React (Vite), CSS Modules.
-   **Backend**: Firebase Firestore.
-   **State Management**: `AppStateContext`.
-   **Icons**: Lucide React.

## File Structure
```
src/
├── pages/
│   └── StoreHandbook.jsx       # [NEW] Main page
│   └── StoreHandbook.module.css # [NEW] Styles
├── components/
│   └── Modal/
│       └── StoreModal.jsx      # [NEW] Add/Edit Modal
│       └── StoreModal.module.css # [NEW] Styles
├── services/
│   └── firestoreAPI.js         # [MODIFY] Add stores CRUD
```

## User Review Required
> [!IMPORTANT]
> **Permissions Update**:
> - **Add/Edit**: Open to `Admin`, `Manager`, `AM`, and `MKT Support`.
> - **Delete**: Open to all, BUT triggers a **Soft Delete** (Pending Approval).
> - **Final Delete**: Only `Admin`, `Manager`, or `Supervisor` can permanently delete (approve).

## Workflow Changes (Delete Process)
1.  **User Actions**: When a user clicks "Delete", the store is NOT removed. It is marked as `deletePending`.
2.  **Visibility**: "Deleted" stores are hidden from the main list but visible in a "Pending Deletion" tab/filter accessible to Admins/Managers.
3.  **Approval**: Admins/Managers can:
    -   **Approve**: Permanently delete the record.
    -   **Restore**: Reject the deletion and return it to the active list.
4.  **Logging**: All delete requests are logged to `Attendance History`.

## Task Breakdown

### Phase 1: Foundation (Backend & API)
### Phase 1: Foundation (Backend & API)
- [ ] **Define Schema**: `stores` collection update:
    -   `facebook`: { link, account }
    -   `instagram`: { link, username, password, twoFactor }
    -   `maps`: { link, account }
    -   `yelp`: { link, mail, password }
    -   `other`: { link, note }
    -   `notes`: string
- [ ] **Update API Service**: Ensure CRUD handles nested objects correctly.

### Phase 2: UI Implementation
- [ ] **StoreHandbook Page**:
    -   **View**: Switch from Grid to **Accordion List** (Toggle Rows).
    -   **Row Header**: Helper Icon + Store Name + Action Buttons (Edit/Delete).
    -   **Row Content**: Expanded details with sections (FB, Insta, Maps, Yelp).
    -   **Features**: One-click **Copy Button** for every credential field.
### Phase 1.5: Security & Settings
- [ ] **Settings Integration**:
    -   Add `viewPasswordPasscode` field to `settings` collection.
    -   Update `Settings.jsx` to allow Managers/Admins to set/change this passcode.
- [ ] **Security Logic**:
    -   passwords hidden by default (`••••••`).
    -   Clicking "Eye" icon triggers a **Passcode Prompt**.
    -   Correct passcode reveals password (temporarily or toggle).
    -   Validation logic in client-side (comparing against `settings.viewPasswordPasscode`).

### Phase 2: UI Implementation
- [ ] **StoreHandbook Page**:
    -   **Accordion UI**: Toggle rows for stores.
    -   **Credential Component**: Reusable component for displaying User/Pass/2FA.
        -   Includes: Copy button, Eye button (with Passcode challenge).
- [ ] **StoreModal**:
    -   Complex form handling for nested objects (Instagram.password, etc.).
    -   Group fields logically.
- [ ] **Passcode Modal**: Simple modal to enter pin code.

### Phase 3: Integration & Routing
- [ ] **Routing**: Add `/store-handbook`.
- [ ] **Sidebar**: Add link.
- [ ] **Notifications**: (Optional) Notify Manager when a deletion is requested?

## Phase X: Verification
- [ ] **Lint Check**: `npm run lint`
- [ ] **Security**: Verify Firestore rules allow read/write for appropriate roles.
- [ ] **Functionality**:
    -   [ ] Create a new store with all fields.
    -   [ ] Edit an existing store.
    -   [ ] Delete a store.
    -   [ ] Search filter works correctly.
    -   [ ] Links open in new tabs.
