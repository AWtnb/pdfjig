import { Command } from "@cliffy/command";
import { join } from "@std/path";
import { TextLineStream } from "@std/streams";
import { PDFDocument } from "pdf-lib";

const concFiles = async (paths: string[], outname: string): Promise<string> => {
  if (outname.endsWith(".pdf")) {
    outname = outname.substring(0, outname.length - 4);
  }
  const outDoc = await PDFDocument.create();

  for (const path of paths) {
    const data = await Deno.readFile(path);
    const srcDoc = await PDFDocument.load(data);
    const pages = await outDoc.copyPages(srcDoc, srcDoc.getPageIndices());
    pages.forEach((page) => outDoc.addPage(page));
  }

  const bytes = await outDoc.save();
  const outPath = join(Deno.cwd(), outname + ".pdf");
  await Deno.writeFile(outPath, bytes);
  return outPath;
};

export const concCommand = new Command()
  .description("concatenate piped pdf files.")
  .arguments("[files...:string]")
  .option("-o, --output <file:string>", "output filename", {
    default: "conc.pdf",
  })
  .action(async (options, files) => {
    const inputFiles = [...(files || [])];

    if (inputFiles.length === 0 && !Deno.stdin.isTerminal()) {
      const lineStream = Deno.stdin.readable
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream());

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
    const result = await concFiles(pdfs, options.output);

    console.log(`Conced: ${result}`);
  });
