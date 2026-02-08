# README

## Commands


```
apply-trimbox  <path>      - apply trimbox to each page of a pdf.
conc           [files...]  - concatenate piped pdf files.
extract        <path>      - extract page(s) from pdf file.
insert         <path>      - insert page(s) to a pdf file.
rotate         <path>      - rotate page(s) of a pdf file.
split          <path>      - half-split pages of a pdf.
spread         <path>      - spread page(s) to a pdf file.
swap           <path>      - swap page(s) of a pdf with another file.
trim-margin    <path>      - trim margin of all page of a pdf.
unzip          <path>      - extract odd and even pages of the pdf into separate files.
watermark      <path>      - insert text as watermark on each page of a pdf file.
```

## Page range syntax

`-r`, `--range` Specify pages using a comma-separated list. Supports single pages (`5`), ranges (`1-5`), and open-ended ranges (`10-`). Use negative numbers to count from the end of the document (e.g., `-1` is the last page).


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
