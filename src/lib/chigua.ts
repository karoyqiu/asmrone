import { fetch } from '@tauri-apps/plugin-http';

type DplayerDataConfig = {
  video?: {
    url?: string;
  };
};

export const getVideoUrls = async (url: string) => {
  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'text/html',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0',
    },
  });

  const html = await resp.text();
  const dom = new DOMParser();
  const doc = dom.parseFromString(html, 'text/html');
  const urls: string[] = [];

  for (const div of doc.querySelectorAll<HTMLDivElement>('div.dplayer')) {
    if (div.dataset.config) {
      const config = JSON.parse(div.dataset.config) as DplayerDataConfig;

      if (config.video?.url) {
        urls.push(config.video.url);
      }
    }
  }

  return urls;
};
