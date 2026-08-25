# Fjord Agne - YouTube Analytics Portfolio

A dependency-free, two-page portfolio built for YouTube analytics and optimization roles. The site uses semantic HTML, modern CSS, a small vanilla JavaScript file, supplied YouTube Studio evidence, and supplied creative work. No metric or result has been fabricated.

## Current publication status

The site is a private beta and remains `noindex, nofollow`. Verified analytics evidence and creative assets are integrated, but the factual and privacy checks below must be completed before publication. Contact links, the real PDF CV, and verified employer/date/education details are still unavailable.

## File structure

```text
.
|-- index.html                    Main portfolio
|-- cv.html                       English HTML CV
|-- styles/
|   |-- main.css                  Shared design and responsive styles
|   `-- print.css                 A4-oriented CV print styles
|-- scripts/
|   `-- main.js                   Image dialog, optional PDF, and print handling
|-- assets/
|   |-- Fjord_Agne_CV_EN.pdf      Add the real English CV here
|   |-- analytics/                Public, privacy-cropped Studio evidence
|   |-- og-cover.svg              Social sharing artwork
|   `-- work/                     Six canonical creative assets
|       `-- README.md             Asset-specific instructions
|-- favicon.svg
|-- .gitignore                    Excludes confidential analytics sources
|-- .nojekyll                     Prevents Jekyll processing
|-- .github/workflows/deploy.yml  GitHub Pages deployment
`-- README.md
```

## Run locally

The pages can be opened directly, but a local server is recommended because the optional PDF check uses `fetch`.

From this directory, use one of these commands:

```powershell
py -m http.server 8000
```

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000/`. No install or build step is required.

## Edit name and contact details

The name appears in `index.html`, `cv.html`, `favicon.svg`, and `assets/og-cover.svg`.

Contact links are grouped in clearly marked comment blocks near the bottom of `index.html` and in the CV sidebar in `cv.html`. They remain hidden until verified values are supplied.

```html
<!-- Add a verified mailto href and remove hidden before publication. -->
<a data-contact-link="email" hidden>Email</a>
```

For each page, add the real `href` and remove `hidden`. Use `mailto:YOUR_VERIFIED_EMAIL` for email. For LinkedIn, use the complete verified `https://` profile URL, add `target="_blank"`, and keep `rel="me noopener noreferrer"`. Writing the real email address as the visible link text also makes the printed CV useful. No JavaScript change is needed.

## Add the English CV PDF

Place the real file at:

```text
assets/Fjord_Agne_CV_EN.pdf
```

The download control on `cv.html` checks that the file exists. It becomes active automatically when the real PDF is present and remains unavailable without creating a broken link when it is absent.

The HTML CV remains readable and printable without the PDF. Use the **Print this page** control to inspect the print layout; the dedicated stylesheet formats it for A4 output.

## Evidence asset map

The homepage references external image files so evidence can be replaced without changing the page structure. Only privacy-cropped, approved derivatives belong in `assets/analytics/`.

| Public analytics file | Public use |
| --- | --- |
| `assets/analytics/channel-overview.png` | Channel views and watch time |
| `assets/analytics/channel-reach.png` | Channel impressions and overall CTR |
| `assets/analytics/long-video-overview.png` | Long upload B: views, watch hours, subscribers gained |
| `assets/analytics/long-video-reach.png` | Long upload A: impressions, CTR, views, unique viewers |
| `assets/analytics/short-overview.png` | Breakout Short views and subscribers gained |
| `assets/analytics/short-engagement.png` | Breakout Short engagement metrics |
| `assets/analytics/content-formats.png` | Approved Short publishing row |
| `assets/analytics/content-live.png` | Approved live-content inventory |

Long upload A and long upload B are separate videos. Upload A supports `23.5K` views, `11.1K` impressions, and `4.5%` CTR. Upload B supports `21.9K` views, `251.0` watch hours, and `+240` subscribers.

| Public creative file | Format |
| --- | --- |
| `assets/work/long-openai.png` | Horizontal long-form |
| `assets/work/long-hacking-gadgets.png` | Horizontal long-form |
| `assets/work/long-hacked.png` | Horizontal long-form |
| `assets/work/long-editorial-investigation.png` | Horizontal long-form |
| `assets/work/short-linkedin.png` | Vertical 9:16 short-form |
| `assets/work/short-spygram.png` | Vertical 9:16 short-form |

`index.html` references these six canonical files. Keep explicit image dimensions, lazy loading below the fold, factual captions, and descriptive alt text when replacing an asset.

## Confidential source handling

Confidential analytics originals must be stored outside the GitHub repository. During this cleanup, the 11 source captures were moved to the sibling local directory `../Fjord Agne Private Sources/raw-analytics/`. Back up that private directory separately; do not copy it into the public repository.

