import { PitchforkListMCP } from './index';
import { z } from 'zod';
import {
  filterAlbumsByYear,
  computeAlbumCountsByYear,
  computeAlbumCountsByGenre,
} from './utils';

export async function initializePrompts(agent: PitchforkListMCP) {
  agent.server.registerPrompt(
    'analyze_year_context',
    {
      title: 'Analyze Musical Year Context',
      description: 'Understand what made specific years notable in 2000s music',
      argsSchema: {
        year: z
          .string()
          .regex(/^200[0-9]$/, 'Year must be between 2000 and 2009')
          .describe('Year to analyze (2000-2009)'),
      },
    },
    async ({ year }) => {
      const yearAlbums = filterAlbumsByYear(agent.albumList, year, {
        sortByRank: false,
      });

      return {
        description: `Musical context analysis for ${year}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Analyze the musical significance of ${year} based on these Pitchfork-ranked albums:

${year} Albums in Top 200:
${yearAlbums
  .map((a) => `#${a.rank}. ${a.artist} - ${a.album} [${a.genres.join(', ')}]`)
  .join('\n')}

Analysis Request:
1. What made ${year} notable in music history?
2. What genres/movements were prominent that year?
3. What innovations or breakthroughs happened?
4. How does this year compare to others in the decade?

Use your music knowledge combined with this ranking data to provide context.`,
            },
          },
        ],
      };
    }
  );

  agent.server.registerPrompt(
    '2000s_overview',
    {
      title: 'Analyze 2000s Music Overview',
      description:
        "Get a simple overview of 2000s music trends based on Pitchfork's top 200 albums",
      argsSchema: {},
    },
    async () => {
      const yearCounts = computeAlbumCountsByYear(agent.albumList);
      const genreCounts = computeAlbumCountsByGenre(agent.albumList);

      const topYears = Object.entries(yearCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      const topGenres = Object.entries(genreCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      const topAlbums = agent.albumList.slice(0, 10);

      return {
        description: '2000s music overview analysis',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Analyze the 2000s music decade based on Pitchfork's top 200 albums.

Basic Stats:
- Total albums: ${agent.albumList.length}
- Years covered: 2000-2009

Most Productive Years:
${topYears.map(([year, count]) => `${year}: ${count} albums`).join('\n')}

Most Common Genres:
${topGenres.map(([genre, count]) => `${genre}: ${count} albums`).join('\n')}

Top 10 Albums:
${topAlbums
  .map((a) => `#${a.rank}. ${a.artist} - ${a.album} (${a.year})`)
  .join('\n')}

Questions to Answer:
1. What defined the 2000s music decade according to critics?
2. Which years and genres dominated critical acclaim?
3. What makes these top albums special?

Provide a simple overview of 2000s music culture based on this data.`,
            },
          },
        ],
      };
    }
  );
}
