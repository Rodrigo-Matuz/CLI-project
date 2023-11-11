#!/usr/bin/env tsx

import { Command } from "commander";
const program = new Command();

program.name("ChatGPT CLI").description("CLI to access ChatGPT 4.0 Turbo");

// input example:   gpt Hello
// output:          Hello
program
    .description("Print back the input")
    .argument("<string>", "Text to use as input")
    .action((str) => {
        console.log(str);
    });

// input example:   gpt config --df Hello
// output:          "Hello" as default prompt
program
    .command("config")
    .description("use this command to configure stuff like the default prompt")
    .option("-t, --temperature", "change the temperature (default = 0.7)")
    .action((str, options) => {
        console.log(str, options);
    });

program.parse();
