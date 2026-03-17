import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatRfc2822(date: Date): string {
  return date.toUTCString().replace('GMT', '+0000');
}

export const GET: APIRoute = async ({ site }) => {
  const episodes = await getCollection('podcast');
  const sorted = episodes.sort(
    (a, b) => new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime()
  );

  const siteUrl = site?.toString().replace(/\/$/, '') ?? 'https://careeroptional.ai';

  const items = sorted
    .map((ep) => {
      const epUrl = `${siteUrl}/podcast/${ep.id}/`;
      return `    <item>
      <title>${escapeXml(ep.data.title)}</title>
      <link>${epUrl}</link>
      <description>${escapeXml(ep.data.description)}</description>
      <pubDate>${formatRfc2822(new Date(ep.data.pubDate))}</pubDate>
      <guid isPermaLink="true">${epUrl}</guid>
      <enclosure url="${escapeXml(ep.data.audioUrl)}" type="audio/mpeg" length="0" />
      <itunes:episodeType>${ep.data.episodeType}</itunes:episodeType>
      ${ep.data.episodeNumber !== undefined ? `<itunes:episode>${ep.data.episodeNumber}</itunes:episode>` : ''}
      <itunes:season>${ep.data.season}</itunes:season>
      <itunes:duration>${escapeXml(ep.data.duration)}</itunes:duration>
      <itunes:explicit>${ep.data.explicit ? 'true' : 'false'}</itunes:explicit>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Career Optional</title>
    <link>${siteUrl}</link>
    <description>The skills that make employment optional. Daily insights on agile thinking, AI automation, and career optionality — hosted by Danny Liu.</description>
    <language>en-us</language>
    <lastBuildDate>${formatRfc2822(new Date())}</lastBuildDate>
    <atom:link href="${siteUrl}/podcast.xml" rel="self" type="application/rss+xml" />

    <!-- iTunes / Apple Podcasts -->
    <itunes:author>Danny Liu</itunes:author>
    <itunes:owner>
      <itunes:name>Danny Liu</itunes:name>
      <itunes:email>danny@careeroptional.ai</itunes:email>
    </itunes:owner>
    <itunes:category text="Business">
      <itunes:category text="Careers" />
    </itunes:category>
    <itunes:category text="Technology" />
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    <!-- TODO: Add <itunes:image> once cover art is ready -->

${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
