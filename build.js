const fs = require('fs');
const crypto = require('crypto');

const htmlFile = 'src/index.html';
const jsFile = 'src/index.js';

try {
  const fileBuffer = fs.readFileSync(jsFile);
  const hash = crypto.createHash('md5').update(fileBuffer).digest('hex').slice(0, 10);

  const htmlContent = fs.readFileSync(htmlFile, 'utf8');

  const updatedHtml = htmlContent.replace(/\?v=PLACEHOLDER/g, `?v=${hash}`);

  // 4. Save the updated HTML file
  fs.writeFileSync(htmlFile, updatedHtml, 'utf8');
  console.log(`✅ Success! Cache busted. index.js hash is now: ${hash}`);
} catch (error) {
  console.error('❌ Error processing files:', error.message);
}