<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## Project notes

- Stack: TanStack Start v1 (React 19) + Vite 7 + Tailwind CSS v4.
- Live hardware data is sourced from the Supabase `nodemcu` table.
- Environment context (temperature, humidity, air quality) comes from the
  Open-Meteo API based on the browser location.
- Do not commit secrets or `.env` files; they are gitignored.
<!-- LOVABLE:END -->
