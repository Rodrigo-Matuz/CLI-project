import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";

export function getNumberOfTokens(text: string): number {
    const encodedTokens = cl100k_base.encode(text);
    return encodedTokens.length;
}
