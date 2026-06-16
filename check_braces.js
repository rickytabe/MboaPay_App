const fs = require('fs');
const content = fs.readFileSync('c:\\PawaPay-Hackathon\\MboaPay_App\\context\\AppContext.tsx', 'utf8');

let braceCount = 0;
let lineNum = 1;

for (let i = 0; i < content.length; i++) {
  if (content[i] === '\n') lineNum++;
  if (content[i] === '{') braceCount++;
  if (content[i] === '}') braceCount--;
  if (braceCount < 0) {
    console.log(`Unmatched closing brace at line ${lineNum}`);
    process.exit(1);
  }
}

console.log(`Final brace count: ${braceCount}`);
if (braceCount > 0) {
  console.log('Missing closing brace(s)!');
}
