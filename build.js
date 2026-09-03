import crypto from "crypto";
import fs from "fs";
import path from "path";

const SRC_DIR = './src';

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

getFiles(SRC_DIR).forEach(file => {
  try {
    let content = fs.readFileSync(file, "utf8");
    const matches = content.matchAll(/([^"']+\.js)(?:\?v=PLACEHOLDER)?/g);

    for (const match of matches) {
      const fileStr = match[1];
      const fileBuffer = fs.readFileSync(path.join(path.dirname(file), fileStr));
      const hash = crypto.createHash("md5").update(fileBuffer).digest("hex").slice(0, 10);
      content = content.replace(match[0], `${fileStr}?v=${hash}`);
      console.log("Hashed file", fileStr, hash);
    }

    if (matches.length > 0) {
      fs.writeFileSync(file, content, "utf8");
      console.log("Busted imports in file", file);
    }
  } catch (error) {
    console.error("Error processing file", file, error.message);
  }
});