`.gitignore` excludes `assets/raw-analytics/` as a guard against future accidental additions. This checkout was not a Git repository during cleanup, so no tracked files required removal. If another Git checkout already tracks that directory, `.gitignore` is not enough. Remove it from tracking before any public push:

```powershell
git rm -r --cached assets/raw-analytics/
git commit -m "Remove confidential analytics sources"
```

Only redacted, approved screenshots should ever be committed to `assets/analytics/`.

## Production privacy pass

- [ ] Confirm no revenue field or value is visible in any public screenshot.
- [ ] Recheck temporary or time-sensitive metrics immediately before launch.
- [ ] Redact client, customer, member, subscriber, channel, and viewer details wherever permission or context requires it.
- [ ] Confirm permission to display every analytics screenshot and creative asset.
- [ ] Replace beta crops with cleaner approved exports if they become available.
- [ ] Keep confidential originals outside the repository and verify that every `index.html` analytics path points to `assets/analytics/`.

## Factual validation

The public copy is written around supplied responsibilities, methodology, and working areas. These items still require owner verification or real data:

- Add verified email and LinkedIn links to both HTML contact blocks.
- Add `assets/Fjord_Agne_CV_EN.pdf`.
- Decide whether verified employer/client names, role titles, and dates can be shown on `cv.html`.
- Fill and unhide the source templates for Languages and Education only with verified details.
- Confirm the cybersecurity experience wording accurately reflects the work performed.
- Confirm every tool and format listed matches hands-on experience.
- Confirm the supplied reporting period and every displayed metric remain approved for publication.
- Confirm the screenshot and creative-work permissions in the production privacy pass.
- Replace the commented canonical URL examples after the final Pages URL is known.
- Export `assets/og-cover.svg` to a 1200 x 630 PNG or JPEG if a target social platform does not accept SVG previews, then update the meta tags.

Hidden contact templates and source comments are intentionally not visible to site visitors. Public performance claims are limited to the approved Studio evidence and retain upload-level context where required.

## Metadata and URLs

Both pages include titles, descriptions, robots metadata, Open Graph tags, Twitter card metadata, a favicon, and theme color. The site uses repository-relative paths, so it works from a GitHub Pages project subdirectory.

The pages deliberately use `noindex, nofollow` while factual contact details, the PDF, and publication/privacy signoff remain incomplete. Change both robots meta tags to `index, follow` only after the **Before sending to recruiters** checklist is complete.

After deployment, add absolute canonical links to the `<head>` of each page using the documented comments. Social preview image URLs are more reliable when absolute; update them at the same time if required by the platform being tested.

## Deploy with GitHub Pages

The workflow at `.github/workflows/deploy.yml` deploys the repository root whenever `main` is pushed. In GitHub repository settings, Pages must use **GitHub Actions** as its source.

### GitHub CLI route

After Git and GitHub CLI are installed and a terminal has been reopened:

```powershell
git init
git add .
git commit -m "Build YouTube analytics portfolio"
git branch -M main
gh auth login
gh repo create youtube-analytics-portfolio --public --source=. --remote=origin --push
gh api --method POST repos/{owner}/{repo}/pages -f build_type=workflow
gh workflow run deploy.yml
gh run watch
```

If the Pages API reports that the site already exists, continue with `gh workflow run deploy.yml`.

### Manual GitHub route

1. Create an empty public repository named `youtube-analytics-portfolio` on GitHub. Do not add a remote README or license.
2. Run the commands below, replacing `USERNAME`.
3. Open **Settings > Pages** in the repository and choose **GitHub Actions**.
4. Open **Actions**, select the deploy workflow, and run it if the initial push occurred before Pages was enabled.

```powershell
git init
git add .
git commit -m "Build YouTube analytics portfolio"
git branch -M main
git remote add origin https://github.com/USERNAME/youtube-analytics-portfolio.git
git push -u origin main
```

The expected URL is:

```text
https://USERNAME.github.io/youtube-analytics-portfolio/
```

Verify it from Windows with:

```powershell
curl.exe -I https://USERNAME.github.io/youtube-analytics-portfolio/
```

## Update the deployed site

Every push to `main` starts a new Pages deployment:

```powershell
git add .
git commit -m "Update portfolio content"
git push
```

Monitor the deployment in the repository's **Actions** tab. GitHub Pages may take a few minutes to refresh after a successful run.

## Before sending to recruiters

- [ ] Verify every professional claim and working-area statement.
- [ ] Add the real English CV PDF.
- [ ] Add verified email and LinkedIn links.
- [ ] Complete the production privacy pass above.
- [ ] Reconfirm every displayed metric against its mapped source screenshot.
- [ ] Test the homepage and CV at 375 px and desktop widths.
- [ ] Test all navigation and contact links with a keyboard.
- [ ] Test the PDF download link.
- [ ] Inspect the CV print preview on A4 paper.
- [ ] Proofread all English copy.
- [ ] Confirm the canonical and social preview URLs.
- [ ] Verify the final GitHub Pages URL returns HTTP 200.
