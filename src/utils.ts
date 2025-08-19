import type { Album } from './types';

export function extractUniqueGenres(albums: Array<Album>): Array<string> {
  const genres = [...new Set(albums.map((album) => album.genres).flat())];
  return genres.sort((a, b) => a.localeCompare(b));
}

export function filterAlbumsByYear(
  albums: Array<Album>,
  year: string,
  options: { sortByRank?: boolean } = {}
): Array<Album> {
  const { sortByRank = false } = options;
  const filtered = albums.filter((album) => album.year === year);
  return sortByRank ? filtered.sort((a, b) => a.rank - b.rank) : filtered;
}

export function computeAlbumCountsByYear(
  albums: Array<Album>
): Record<string, number> {
  const yearCounts: Record<string, number> = {};
  albums.forEach((album) => {
    const year = album.year || 'unknown';
    yearCounts[year] = (yearCounts[year] || 0) + 1;
  });
  return yearCounts;
}

export function computeAlbumCountsByGenre(
  albums: Array<Album>
): Record<string, number> {
  const genreCounts: Record<string, number> = {};
  albums.forEach((album) => {
    album.genres.forEach((genre) => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
  });
  return genreCounts;
}

export function computeAlbumCountsByArtist(
  albums: Array<Album>
): Record<string, number> {
  const artistCounts: Record<string, number> = {};
  albums.forEach((album) => {
    artistCounts[album.artist] = (artistCounts[album.artist] || 0) + 1;
  });
  return artistCounts;
}
