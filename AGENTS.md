<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting published git history — force pushing, or rebasing/amending/squashing commits that are already pushed — as it rewrites history on Lovable's side and the user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Store data and authorization live in Lovable Cloud with row-level policies; this keeps private orders and administration server-verified.
- The catalog and checkout RPC live in `src/lib/store.functions.ts`, while page interactions use shared store context; this separates trusted pricing from browser state.
- Payment proofs use a private storage bucket and product photos use signed URLs from a private bucket; workspace policy disallows public buckets.
- Arabic customer pages and administrator pages use TanStack file routes; this gives each screen a shareable URL.
- Loyalty math lives in `src/lib/loyalty.ts` (pure, tested) and is recomputed server-side in `createOrder`; the browser total is display-only.
- Secret admin search keyword is checked only in the `resolveSearch` server function so it never ships in browser code.
- New-order Telegram alerts are sent from `src/lib/telegram.server.ts` via the Telegram connector; failures are logged, never block the order.
- First-visit guided tour uses Shepherd, dynamically imported client-side in `OnboardingTour`, targeting `data-tour` attributes; keeps SSR safe.
