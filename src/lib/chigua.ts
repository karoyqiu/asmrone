import { invoke } from '@tauri-apps/api/core';
import { join } from '@tauri-apps/api/path';
import { fetch } from '@tauri-apps/plugin-http';
import { Command } from '@tauri-apps/plugin-shell';
import pLimit from 'p-limit';

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

const limit = pLimit(4);

const downloadOne = async (
  streamlink: string,
  code: string,
  index: number,
  url: string,
  dir: string,
) => {
  console.log(`Downloading ${code} video ${index}`);
  const basename = await join(dir, `${code}-${index}`);
  const mp4 = `${basename}.mp4`;
  const ts = `${basename}.ts`;
  const args = ['-o', mp4, '--force', '-Q', '--stream-segment-threads', '4', url, 'best'];
  const exitCode = await invoke<number>('streamlink', { exe: streamlink, args });

  if (exitCode === 0) {
    console.log(`Transcoding ${code} video ${index}`);
    await invoke('rename', { from: mp4, to: ts });

    const command = Command.sidecar('binaries/ffmpeg', ['-i', ts, '-c', 'copy', mp4]);
    await command.execute();

    await invoke('rename', { from: mp4, to: ts });
    await invoke('rename', { from: ts, to: mp4 });
  } else {
    console.error(`Failed to download ${code} video ${index}`);
  }
};

export const download = async (streamlink: string, code: string, urls: string[], dir: string) => {
  const promises = urls.map((url, index) => limit(downloadOne, streamlink, code, index, url, dir));
  await Promise.all(promises);
};
