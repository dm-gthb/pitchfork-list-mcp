import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { type PitchforkListMCP } from './index';

export async function initializeTools(agent: PitchforkListMCP) {
  agent.server.registerTool(
    'list_albums',
    {
      title: 'List all music albums',
      description: 'Returns all 200 albums sorted by rank (1-200).',
    },
    async () => {
      return {
        content: [createText(agent.albumList)],
      };
    }
  );

  agent.server.registerTool(
    'list_genres',
    {
      title: 'List all genres',
      description: 'Returns all unique genres sorted alphabetically.',
    },
    async () => {
      const uniqueGenres = [
        ...new Set(agent.albumList.map((album) => album.genres).flat()),
      ].sort((a, b) => a.localeCompare(b));

      return {
        content: [createText(uniqueGenres)],
      };
    }
  );

  agent.server.registerTool(
    'search_albums',
    {
      title: 'Search albums',
      description:
        'Search albums by artist or title using case-insensitive partial matching.',
      inputSchema: {
        query: z
          .string()
          .min(1, 'Search query cannot be empty')
          .describe(
            'Search term to match against artist names or album titles (case-insensitive)'
          ),
      },
    },
    async ({ query }) => {
      const searchTerm = query.trim().toLowerCase();
      const results = agent.albumList.filter(
        (album) =>
          album.artist.toLowerCase().includes(searchTerm) ||
          album.album.toLowerCase().includes(searchTerm)
      );

      return {
        content: [createText(results)],
      };
    }
  );

  agent.server.registerTool(
    'get_album_by_rank',
    {
      title: 'Get album by rank',
      description: 'Find a specific album by its rank position (1-200).',
      inputSchema: {
        rank: z
          .number()
          .int()
          .min(1, 'Rank must be between 1 and 200')
          .max(200, 'Rank must be between 1 and 200')
          .describe('The rank position of the album (1-200)'),
      },
    },
    async ({ rank }) => {
      const album = agent.albumList.find((album) => album.rank === rank);

      if (!album) {
        return {
          content: [createText(`No album found at rank ${rank}`)],
        };
      }

      return {
        content: [createText(album)],
      };
    }
  );

  agent.server.registerTool(
    'get_albums_by_year',
    {
      title: 'Get albums by year',
      description:
        'Find all albums released in a specific year (2000-2009), sorted by rank.',
      inputSchema: {
        year: z
          .string()
          .regex(/^200[0-9]$/, 'Year must be between 2000 and 2009')
          .describe('The release year to filter by (2000-2009, e.g., "2005")'),
      },
    },
    async ({ year }) => {
      const results = agent.albumList
        .filter((album) => album.year === year)
        .sort((a, b) => a.rank - b.rank);

      if (results.length === 0) {
        return {
          content: [createText(`No albums found for year ${year}`)],
        };
      }

      return {
        content: [createText(results)],
      };
    }
  );

  agent.server.registerTool(
    'get_albums_by_artist',
    {
      title: 'Get albums by artist',
      description:
        'Find all albums by a specific artist (case-insensitive exact match), sorted by rank.',
      inputSchema: {
        artist: z
          .string()
          .min(1, 'Artist name cannot be empty')
          .describe('The artist name to search for (case-insensitive)'),
      },
    },
    async ({ artist }) => {
      const searchArtist = artist.toLowerCase();
      const results = agent.albumList
        .filter((album) => album.artist.toLowerCase() === searchArtist)
        .sort((a, b) => a.rank - b.rank);

      if (results.length === 0) {
        return {
          content: [createText(`No albums found for artist "${artist}"`)],
        };
      }

      return {
        content: [createText(results)],
      };
    }
  );

  agent.server.registerTool(
    'get_albums_by_genre',
    {
      title: 'Get albums by genre',
      description:
        'Find all albums that include a specific genre/tag (case-insensitive), sorted by rank.',
      inputSchema: {
        genre: z
          .string()
          .min(1, 'Genre cannot be empty')
          .describe('The genre/tag to filter by (case-insensitive)'),
      },
    },
    async ({ genre }) => {
      const searchGenre = genre.toLowerCase();
      const results = agent.albumList
        .filter((album) =>
          album.genres.some((g) => g.toLowerCase().includes(searchGenre))
        )
        .sort((a, b) => a.rank - b.rank);

      if (results.length === 0) {
        return {
          content: [createText(`No albums found for genre "${genre}"`)],
        };
      }

      return {
        content: [createText(results)],
      };
    }
  );

  agent.server.registerTool(
    'get_year_statistics',
    {
      title: 'Get album statistics by year',
      description:
        'Returns the count of albums for each year (2000-2009), sorted by count or year.',
      inputSchema: {
        sortBy: z
          .enum(['count', 'year'])
          .optional()
          .describe(
            'Sort by album count (descending) or year (ascending). Defaults to count.'
          ),
      },
    },
    async ({ sortBy = 'count' }) => {
      const yearCounts: Record<string, number> = {};

      agent.albumList.forEach((album) => {
        const year = album.year || 'unknown';
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      });

      const entries = Object.entries(yearCounts);

      if (sortBy === 'year') {
        entries.sort(([a], [b]) => a.localeCompare(b));
      } else {
        entries.sort(([, a], [, b]) => b - a);
      }

      const results = entries.map(([year, count]) => ({
        year,
        count,
        percentage:
          Math.round((count / agent.albumList.length) * 100 * 10) / 10,
      }));

      return {
        content: [createText(results)],
      };
    }
  );

  agent.server.registerTool(
    'get_genre_statistics',
    {
      title: 'Get album statistics by genre',
      description:
        'Returns the count of albums for each genre/tag, sorted by frequency or alphabetically.',
      inputSchema: {
        sortBy: z
          .enum(['count', 'genre'])
          .optional()
          .describe(
            'Sort by album count (descending) or genre name (ascending). Defaults to count.'
          ),
        minCount: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe(
            'Only show genres that appear on at least this many albums. Defaults to 1.'
          ),
      },
    },
    async ({ sortBy = 'count', minCount = 1 }) => {
      const genreCounts: Record<string, number> = {};

      agent.albumList.forEach((album) => {
        album.genres.forEach((genre) => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      });

      let entries = Object.entries(genreCounts).filter(
        ([, count]) => count >= minCount
      );

      if (sortBy === 'genre') {
        entries.sort(([a], [b]) => a.localeCompare(b));
      } else {
        entries.sort(([, a], [, b]) => b - a);
      }

      const results = entries.map(([genre, count]) => ({
        genre,
        count,
        percentage:
          Math.round((count / agent.albumList.length) * 100 * 10) / 10,
      }));

      return {
        content: [createText(results)],
      };
    }
  );

  agent.server.registerTool(
    'get_artist_statistics',
    {
      title: 'Get artist statistics',
      description:
        'Returns statistics about artists, including album counts and distribution patterns.',
      inputSchema: {
        sortBy: z
          .enum(['count', 'artist'])
          .optional()
          .describe(
            'Sort by album count (descending) or artist name (ascending). Defaults to count.'
          ),
        minAlbums: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe(
            'Only show artists with at least this many albums. Defaults to 1.'
          ),
        showSummary: z
          .boolean()
          .optional()
          .describe(
            'Include summary statistics about artist distribution. Defaults to true.'
          ),
      },
    },
    async ({ sortBy = 'count', minAlbums = 1, showSummary = true }) => {
      const artistCounts: Record<string, number> = {};

      agent.albumList.forEach((album) => {
        artistCounts[album.artist] = (artistCounts[album.artist] || 0) + 1;
      });

      let entries = Object.entries(artistCounts).filter(
        ([, count]) => count >= minAlbums
      );

      if (sortBy === 'artist') {
        entries.sort(([a], [b]) => a.localeCompare(b));
      } else {
        entries.sort(([, a], [, b]) => b - a);
      }

      const artists = entries.map(([artist, count]) => ({
        artist,
        albumCount: count,
        percentage:
          Math.round((count / agent.albumList.length) * 100 * 10) / 10,
      }));

      const result: {
        artists: Array<{
          artist: string;
          albumCount: number;
          percentage: number;
        }>;
        summary?: {
          totalArtists: number;
          artistsWithMultipleAlbums: number;
          averageAlbumsPerArtist: number;
          albumDistribution: Array<{
            albumsPerArtist: number;
            numberOfArtists: number;
          }>;
        };
      } = { artists };

      if (showSummary) {
        const totalArtists = Object.keys(artistCounts).length;
        const multipleAlbumArtists = entries.filter(
          ([, count]) => count > 1
        ).length;
        const albumDistribution: Record<number, number> = {};

        entries.forEach(([, count]) => {
          albumDistribution[count] = (albumDistribution[count] || 0) + 1;
        });

        result.summary = {
          totalArtists,
          artistsWithMultipleAlbums: multipleAlbumArtists,
          averageAlbumsPerArtist:
            Math.round((agent.albumList.length / totalArtists) * 10) / 10,
          albumDistribution: Object.entries(albumDistribution)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([albumCount, artistCount]) => ({
              albumsPerArtist: Number(albumCount),
              numberOfArtists: artistCount,
            })),
        };
      }

      return {
        content: [createText(result)],
      };
    }
  );
}

function createText(text: unknown): CallToolResult['content'][number] {
  if (typeof text === 'string') {
    return { type: 'text', text };
  } else {
    return { type: 'text', text: JSON.stringify(text) };
  }
}
