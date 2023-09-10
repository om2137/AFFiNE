import {
  EditCollectionModel,
  useCollectionManager,
} from '@affine/component/page-list';
import type { Collection } from '@affine/env/filter';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { PlusIcon } from '@blocksuite/icons';
import type { Workspace } from '@blocksuite/store';
import { uuidv4 } from '@blocksuite/store';
import { IconButton } from '@toeverything/components/button';
import { useCallback, useState } from 'react';

import { useGetPageInfoById } from '../../../../hooks/use-get-page-info';
import { currentCollectionsAtom } from '../../../../utils/user-setting';

type AddCollectionButtonProps = {
  workspace: Workspace;
};

export const AddCollectionButton = ({
  workspace,
}: AddCollectionButtonProps) => {
  const getPageInfo = useGetPageInfoById(workspace);
  const setting = useCollectionManager(currentCollectionsAtom);
  const t = useAFFiNEI18N();
  const [show, showUpdateCollection] = useState(false);
  const [defaultCollection, setDefaultCollection] = useState<Collection>();
  const handleClick = useCallback(() => {
    showUpdateCollection(true);
    setDefaultCollection({
      id: uuidv4(),
      name: '',
      pinned: true,
      filterList: [],
      workspaceId: workspace.id,
    });
  }, [showUpdateCollection, workspace.id]);

  return (
    <>
      <IconButton
        data-testid="slider-bar-add-collection-button"
        onClick={handleClick}
        size="small"
      >
        <PlusIcon />
      </IconButton>

      <EditCollectionModel
        propertiesMeta={workspace.meta.properties}
        getPageInfo={getPageInfo}
        onConfirm={setting.saveCollection}
        open={show}
        onClose={() => showUpdateCollection(false)}
        title={t['com.affine.editCollection.saveCollection']()}
        init={defaultCollection}
      />
    </>
  );
};
