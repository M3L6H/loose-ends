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
    const matches = content.matchAll(/([^"']+\.(?:css|js))(?:\?v=PLACEHOLDER)?/g);
    let hasMatches = false;

    for (const match of matches) {
      const fileStr = match[1];
      try {
        const filePath = path.join(path.dirname(file), fileStr);
        const fileBuffer = fs.readFileSync(filePath);
        const hash = crypto.createHash("md5").update(fileBuffer).digest("hex").slice(0, 10);
        content = content.replace(match[0], `${fileStr}?v=${hash}`);
        console.log("Hashed file", fileStr, hash);
        hasMatches = true;
      } catch (error) {
        console.warn("Failed to hash file", filePath, error);
      }
    }

    if (hasMatches) {
      fs.writeFileSync(file, content, "utf8");
      console.log("Busted imports in file", file);
    }
  } catch (error) {
    console.error("Error processing file", file, error.message);
  }
});