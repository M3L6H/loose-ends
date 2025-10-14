import { parsePktLines } from '@src/git/pktUtils';

describe('pktUtils', () => {
  describe('parsePktLines', () => {
    it('should return empty if the reader is empty', async () => {
      const stream = new ReadableStream({
        start(ctrl) {
          ctrl.close();
        },
      });

      await expect(parsePktLines(stream.getReader())).resolves.toBeEmpty();
    });

    it('should read a line', async () => {
      const data = [
        // 0 0 0 4 t e s t
        Uint8Array.fromHex('3030303474657374'),
      ];
      const stream = new ReadableStream({
        start(ctrl) {
          data.forEach(ctrl.enqueue);
          ctrl.close();
        },
      });

      await expect(parsePktLines(stream.getReader())).resolves.toEqual([
        'test',
      ]);
    });
  });
});
