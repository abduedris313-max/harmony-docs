# Security Specification: ABAC and Zero-Trust Firestore Security

## 1. Data Invariants
- All user collections (`books`, `folders`, `history`, `snapshots`) reside strictly under sub-paths of `/users/{userId}/`.
- Access is strictly isolated per authenticated user (`request.auth.uid == userId`).
- Anonymous writes are forbidden without explicit auth token verification.
- Document ownership cannot be forged (`userId` in payload must match `request.auth.uid`).
- Once written, `userId` and document creation timestamps are immutable.
- String boundaries, array lengths, and data types are verified on both creation and modification.
- List queries MUST enforce `request.auth.uid == userId` and never permit blanket or cross-tenant reads.

## 2. The Dirty Dozen Payloads (Designed to Fail)
1. **Unauthenticated Read/Write**: Attempting any read or write without valid `request.auth`. -> PERMISSION_DENIED
2. **Cross-User Tampering**: User `user-A` writing to `/users/user-B/books/b1`. -> PERMISSION_DENIED
3. **Owner Identity Spoofing**: `user-A` writing a book payload containing `userId: "user-B"`. -> PERMISSION_DENIED
4. **Oversized String Bomb**: Writing a `title` exceeding 300 characters or `content` exceeding 1MB. -> PERMISSION_DENIED
5. **Ghost Field Injection (Shadow Field)**: Injecting unrecognized administrative or permission properties (`isAdmin: true`, `verified: true`). -> PERMISSION_DENIED
6. **Path ID Injection**: Passing invalid characters or 500-character long IDs into `{bookId}`. -> PERMISSION_DENIED
7. **Immutable Key Mutation**: Attempting to alter `userId` on an existing book during update. -> PERMISSION_DENIED
8. **Unbounded Array Overflow**: Writing a `tags` list containing more than 20 elements. -> PERMISSION_DENIED
9. **Blanket Collection Scraping**: Querying collection `/users/{userId}/books` without authenticated `request.auth.uid == userId`. -> PERMISSION_DENIED
10. **Type Confusion Attack**: Supplying a boolean for `title` or a number for `content`. -> PERMISSION_DENIED
11. **Negative Numeric Tampering**: Supplying negative values for `wordCount` or `fileSizeBytes`. -> PERMISSION_DENIED
12. **Orphan Write / Cross-Tenant Folder Linking**: Writing a book referencing a non-existent folder or another user's folder ID maliciously. -> PERMISSION_DENIED
