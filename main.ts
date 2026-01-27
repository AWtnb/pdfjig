import { Command } from "@cliffy/command";
import { concCommand } from "./cmd/conc.ts";

await new Command().name("pdfjig").description("jig for PDF handling.").command("conc", concCommand).parse(Deno.args);
