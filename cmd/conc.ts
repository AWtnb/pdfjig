import { Command } from "@cliffy/command";
import { join } from "@std/path";
import { TextLineStream } from "@std/streams";
import { PDFDocument } from "pdf-lib";

const concFiles = async (paths: string[], outname: string) => {
  if (outname.endsWith(".pdf")) {
    outname = outname.substring(0, outname.length - 4);
  }
  const outDoc = await PDFDocument.create();

  for (const path of paths) {
    const data = await Deno.readFile(path);
    const srcDoc = await PDFDocument.load(data);
    const range = srcDoc.getPageIndices();
    const pages = await outDoc.copyPages(srcDoc, range);
    pages.forEach((page) => outDoc.addPage(page));
  }

  const bytes = await outDoc.save();
  const outPath = join(Deno.cwd(), outname + ".pdf");
  await Deno.writeFile(outPath, bytes);
};

export const concCommand = new Command()
  .arguments("[files...:string]")
  .option("-o, --output <file:string>", "output filename", { default: "merged.pdf" })
  .action(async (options, files) => {
    const inputFiles = [...(files || [])];

    if (inputFiles.length === 0 && !Deno.stdin.isTerminal()) {
      console.error("Reading file list from stdin...");

      const lineStream = Deno.stdin.readable.pipeThrough(new TextDecoderStream()).pipeThrough(new TextLineStream());

      for await (const line of lineStream) {
        const trimmed = line.trim();
        if (trimmed) inputFiles.push(trimmed);
      }
    }

    const pdfs = inputFiles.filter((s) => s.endsWith(".pdf"));

    if (pdfs.length < 1) {
      console.error("No pdf files to conc...");
      Deno.exit(1);
    }

    console.log(`conc ${pdfs.length} files...`);
    await concFiles(pdfs, options.output);
  });
