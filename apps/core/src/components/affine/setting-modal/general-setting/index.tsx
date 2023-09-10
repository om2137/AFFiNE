import { useAFFiNEI18N } from '@affine/i18n/hooks';
import {
  AppearanceIcon,
  InformationIcon,
  KeyboardIcon,
  PluginIcon,
} from '@blocksuite/icons';
import type { ReactElement, SVGProps } from 'react';

import { AboutAffine } from './about';
import { AppearanceSettings } from './appearance';
import { Plugins } from './plugins';
import { Shortcuts } from './shortcuts';

export type GeneralSettingKeys =
  | 'shortcuts'
  | 'appearance'
  | 'plugins'
  | 'about';

interface GeneralSettingListItem {
  key: GeneralSettingKeys;
  title: string;
  icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
  testId: string;
}

export type GeneralSettingList = GeneralSettingListItem[];

export const useGeneralSettingList = (): GeneralSettingList => {
  const t = useAFFiNEI18N();

  return [
    {
      key: 'appearance',
      title: t['com.affine.settings.appearance'](),
      icon: AppearanceIcon,
      testId: 'appearance-panel-trigger',
    },
    {
      key: 'shortcuts',
      title: t['com.affine.keyboardShortcuts.title'](),
      icon: KeyboardIcon,
      testId: 'shortcuts-panel-trigger',
    },
    {
      key: 'plugins',
      title: 'Plugins',
      icon: PluginIcon,
      testId: 'plugins-panel-trigger',
    },
    {
      key: 'about',
      title: t['com.affine.aboutAFFiNE.title'](),
      icon: InformationIcon,
      testId: 'about-panel-trigger',
    },
  ];
};

interface GeneralSettingProps {
  generalKey: GeneralSettingKeys;
}

export const GeneralSetting = ({ generalKey }: GeneralSettingProps) => {
  switch (generalKey) {
    case 'shortcuts':
      return <Shortcuts />;
    case 'appearance':
      return <AppearanceSettings />;
    case 'plugins':
      return <Plugins />;
    case 'about':
      return <AboutAffine />;
    default:
      return null;
  }
};
