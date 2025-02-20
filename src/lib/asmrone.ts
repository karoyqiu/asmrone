import { BaseDirectory, appConfigDir, join } from '@tauri-apps/api/path';
import { mkdir, writeTextFile } from '@tauri-apps/plugin-fs';
import { fetch } from '@tauri-apps/plugin-http';
import { Command } from '@tauri-apps/plugin-shell';

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

export type TrackBase = {
  hash: string;
  mediaStreamUrl: string;
  mediaDownloadUrl: string;
  size: number;
  downloaded: number;
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
  } else {
    track.downloaded = 0;
  }
};

type OnProgress = (gid: string, downloaded: number, total: number) => void;

export const download = async (
  tracks: Track[],
  dir: string,
  proxy: string | null,
  onProgress: OnProgress,
  onFinish: (code: number) => void,
) => {
  const lines: string[] = [];
  let subdir = '';

  for (const track of tracks) {
    if ('work' in track) {
      subdir = `${track.work.source_id} - ${track.workTitle.replaceAll('/', '-').replaceAll('\\', '-')}`;
      break;
    }
  }

  if (!subdir) {
    throw new Error('No work info');
  }

  let fullDir = await join(dir, subdir);

  for (const track of tracks) {
    if ('mediaDownloadUrl' in track) {
      lines.push(track.mediaDownloadUrl);
      lines.push(`  gid=${track.gid}`);
      lines.push(`  out=${track.fullPath}`);
      lines.push('');
    }
  }

  await mkdir('.', { baseDir: BaseDirectory.AppConfig, recursive: true });
  await writeTextFile('aria2c.input', lines.join('\n'), { baseDir: BaseDirectory.AppConfig });

  const input = await join(await appConfigDir(), 'aria2c.input');
  const args = [
    '-d',
    fullDir,
    '-i',
    input,
    '-c',
    '--max-connection-per-server=16',
    '--min-split-size=1M',
    '--allow-overwrite',
    '--auto-file-renaming=false',
    '--deferred-input',
    '--file-allocation=falloc',
    '--optimize-concurrent-downloads',
    '--enable-color=false',
    '--log-level=error',
    '--console-log-level=error',
    '--truncate-console-readout=false',
    '--human-readable=false',
  ];

  if (proxy) {
    args.push(`--all-proxy=${proxy}`);
  }

  const command = Command.sidecar('binaries/aria2c', args);
  command.stderr.on('data', (value) => {
    parseDownloadProgress(value, tracks, onProgress);
  });
  command.stdout.on('data', (value) => {
    parseDownloadProgress(value, tracks, onProgress);
  });
  command.on('close', (e) => {
    onFinish(e.code ?? -1);
  });

  return command.spawn();
};

const parseDownloadProgress = (line: string, tracks: Track[], onProgress: OnProgress) => {
  const parts = line.split('[');

  for (const part of parts) {
    if (!part.startsWith('#')) {
      continue;
    }

    const [nnn, progress] = part.trim().slice(1, -1).split(' ', 2);
    const track = tracks.find((value) => value.gid.startsWith(nnn));

    if (track) {
      const [d, t] = progress.split('/');
      onProgress(track.gid, parseInt(d, 10), parseInt(t, 10));
    }
  }
};
