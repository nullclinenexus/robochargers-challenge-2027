# First Annual RoboChargers Competition 2026–2027

The competition page and student guide for the RoboChargers laser-maze turret
competition (Spring 2027). Published in the NullclineNexus build library at
https://build.nullclinenexus.com/robochargers-2026-27/

A static site with no build step. Everything in `public/` is the site.

```
robochargers-2026-27/
  README.md                 this file (not part of the site)
  public/
    index.html              competition page (the home page)
    site.css                its styles
    practice.js             practice-map generator (one ordinary script)
    media/                  images, posters and the three demo videos
    student-guide/
      index.html            the student guide (one self-contained file)
    favicon.svg
    404.html                shown for addresses that do not exist
    _headers                two security headers, read by Cloudflare Pages
```

## Deploy

This repository is its own Cloudflare Pages project, connected to GitHub:

- Project name: `robochargers-2026-27`
- Production branch: `main`
- Framework preset: None
- Build command: blank
- Build output directory: `public`

Every push to `main` redeploys it. No custom domain is needed: the build
library at build.nullclinenexus.com serves this project at
`/robochargers-2026-27/`. Its entry lives in the `nullclinenexus-web`
repository, in `build/public/builds.js`, and points at this project's
`*.pages.dev` address.

## Working under /robochargers-2026-27/

The site is served from a folder of the library, not from the root of a
domain, so:

- **Keep links relative**, as they are now (`site.css`, `media/turret.webp`,
  `student-guide/index.html`, `../index.html`). A link starting with `/` would
  point at the library instead.
- **`404.html` is the exception.** It can be shown at any depth, so its links
  spell out the full folder: `/robochargers-2026-27/…`.
- **Back to the library:** the footers of the competition page and the student
  guide have a **Build library** link (`href="/"`).
- Visiting the `*.pages.dev` address directly works too, except the 404 page's
  links, which assume the library folder.

## Editing

- **Competition page:** `public/index.html` and `public/site.css`. The
  practice-map generator is `public/practice.js`.
- **Student guide:** `public/student-guide/index.html` is a single file with its
  text, styles, drawings and one photo inside it. Each guide page is a
  `<section class="view">`; the top navigation and the "On this page" list are
  plain links to the section and heading ids. This is the newest version of the
  guide (the "RoboChargers Student Guide" artifact, including the review
  changes), with its links pointed at this site's competition page.

## Preview on your own computer

Double-click `public/index.html`. The page, the practice-map generator and the
links to and from the student guide all work straight from disk; those links
name `index.html` explicitly for that reason. On Cloudflare Pages the address
is tidied to the short form automatically.

To preview through a small local server instead:

```
cd public
python -m http.server 8000
```

Then open http://localhost:8000. Stop it with Ctrl+C.

## History

The site began on another host. Before moving here, the competition page
gained a Student guide button and section, a favicon, an Arduino-only kit list
and run rules, a "build it to come apart" note, a single-file practice-map
generator with map codes and PNG download, a one-line top bar, and a footer
note that RoboChargers is a student organization and the competition is a
student-faculty initiative not officially endorsed by the college. For the
build library, the guide was updated to its newest version, every link to the
old host now points at this site, the 404 page's links carry the library
folder, and both footers link back to the library.
