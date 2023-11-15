#!/usr/bin/env tsx

import { program } from "commander";
import mainGptLoop from "./openai/assistantInteraction";
import OpenAIWrapper, { changeOrSetKey } from "./openai/wrapper";
import chalk from "chalk";

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
    .option("-s, --start", "Start the program")
    .option("-k, --changeSetKey", "Change or set the Open AI API key")
    .parse(process.argv);

const options = program.opts();

if (options.start) {
    handleAnswer("start");
} else if (options.changeSetKey) {
    handleAnswer("changeSetKey");
}
