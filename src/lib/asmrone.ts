import { BaseDirectory, join } from '@tauri-apps/api/path';
import { mkdir, writeTextFile } from '@tauri-apps/plugin-fs';
import { fetch } from '@tauri-apps/plugin-http';

export type Track = {
  gid: string;
  title: string;
  fullPath: string;
} & (Folder | AudioTrack | ImageTrack | TextTrack);

export type Folder = {
  type: 'folder';
  children: Track[];
};

export type AudioTrack = {
  type: 'audio';
  duration: number;
  streamLowQualityUrl?: string;
} & TrackBase;

export type ImageTrack = {
  type: 'image';
} & TrackBase;

export type TextTrack = {
  type: 'text';
} & TrackBase;

type TrackBase = {
  hash: string;
  mediaStreamUrl: string;
  mediaDownloadUrl: string;
  size: number;
  work: Work;
  workTitle: string;
};

type Work = {
  id: number;
  source_id: string;
  source_type: string;
};

export const getTracks = async (rjid: string, proxy: string) => {
  const resp = await fetch(`https://api.asmr.one/api/tracks/${rjid}?v=1`, {
    method: 'GET',
    referrer: 'https://www.asmr.one',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0',
    },
    proxy: proxy ? { all: proxy } : undefined,
  });

  const tracks = (await resp.json()) as Track[];

  if (!Array.isArray(tracks)) {
    throw tracks;
  }

  for (const track of tracks) {
    makeFullPath(track, '');
  }

  return tracks;
};

const makeFullPath = (track: Track, parent: string) => {
  track.gid = crypto.randomUUID().replaceAll('-', '').substring(0, 16);
  track.fullPath = parent ? `${parent}/${track.title}` : track.title;

  if (track.type === 'folder') {
    for (const child of track.children) {
      makeFullPath(child, track.fullPath);
    }
  }
};

export const download = async (tracks: Track[], dir: string, proxy: string | null) => {
  const lines: string[] = [];
  let subdir = '';

  for (const track of tracks) {
    if ('work' in track) {
      subdir = `${track.work.source_id} - ${track.workTitle}`;
      break;
    }
  }

  if (!subdir) {
    console.error('No work info.');
    return;
  }

  let fullDir = await join(dir, subdir);

  for (const track of tracks) {
    if ('mediaDownloadUrl' in track) {
      lines.push(track.mediaDownloadUrl);
      lines.push(`  gid=${track.gid}`);
      lines.push(`  dir=${fullDir}`);
      lines.push(`  out=${track.fullPath}`);
      lines.push('');
    }
  }

  await mkdir('.', { baseDir: BaseDirectory.AppConfig, recursive: true });
  await writeTextFile('aria2c.input', lines.join('\n'), { baseDir: BaseDirectory.AppConfig });
};
