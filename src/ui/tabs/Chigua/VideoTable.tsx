import { PrimeIcons } from 'primereact/api';
import { Tree, type TreeCheckboxSelectionKeys } from 'primereact/tree';
import type { TreeNode } from 'primereact/treenode';
import { useMemo } from 'react';

type VideoNode = Omit<TreeNode, 'data'> & {
  data: string;
};

const videoToNode = (url: string, index: number): VideoNode => ({
  id: url,
  key: url,
  label: `Video ${index + 1}`,
  data: url,
  icon: PrimeIcons.VIDEO,
  leaf: true,
});

type VideoTableProps = {
  loading: boolean;
  videos: string[];
  checked: TreeCheckboxSelectionKeys | null;
  onCheck: (value: TreeCheckboxSelectionKeys | null) => void;
};

export default function VideoTable(props: VideoTableProps) {
  const { loading, videos, checked, onCheck } = props;

  const nodes = useMemo(() => videos.map(videoToNode), [videos]);

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
