## Pitchfork List MCP Server

An MCP server for music discovery, based on Pitchfork’s critically acclaimed Top 200 Albums of the 2000s.

## Features

- **Curated dataset**: 200 albums with rank, artist, title, year (2000–2009), and genre tags
- **MCP tools**: search by text, filter by year/genre/artist/rank, and compute stats
- **Built-in prompts**: decade overview and year-specific context
- **Resource endpoint**: quick access to the complete genre list as plain text
- **Cloudflare-native**: Workers + Durable Object `McpAgent` + Workers KV

## Available tools

- `list_albums`: all 200 albums sorted by rank (1–200)
- `list_genres`: unique genres
- `search_albums(query)`: case-insensitive search by artist/title
- `get_album_by_rank(rank)`: album at a specific rank
- `get_albums_by_year(year)`: albums from a year (2000–2009)
- `get_albums_by_artist(artist)`: exact artist match
- `get_albums_by_genre(genre)`: albums including a genre/tag
- `get_year_statistics(sortBy?)`: counts per year
- `get_genre_statistics(sortBy?, minCount?)`: counts per genre
- `get_artist_statistics(sortBy?, minAlbums?, showSummary?)`: artist distribution

## Prompts and resources

- Prompts
  - `analyze_year_context(year)`: context for a specific year
  - `2000s_overview()`: decade overview from the dataset
- Resources
  - `genres`: plain-text list of all genres

## Example usage

- **Search and filter**

  - "Search albums for Radiohead"
  - "Show albums from 2005"
  - "Find albums with genre noise pop"
  - "What album is at rank 37?"

- **Stats and summaries**

  - "Which year has the most albums?"
  - "Show genre counts sorted by count"
  - "Only show genres that appear on at least 5 albums"
  - "Which artists appear more than once?"

- **Exploration**

  - "List all genres"
  - "Show the top 10 albums"

- **Deep-dive prompts**
  - "Give me an overview of 2000s music based on this list"
  - "Analyze the year 2007 in music using the dataset"

## Connect an MCP client

https://pitchfork-list-mcp-server.dmamonov.workers.dev/

```json
{
  "mcpServers": {
    "pitchfork-list": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://pitchfork-list-mcp-server.dmamonov.workers.dev/sse"
      ]
    }
  }
}
```

## Credits

- Dataset derived from Pitchfork’s “200 Best Albums of the 2000s”. This project is for educational and hobby purposes.
