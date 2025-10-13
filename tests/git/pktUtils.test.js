import { parsePktLines } from '@src/git/pktUtils';

describe('pktUtils', () => {
  describe('parsePktLines', () => {
    it('should return empty if the reader is empty', async () => {
      const stream = new ReadableStream({
        start(controller) {
          // Close stream immediately
          controller.close();
        },
      });

      await expect(parsePktLines(stream.getReader())).resolves.toBeEmpty();
    });
  });
});
