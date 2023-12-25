#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import OpenAIWrapper, { changeOrSetKey } from "./ai/wrapper";
import mainGptLoop from "./ai/assistantInteraction";
import { getForeignKeyDetails } from "../prisma/sql";

program
    .option("-s, --start", "Start the program", async () => {
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
    )
    .option(
        "-vc, --voiceChat",
        "Start the program but with voice chat enabled",
        async () => {
            console.clear();
            const chatGPT = new OpenAIWrapper();
            await mainGptLoop(chatGPT);
        }
    );

program.parse(process.argv);
