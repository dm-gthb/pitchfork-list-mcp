import { PitchforkListMCP } from '.';
import { extractUniqueGenres } from './utils';

export async function initializeResources(agent: PitchforkListMCP) {
  agent.server.registerResource(
    'genres',
    'pitchfork-list://genres',
    {
      description: 'All genres in the Pitchfork 2000s list',
    },
    async (uri: URL) => {
      const genres = extractUniqueGenres(agent.albumList);
      return {
        contents: [
          {
            mimeType: 'text/plain',
            uri: uri.toString(),
            text: genres.join('\n'),
          },
        ],
      };
    }
  );
}
