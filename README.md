# muteeb.in — Baba Muteeb, personal website

Dark-minimal personal site for Baba Muteeb, live at **[muteeb.in](https://muteeb.in)**.

Near-black canvas (`hsl(0 0% 4%)`), layered surfaces, crisp 1px borders and a single
code-green accent (`#22d472`) with glowing hover effects. Typography is **Sora** for
display/UI and **JetBrains Mono** for code, labels and terminal chrome.

## Stack

- React 19 + Vite 7 + TypeScript
- Tailwind CSS v4 (CSS-first `@theme` design tokens in `src/index.css`)
- Framer Motion (animation, drag, springs)
- Supabase (data + storage) via Vercel serverless functions in `api/`
- Web3Forms for contact email delivery
- Aceternity UI components in `src/components/ui/`

## Aceternity UI components used

| Component                    | Where                                                    |
| ---------------------------- | -------------------------------------------------------- |
| FloatingNavbar               | `Navbar.tsx` — pill nav that floats in on scroll          |
| NavbarMenu                   | `Navbar.tsx` — "Explore" dropdown with smooth spring menu |
| Floating terminal + cursor   | `Hero.tsx` — self-typing `muteeb.ts` code block           |
| PointerHighlight             | `Hero.tsx` — "Baba Muteeb" and the location chip          |
| FlipWords                    | `Hero.tsx` — rotating roles line                          |
| TextGenerateEffect           | Section intros (hero bio, projects, thoughts…)            |
| GlowingEffect                | Cards across projects / now / stack / guestbook / contact |
| GridBackground               | Hero + contact sections                                   |
| CardStack                    | Featured projects — swipe/tap the deck                    |
| PlaceholdersAndVanishInput   | Thoughts search                                           |
| LayoutTextFlip               | Boot / loading splash                                     |

## Develop

```bash
npm install
npm run dev
```

Optional `.env.local` (not required for the UI, used by Supabase auth):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Build

```bash
npm run build
npm run preview
```

## Data + admin

All content (profile, projects, thoughts, skills, guestbook, messages) lives in
Supabase and is served through the serverless functions in `api/`. The secret admin
studio is unchanged: open `/admin`, `#admin`, press `Ctrl/Cmd/Alt+Shift+A`, or type
`muteeb` anywhere. Guestbook entries require admin approval before going public.

## Structure

| Section             | Component                |
| ------------------- | ------------------------ |
| Floating navbar     | `src/components/Navbar.tsx`   |
| Hero + terminal     | `src/components/Hero.tsx`     |
| Projects (+ stack)  | `src/components/ProjectsSection.tsx` |
| Now & quick facts   | `src/components/NowSection.tsx` |
| Stack / tools       | `src/components/TechMatrix.tsx` |
| Thoughts & articles | `src/components/ThoughtsSection.tsx` |
| Guestbook           | `src/components/GuestbookSection.tsx` |
| Contact terminal    | `src/components/ContactTerminal.tsx` |
| Footer              | `src/components/Footer.tsx`    |
| Admin studio        | `src/components/AdminModal.tsx` |
