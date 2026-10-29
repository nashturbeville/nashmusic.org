// Match ordinary typing against accents, curly apostrophes, and punctuation.
export const searchText = value => String(value ?? '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/['’]/g, '')
  .replace(/[^a-z0-9]+/g, ' ').trim();

export function filterSongs(songs, { query = '', artist = '', genre = '', decade = '' } = {}) {
  const terms = searchText(query).split(/\s+/).filter(Boolean);
  return songs.filter(song => {
    const text = searchText(`${song.title} ${song.artist}`);
    return terms.every(term => text.includes(term)) &&
      (!artist || song.artist === artist) &&
      (!genre || song.genre === genre) &&
      (!decade || song.decade === decade);
  });
}
