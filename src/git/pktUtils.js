/**
 * Parses the git pkt-line format from a ReadableStream reader.
 *
 * @param {ReadableStreamDefaultReader} reader - byte stream reader
 *
 * @returns {string[]} Array of lines
 */
export async function parsePktLines(reader) {
  const lines = [];
  let len = null;
  let s = e = 0;
  const curr = new Uint8Array(0xffff);
  
  while (true) {
    const { done, value } = await reader.read();
    
    console.log(`value: ${value}`);

    if (done) break;

    for (let i = 0; i < value.length;) {
      const chunk = value.subarray(i, i + e - s + (len ?? PKT_SIZE_BYTE_COUNT));
      curr.set(chunk, e);
      e += chunk.length;
      i += chunk.length;

      if (len === null) {
        console.log('parsing len');
        if (e - s < PKT_SIZE_BYTE_COUNT) continue;
        const d = curr.subarray(s, s + PKT_SIZE_BYTE_COUNT);
        s += PKT_SIZE_BYTE_COUNT;
        len = parseInt(td.decode(d), HEX_BASE) - PKT_SIZE_BYTE_COUNT;
        console.log(`len: ${len}`);
      }

      if (len > 0) {
        console.log('parsing data');
        if (e - s < len) continue;
    
        const d = curr.subarray(s, s + len);
        s += len;
        lines.push(td.decode(d).trim());
        console.log(`line: ${lines[lines.length - 1]}`);
      }

      // Flush
      const d = curr.subarray(s, e);
      curr.set(d, 0);
      e -= s;
      s = 0;
      len = null;
      console.log(`flush. curr: ${curr}`);
    }
  }
  
  console.log('done');

  return lines;
}