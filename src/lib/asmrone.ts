import { fetch } from '@tauri-apps/plugin-http';

export type Track = {
  title: string;
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

export const getTracks = async (rjid: string) => {
  const resp = await fetch(`https://api.asmr.one/api/tracks/${rjid}?v=1`, {
    method: 'GET',
    referrer: 'https://www.asmr.one',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0',
    },
    proxy: {
      all: 'http://127.0.0.1:7890',
    },
  });

  const tracks = await resp.json();

  if (!Array.isArray(tracks)) {
    throw tracks;
  }

  return tracks as Track[];
};
