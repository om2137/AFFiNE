import { PlusIcon } from '@blocksuite/icons';
import type { Workspace } from '@blocksuite/store';
import { IconButton } from '@toeverything/components/button';
import { usePageMetaHelper } from '@toeverything/hooks/use-block-suite-page-meta';
import { useCallback } from 'react';

import { usePageHelper } from '../../../blocksuite/block-suite-page-list/utils';

type AddFavouriteButtonProps = {
  workspace: Workspace;
};

export const AddFavouriteButton = ({ workspace }: AddFavouriteButtonProps) => {
  const { createPage } = usePageHelper(workspace);
  const { setPageMeta } = usePageMetaHelper(workspace);
  const handleAddFavorite = useCallback(async () => {
    const id = createPage();
    setPageMeta(id, { favorite: true });
  }, [createPage, setPageMeta]);

  return (
    <IconButton
      data-testid="slider-bar-add-favorite-button"
      onClick={handleAddFavorite}
      size="small"
    >
      <PlusIcon />
    </IconButton>
  );
};
