# README

## Page range syntax

Specify pages using a compact page-range syntax (1-based indexing). Tokens are comma-separated; each token can be a single page, a hyphen range, or an open-ended range. Negative numbers count from the end.


**Accepted forms**

- `N` … single page (e.g. `5`)  
- `A-B` … closed range from A to B (e.g. `1-3`)  
- `A-` … from A to the last page (e.g. `7-`)  
- negative numbers … count from the end (e.g. `-1` = last page, `-3--1` = third-last through last)

**Examples**

- `1-3` → pages 1,2,3  
- `5` → page 5  
- `7-` → page 7 through last page  
- `-1` → last page  
- `1,3-5,7-` → pages 1, 3–5, and 7 through last

> Tip: use comma-separated tokens to combine multiple selections (e.g. `1-2,5,-1`).
