import fs from 'fs';

const path = '/Users/yashjaiswal/Downloads/AI Build Project/TradeZilla/src/pages/Charts.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the suffixes array in both places it appears
const wrongSuffixes = "['-mainbg', '-bg', '-upper', '-middle', '-lower', '-ma', '-border', '-histogram', '-signal', '-P', '-S1/R1', '-S2/R2', '-S3/R3', '-S4/R4', '-S5/R5']";
const rightSuffixes = "['-mainbg', '-bg', '-upper', '-middle', '-lower', '-ma', '-border', '-histogram', '-signal', '-P', '-S1', '-R1', '-S2', '-R2', '-S3', '-R3', '-S4', '-R4', '-S5', '-R5']";

content = content.replace(wrongSuffixes, rightSuffixes);
content = content.replace(wrongSuffixes, rightSuffixes); // Try replacing twice in case it doesn't do global

fs.writeFileSync(path, content, 'utf8');
console.log("update_charts4 done");
