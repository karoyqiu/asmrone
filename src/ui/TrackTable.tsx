import { PrimeIcons } from 'primereact/api';
import { Tree, type TreeCheckboxSelectionKeys } from 'primereact/tree';
import type { TreeNode } from 'primereact/treenode';
import { useMemo } from 'react';

import type { Track } from '../lib/asmrone';

type TrackNode = Omit<TreeNode, 'children' | 'data'> & {
  children?: TrackNode[];
  data: Track;
};

const trackToNode = (track: Track) => {
  const node: TrackNode = { label: track.title, data: track };
  node.id = 'hash' in track ? track.hash : track.title;
  node.key = node.id;

  switch (track.type) {
    case 'folder':
      node.icon = PrimeIcons.FOLDER;
      node.expanded = true;

      if (track.children.length > 0) {
        node.children = track.children.map(trackToNode);
      }

      break;
    case 'audio':
      node.icon = PrimeIcons.VOLUME_UP;
      break;
    case 'image':
      node.icon = PrimeIcons.IMAGE;
      break;
    default:
    case 'text':
      node.icon = PrimeIcons.FILE;
      break;
  }

  return node;
};

type TrackTableProps = {
  loading: boolean;
  tracks: Track[];
  checked: TreeCheckboxSelectionKeys | null;
  onCheck: (value: TreeCheckboxSelectionKeys | null) => void;
};

export default function TrackTable(props: TrackTableProps) {
  const { loading, tracks, checked, onCheck } = props;

  const nodes = useMemo(() => tracks.map(trackToNode), [tracks]);

  return (
    <Tree
      className="border-none"
      value={nodes}
      loading={loading}
      selectionMode="checkbox"
      selectionKeys={checked}
      onSelectionChange={(e) => onCheck(e.value as TreeCheckboxSelectionKeys)}
    />
  );
}
