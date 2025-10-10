function proxyUrl(url) {
  return `https://corsproxy.io?url=${encodeURIComponent(url)}`;
}

async function clone(repo, pat='') {
  const uploadPackUrl = proxyUrl(`${repo}/info/refs?service=git-upload-pack`);

  const response = await fetch(uploadPackUrl, {
    headers: {
      'Git-Protocol': 'version=2',
    },
  });
    
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }

  const result = await response.text();

  return result;
}

function init() {
  clone('https://github.com/M3L6H/loose-ends.git')
    .then(refs => {
      const textNode = document.createTextNode(refs);
      document.body.appendChild(textNode);
    }).catch(err => {
      const textNode = document.createTextNode(err.message);
      document.body.appendChild(textNode);
    });
}

addEventListener('load', () => init());