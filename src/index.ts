import { McpAgent } from 'agents/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Album } from './types';
import { initializeTools } from './tools';
import { initializePrompts } from './prompts';
import { initializeResources } from './resources';

export class PitchforkListMCP extends McpAgent<Env> {
  albumList: Array<Album> = [];
  server = new McpServer(
    {
      name: 'pitchfork-list',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: { listChanged: true },
        prompts: { listChanged: true },
        resources: { listChanged: true },
      },
      instructions: `Provides access to Pitchfork's "200 Best Albums of the 2000s" ranked list. Search, filter, and explore albums by artist, title, year (2000-2009), rank position, or genre. All albums include rank, artist, title, release year, and genre tags.`,
    }
  );

  async init() {
    try {
      const albums = await this.env.KV.get<Array<Album>>('albums', 'json');

      if (!albums) {
        throw new Error('Albums data not found in KV namespace');
      }

      this.albumList = albums.sort((a, b) => a.rank - b.rank);
      await initializeTools(this);
      await initializePrompts(this);
      await initializeResources(this);
    } catch (error) {
      console.error('Failed to load albums from KV:', error);
      throw error;
    }
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === '/sse' || url.pathname === '/sse/message') {
      return PitchforkListMCP.serveSSE('/sse').fetch(request, env, ctx);
    }

    if (url.pathname === '/mcp') {
      return PitchforkListMCP.serve('/mcp').fetch(request, env, ctx);
    }

    return new Response('Not found', { status: 404 });
  },
};
