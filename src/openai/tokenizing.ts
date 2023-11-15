import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";

export function getNumberOfTokens(text1: string, text2: string): number {
    const encodedTokens1 = cl100k_base.encode(text1);
    const encodedTokens2 = cl100k_base.encode(text2);
    return encodedTokens1.length + encodedTokens2.length;
}
