# Security Specification for Trrop Firestore

## Data Invariants
1. Users can only read and write their own profile (`/users/{userId}` where `userId == request.auth.uid`).
2. Users can only manage their own subcollections (`/users/{userId}/savedFilters/{filterId}` and `/users/{userId}/salesRecords/{recordId}` where `userId == request.auth.uid`).
3. Notes in `/notes/{noteId}` are readable by authenticated users and writable only when `request.auth.uid == request.resource.data.userId`.
4. String length bounds and regex patterns must be strictly enforced.
5. All IDs must adhere to `^[a-zA-Z0-9_\-]+$`.
6. Default deny catch-all for any undefined paths.

## The Dirty Dozen Attack Payloads
1. **Ghost Field Injection**: User attempts to inject `isAdmin: true` into their user profile.
2. **Path Traversal / Impersonation**: User A writes to `/users/{userB_id}` with their own token.
3. **Huge String Denial of Wallet**: Injecting 500KB string into `city` or `brand`.
4. **Invalid Date Format**: Injecting non-date string `INVALID_DATE` into `date` field.
5. **Negative Impressions / Negative GMV**: Injecting negative values into numerical metrics.
6. **Subcollection Hijack**: User A writing to `/users/{userB_id}/savedFilters/{filterId}`.
7. **Cross-Tenant Note Tampering**: User A modifying note created by User B without being the note owner.
8. **Null Auth Exploitation**: Unauthenticated user attempting to list `/notes`.
9. **Malformed Doc ID**: Document ID containing illegal symbols e.g. `../../../etc/passwd`.
10. **Shadow Key Update**: Modifying immutable `userId` on update.
11. **Excessive Note Length**: Sending note exceeding 1000 characters.
12. **Blanket Collection Scrape**: Attempting unbounded query across `/users` without auth filter.
