# House bills

A page for entering shared house bills and seeing who owes whom, backed by a
Google Sheet so everyone in the house edits the same figures.

Utilities are split in proportion to nights actually slept in the house; one-offs
are split evenly. A billing month runs from the 4th to the 3rd, and the year
covered is 4 Sep 2026 to 3 Sep 2027.

The page is bilingual: the **EN / 中文** switch in the top bar changes every
label, and each person's choice is remembered in their own browser. It changes
wording only — what gets written to the Sheet stays in English (`Energy`,
`Sep-26`, and so on), so one person can work in Chinese and another in English
against the same figures.

Two files:

- `index.html` — the page. Static, no build step, no dependencies.
- `Code.gs` — a small Apps Script that lets the page read and write a Google Sheet.

## Privacy

Nothing personal is in this repository. Housemates' names live in the Sheet and
are edited on the page under **Housekeeping → Housemates**; the address and any
other identifying details appear nowhere.

The page is public, and it has to contain the Apps Script `/exec` URL to reach
the Sheet. So `Code.gs` supports a `PASSPHRASE`: with one set, that URL answers
nothing without it, and the page asks each person for it once per device. Set
one, and share it with the house privately rather than here.

The page also asks search engines not to index it.

## 1. The page is already online

It is served by GitHub Pages from the `main` branch of this repository:

**https://mingyu1998.github.io/house-bills/**

To change it, edit `index.html`, then:

```
git add -A
git commit -m "what changed"
git push
```

Pages rebuilds within a minute or so. If you don't see the change, it is almost
always the browser cache — reload with Ctrl+F5.

The first time the page reaches an empty Sheet, it asks who is in the house.

## 2. The Sheet and its script

Only needed if you ever rebuild or move the Sheet.

1. Create a Google Sheet (a real one — if it came from an uploaded `.xlsx`, use
   File → Save as Google Sheets first).
2. Extensions → Apps Script. Delete whatever is in the editor and paste in the
   contents of `Code.gs`. If you started from script.google.com instead, set
   `SHEET_ID` at the top to the id from the Sheet's URL.
3. Set `PASSPHRASE` at the top. Save.
4. Choose `checkSetup` in the function dropdown and press Run. The log should
   name your spreadsheet and say the passphrase is set.
5. Deploy → New deployment → gear icon → Web app.
   - Execute as: **Me**.
   - Who has access: **Anyone**.
6. Deploy, then authorise when Google asks. It will warn that the script is
   unverified, which is expected for your own script: choose Advanced, then
   *Go to (project name)*.
7. Copy the **Web app URL**, which ends in `/exec`, into `const API_URL` in
   `index.html`, then commit and push.

The Sheet gains two tabs, `Costs` and `Nights`, which the page keeps in step.
File → Version history in the Sheet shows who changed what and when.

After editing `Code.gs` later, use Deploy → Manage deployments → edit → New
version, so the `/exec` URL stays the same. Saving alone does not change what
the URL serves.

## Notes

- Whoever saves last wins. The page re-reads the Sheet when you come back to the
  tab, but if two of you are typing at the same moment press **Reload from the
  sheet** first.
- **Download CSV** gives you a file you can paste into an Excel workbook.
- **Copy costs to next month** carries the list of items and who normally pays
  them, not the amounts.
