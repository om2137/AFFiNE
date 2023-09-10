import { WorkspaceSubPath } from '@affine/env/workspace';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import {
  DeleteTemporarilyIcon,
  FolderIcon,
  SettingsIcon,
} from '@blocksuite/icons';
import { useAtom } from 'jotai';
import type { ReactElement, SVGProps } from 'react';
import { useMemo } from 'react';

import { openSettingModalAtom } from '../../../atoms';

type IconComponent = (props: SVGProps<SVGSVGElement>) => ReactElement;

interface ConfigItem {
  title: string;
  icon: IconComponent;
  onClick: () => void;
}

interface ConfigPathItem {
  title: string;
  icon: IconComponent;
  subPath: WorkspaceSubPath;
}

export type Config = ConfigItem | ConfigPathItem;

export const useSwitchToConfig = (workspaceId: string): Config[] => {
  const t = useAFFiNEI18N();
  const [, setOpenSettingModalAtom] = useAtom(openSettingModalAtom);

  return useMemo(
    () => [
      {
        title: t['com.affine.workspaceSubPath.all'](),
        subPath: WorkspaceSubPath.ALL,
        icon: FolderIcon,
      },
      {
        title: t['Workspace Settings'](),
        onClick: () => {
          setOpenSettingModalAtom({
            open: true,
            activeTab: 'workspace',
            workspaceId,
          });
        },
        icon: SettingsIcon,
      },
      {
        title: t['com.affine.workspaceSubPath.trash'](),
        subPath: WorkspaceSubPath.TRASH,
        icon: DeleteTemporarilyIcon,
      },
    ],
    [t, workspaceId, setOpenSettingModalAtom]
  );
};
