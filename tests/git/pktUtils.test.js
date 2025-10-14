import { parsePktLines } from '@src/git/pktUtils';

describe('pktUtils', () => {
  describe('parsePktLines', () => {
    let data, stream;
    
    beforeEach(() => {
      data = [];
      stream = new ReadableStream({
        start(ctrl) {
          data.forEach(d => ctrl.enqueue(d));
          ctrl.close();
        },
      });
    });

    it('should return empty if the reader is empty', async () => {
      await expect(parsePktLines(stream.getReader())).resolves.toBeEmpty();
    });

    it('should read a line', async () => {
      data = [
        // 0 0 0 8 t e s t
        Uint8Array.fromHex('3030303874657374'),
      ];

      await expect(parsePktLines(stream.getReader())).resolves.toEqual([
        'test',
      ]);
    });
    
    it('should read a line over multiple chunks', async () => {
      data = [
        // 0 0
        Uint8Array.fromHex('3030'),
        // 0 8 t
        Uint8Array.fromHex('303874'),
        // e s
        Uint8Array.fromHex('6573'),
        // t
        Uint8Array.fromHex('74'),
      ];

      await expect(parsePktLines(stream.getReader())).resolves.toEqual([
        'test',
      ]);
    });
  });
});
