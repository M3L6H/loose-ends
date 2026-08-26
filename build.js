import fs from "fs";
import crypto from "crypto";

const htmlFile = "src/index.html";

try {
  let htmlContent = fs.readFileSync(htmlFile, "utf8");
  
  for (const match of htmlContent.matchAll(/([^"']+)\?v=PLACEHOLDER/g)) {
      const file = match[1];
      const fileBuffer = fs.readFileSync(`src/${file}`);
      const hash = crypto.createHash("md5").update(fileBuffer).digest("hex").slice(0, 10);
      htmlContent = htmlContent.replace(`${file}?v=PLACEHOLDER`, `${file}?v=${hash}`);
      console.log("Hashed file", file, hash);
  }

  fs.writeFileSync(htmlFile, htmlContent, "utf8");
} catch (error) {
  console.error("Error processing files", error.message);
}