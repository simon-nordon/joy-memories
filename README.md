# Joy Memories

Marketing site for a Brisbane family and portrait photographer. Plain HTML, CSS and
JavaScript — no build step, no framework, no dependencies. It ships to GitHub Pages as-is.

Every photo on the site is currently a generated **placeholder** that names the shot
belonging in that slot. See [Swapping in real photos](#swapping-in-real-photos).

## Run it locally

Any static server will do — the site must be served over `http://`, not opened as a
`file://` path, or the browser will block the stylesheet and script.

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Publish to GitHub Pages

`.github/workflows/pages.yml` deploys `main` on every push.

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Push to `main`. The workflow publishes to `https://<user>.github.io/<repo>/`.

All asset paths are relative, so the site works both at a repo subpath and at a
custom domain. For a custom domain, add a `CNAME` file at the repo root containing
the bare domain, then set it under Settings → Pages.

## Swapping in real photos

Placeholders live in `assets/img/` and are generated from `tools/photos.json`.
For each real photo:

1. Export it (JPEG, ~2000 px on the long edge) and save it into `assets/img/`
   using the same base name — `assets/img/hero-main.jpg`.
2. In `index.html`, find that slot's `<img>` and change the `src` extension from
   `.svg` to `.jpg`. Rewrite the `alt` to describe the actual photo.
3. Delete `assets/img/<name>.svg` and remove its entry from `tools/photos.json`,
   so the generator doesn't recreate it.

Each `<img>` sits inside a `.photo` div whose aspect ratio is fixed by the class on
the parent `<figure>` (`p-sq`, `p-tall`, `p-wide`, `p-port`, or none for 3:2). Photos
are cropped to fill, so pick a slot shape that suits the frame rather than fighting it.

To change a placeholder's brief, tone or shape, edit `tools/photos.json` and re-run:

```bash
node tools/generate-placeholders.mjs
```

## Editing the site

| What | Where |
| --- | --- |
| Copy, prices, packages, FAQ | `index.html` |
| Available and booked dates | `CONFIG` at the top of `assets/js/site.js` |
| Where enquiries are sent | `CONFIG.formEndpoint` / `CONFIG.enquiryEmail` |
| Colours, type, spacing | `:root` tokens at the top of `assets/css/site.css` |
| Photo slots | `tools/photos.json` |

### Availability calendar

The calendar reads today's real date and offers every shoot day from
`CONFIG.leadTimeDays` onward, out to `CONFIG.monthsAhead` months. Mark taken dates by
adding `YYYY-MM-DD` strings to `CONFIG.bookedDates`. Shoot days default to Thursday
through Sunday (`CONFIG.shootDays`, where `0` is Sunday).

### Enquiry forms

GitHub Pages serves static files only, so there is no server to receive a form post.
Out of the box both forms open the visitor's mail app with every field pre-filled and
addressed to `CONFIG.enquiryEmail` — nothing is silently dropped.

To collect enquiries properly, sign up for a form service (Formspree, Basin, Getform,
or your own Cloudflare Worker) and put its URL in `CONFIG.formEndpoint`. The forms then
POST JSON to it and show an inline confirmation.

## Layout

```
index.html                 all seven pages, switched client-side by URL hash
assets/css/site.css        design tokens and every style
assets/js/site.js          routing, nav, calendar, portfolio filter, forms
assets/img/                placeholder photography (generated)
assets/favicon.svg
tools/photos.json          one entry per photo slot
tools/generate-placeholders.mjs
.github/workflows/pages.yml
.nojekyll                  serve files as-is, no Jekyll processing
```

Pages are `<section class="page">` elements shown one at a time; `#portfolio`,
`#services`, `#pricing`, `#about`, `#book` and `#contact` are all deep-linkable and
survive a refresh.
