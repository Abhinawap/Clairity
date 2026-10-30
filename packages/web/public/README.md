# Static Assets

In Next.js, files placed in this `public` directory are served directly from the root URL `/`.

## Structure

- **`/logos`**: Brand logos, wordmarks, and product icons.
  - [`clairity-icon.svg`](file:///D:/Kuliah/Projects/Clairity/packages/web/public/logos/clairity-icon.svg) (Mark / Favicon)
  - [`clairity-logo.svg`](file:///D:/Kuliah/Projects/Clairity/packages/web/public/logos/clairity-logo.svg) (Icon + Wordmark)
- **`/assets`**: General static media (illustrations, mockups, screenshots, badges).

## Usage Example

```tsx
import Image from "next/image";

// Referencing from public:
<Image src="/logos/clairity-logo.svg" alt="Clairity" width={140} height={36} />
```
