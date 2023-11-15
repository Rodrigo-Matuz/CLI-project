#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import OpenAIWrapper, { changeOrSetKey } from "./openai/wrapper";
import mainGptLoop from "./openai/assistantInteraction";

async function handleAnswer(option: string) {
    console.clear();
    const chatGPT = new OpenAIWrapper();

    if (option === "start") {
        await mainGptLoop(chatGPT);
    }

    if (option === "changeSetKey") {
        const key = program.opts().key;
        if (key) {
            console.clear();
            console.log(changeOrSetKey(key));
        } else {
            console.log(chalk.red("No key provided. Please provide a key."));
            process.exit();
        }
    } else {
        process.exit();
    }
}

program
    .option("-s, --start", "Start the program", async () => {
        console.clear();
        const chatGPT = new OpenAIWrapper();
        await mainGptLoop(chatGPT);
    })
    .option(
        "-k, --changeSetKey <key>",
        "Change or set the Open AI API key",
        (key) => {
            console.clear();
            if (key) {
                console.log(changeOrSetKey(key));
            } else {
                console.log(
                    chalk.red("No key provided. Please provide a key.")
                );
                process.exit();
            }
        }
    );

program.parse(process.argv);
