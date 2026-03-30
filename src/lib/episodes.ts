import Parser from 'rss-parser';

export interface Episode {
  title: string;
  slug: string;
  description: string;
  contentHtml: string;
  pubDate: Date;
  duration: string;
  audioUrl: string;
  episodeNumber?: number;
  season: number;
  episodeType: 'full' | 'trailer' | 'bonus';
  explicit: boolean;
}

type TransistorItem = {
  title?: string;
  contentSnippet?: string;
  content?: string;
  isoDate?: string;
  enclosure?: { url?: string };
  itunes?: {
    duration?: string;
    episode?: string;
    season?: string;
    episodeType?: string;
    explicit?: string;
  };
  guid?: string;
  link?: string;
};

const RSS_URL = 'https://feeds.transistor.fm/career-optional';

let cachedEpisodes: Episode[] | null = null;

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[''""]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function getEpisodes(): Promise<Episode[]> {
  if (cachedEpisodes) return cachedEpisodes;

  const parser = new Parser<Record<string, unknown>, TransistorItem>({
    customFields: {
      item: [
        ['itunes:duration', 'itunes.duration'],
        ['itunes:episode', 'itunes.episode'],
        ['itunes:season', 'itunes.season'],
        ['itunes:episodeType', 'itunes.episodeType'],
        ['itunes:explicit', 'itunes.explicit'],
      ],
    },
  });

  const feed = await parser.parseURL(RSS_URL);

  cachedEpisodes = (feed.items || [])
    .filter((item) => item.title && item.enclosure?.url)
    .map((item) => {
      const episodeType = (item.itunes?.episodeType as Episode['episodeType']) || 'full';
      const episodeNum = item.itunes?.episode ? parseInt(item.itunes.episode, 10) : undefined;

      return {
        title: item.title!,
        slug: slugify(item.title!),
        description: item.contentSnippet || '',
        contentHtml: item.content || '',
        pubDate: new Date(item.isoDate || Date.now()),
        duration: item.itunes?.duration || '0:00',
        audioUrl: item.enclosure!.url!,
        episodeNumber: episodeNum,
        season: item.itunes?.season ? parseInt(item.itunes.season, 10) : 1,
        episodeType,
        explicit: item.itunes?.explicit === 'true',
      };
    })
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return cachedEpisodes;
}

export async function getEpisodeBySlug(slug: string): Promise<Episode | undefined> {
  const episodes = await getEpisodes();
  return episodes.find((ep) => ep.slug === slug);
}
