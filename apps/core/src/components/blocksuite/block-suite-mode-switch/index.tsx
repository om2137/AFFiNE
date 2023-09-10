import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { assertExists } from '@blocksuite/global/utils';
import { Tooltip } from '@toeverything/components/tooltip';
import { useBlockSuitePageMeta } from '@toeverything/hooks/use-block-suite-page-meta';
import { useAtom } from 'jotai';
import type { CSSProperties } from 'react';
import { useEffect, useRef } from 'react';

import { pageSettingFamily } from '../../../atoms';
import type { BlockSuiteWorkspace } from '../../../shared';
import { toast } from '../../../utils';
import { StyledEditorModeSwitch, StyledKeyboardItem } from './style';
import { EdgelessSwitchItem, PageSwitchItem } from './switch-items';

export type EditorModeSwitchProps = {
  // todo(himself65): combine these two properties
  blockSuiteWorkspace: BlockSuiteWorkspace;
  pageId: string;
  style?: CSSProperties;
};
const TooltipContent = () => {
  const t = useAFFiNEI18N();
  return (
    <>
      {t['Switch']()}
      <StyledKeyboardItem>
        {!environment.isServer && environment.isMacOs ? '⌥ + S' : 'Alt + S'}
      </StyledKeyboardItem>
    </>
  );
};
export const EditorModeSwitch = ({
  style,
  blockSuiteWorkspace,
  pageId,
}: EditorModeSwitchProps) => {
  const [setting, setSetting] = useAtom(pageSettingFamily(pageId));
  const currentMode = setting?.mode ?? 'page';
  const pageMeta = useBlockSuitePageMeta(blockSuiteWorkspace).find(
    meta => meta.id === pageId
  );
  const t = useAFFiNEI18N();
  const ref = useRef(null);
  assertExists(pageMeta);
  const { trash } = pageMeta;
  useEffect(() => {
    if (trash) {
      return;
    }
    const keydown = (e: KeyboardEvent) => {
      if (
        !environment.isServer && environment.isMacOs
          ? e.key === 'ß'
          : e.key === 's' && e.altKey
      ) {
        e.preventDefault();
        setSetting(setting => {
          if (setting?.mode !== 'page') {
            toast(t['com.affine.toastMessage.pageMode']());
            return { ...setting, mode: 'page' };
          } else {
            toast(t['com.affine.toastMessage.edgelessMode']());
            return { ...setting, mode: 'edgeless' };
          }
        });
      }
    };
    document.addEventListener('keydown', keydown, { capture: true });
    return () =>
      document.removeEventListener('keydown', keydown, { capture: true });
  }, [setSetting, t, trash]);

  return (
    <Tooltip
      content={<TooltipContent />}
      portalOptions={{
        container: ref.current,
      }}
    >
      <StyledEditorModeSwitch
        style={style}
        switchLeft={currentMode === 'page'}
        showAlone={trash}
        ref={ref}
      >
        <PageSwitchItem
          data-testid="switch-page-mode-button"
          active={currentMode === 'page'}
          hide={trash && currentMode !== 'page'}
          trash={trash}
          onClick={() => {
            setSetting(setting => {
              if (setting?.mode !== 'page') {
                toast(t['com.affine.toastMessage.pageMode']());
              }
              return { ...setting, mode: 'page' };
            });
          }}
        />
        <EdgelessSwitchItem
          data-testid="switch-edgeless-mode-button"
          active={currentMode === 'edgeless'}
          hide={trash && currentMode !== 'edgeless'}
          trash={trash}
          onClick={() => {
            setSetting(setting => {
              if (setting?.mode !== 'edgeless') {
                toast(t['com.affine.toastMessage.edgelessMode']());
              }
              return { ...setting, mode: 'edgeless' };
            });
          }}
        />
      </StyledEditorModeSwitch>
    </Tooltip>
  );
};
