import { Empty } from '@affine/component';
import type { ListData, TrashListData } from '@affine/component/page-list';
import { PageList, PageListTrashView } from '@affine/component/page-list';
import type { Collection } from '@affine/env/filter';
import { Trans } from '@affine/i18n';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { assertExists } from '@blocksuite/global/utils';
import { EdgelessIcon, PageIcon } from '@blocksuite/icons';
import { type PageMeta, type Workspace } from '@blocksuite/store';
import { useBlockSuitePageMeta } from '@toeverything/hooks/use-block-suite-page-meta';
import { useBlockSuitePagePreview } from '@toeverything/hooks/use-block-suite-page-preview';
import { useBlockSuiteWorkspacePage } from '@toeverything/hooks/use-block-suite-workspace-page';
import { useAtom, useAtomValue } from 'jotai';
import { Suspense, useCallback, useMemo } from 'react';

import { allPageModeSelectAtom } from '../../../atoms';
import { useBlockSuiteMetaHelper } from '../../../hooks/affine/use-block-suite-meta-helper';
import { useGetPageInfoById } from '../../../hooks/use-get-page-info';
import type { BlockSuiteWorkspace } from '../../../shared';
import { toast } from '../../../utils';
import { filterPage } from '../../../utils/filter';
import { currentCollectionsAtom } from '../../../utils/user-setting';
import { emptyDescButton, emptyDescKbd, pageListEmptyStyle } from './index.css';
import { usePageHelper } from './utils';

export interface BlockSuitePageListProps {
  blockSuiteWorkspace: BlockSuiteWorkspace;
  listType: 'all' | 'trash' | 'shared' | 'public';
  isPublic?: boolean;
  onOpenPage: (pageId: string, newTab?: boolean) => void;
  collection?: Collection;
}

const filter = {
  all: (pageMeta: PageMeta) => !pageMeta.trash,
  public: (pageMeta: PageMeta) => !pageMeta.trash,
  trash: (pageMeta: PageMeta, allMetas: PageMeta[]) => {
    const parentMeta = allMetas.find(m => m.subpageIds?.includes(pageMeta.id));
    return !parentMeta?.trash && pageMeta.trash;
  },
  shared: (pageMeta: PageMeta) => pageMeta.isPublic && !pageMeta.trash,
};

interface PagePreviewInnerProps {
  workspace: Workspace;
  pageId: string;
}

const PagePreviewInner = ({ workspace, pageId }: PagePreviewInnerProps) => {
  const page = useBlockSuiteWorkspacePage(workspace, pageId);
  assertExists(page);
  const previewAtom = useBlockSuitePagePreview(page);
  const preview = useAtomValue(previewAtom);
  return preview;
};

interface PagePreviewProps {
  workspace: Workspace;
  pageId: string;
}

const PagePreview = ({ workspace, pageId }: PagePreviewProps) => {
  return (
    <Suspense>
      <PagePreviewInner workspace={workspace} pageId={pageId} />
    </Suspense>
  );
};

interface PageListEmptyProps {
  createPage?: ReturnType<typeof usePageHelper>['createPage'];
  listType: BlockSuitePageListProps['listType'];
}

const PageListEmpty = (props: PageListEmptyProps) => {
  const { listType, createPage } = props;
  const t = useAFFiNEI18N();

  const onCreatePage = useCallback(() => {
    createPage?.();
  }, [createPage]);

  const getEmptyDescription = () => {
    if (listType === 'all') {
      const createNewPageButton = (
        <button className={emptyDescButton} onClick={onCreatePage}>
          New Page
        </button>
      );
      if (environment.isDesktop) {
        const shortcut = environment.isMacOs ? '⌘ + N' : 'Ctrl + N';
        return (
          <Trans i18nKey="emptyAllPagesClient">
            Click on the {createNewPageButton} button Or press
            <kbd className={emptyDescKbd}>{{ shortcut } as any}</kbd> to create
            your first page.
          </Trans>
        );
      }
      return (
        <Trans i18nKey="emptyAllPages">
          Click on the
          {createNewPageButton}
          button to create your first page.
        </Trans>
      );
    }
    if (listType === 'trash') {
      return t['emptyTrash']();
    }
    if (listType === 'shared') {
      return t['emptySharedPages']();
    }
    return;
  };

  return (
    <div className={pageListEmptyStyle}>
      <Empty
        title={t['com.affine.emptyDesc']()}
        description={getEmptyDescription()}
      />
    </div>
  );
};

export const BlockSuitePageList = ({
  blockSuiteWorkspace,
  onOpenPage,
  listType,
  isPublic = false,
  collection,
}: BlockSuitePageListProps) => {
  const pageMetas = useBlockSuitePageMeta(blockSuiteWorkspace);
  const {
    toggleFavorite,
    removeToTrash,
    restoreFromTrash,
    permanentlyDeletePage,
    cancelPublicPage,
  } = useBlockSuiteMetaHelper(blockSuiteWorkspace);
  const [filterMode] = useAtom(allPageModeSelectAtom);
  const { createPage, createEdgeless, importFile, isPreferredEdgeless } =
    usePageHelper(blockSuiteWorkspace);
  const t = useAFFiNEI18N();
  const getPageInfo = useGetPageInfoById(blockSuiteWorkspace);
  const tagOptionMap = useMemo(
    () =>
      Object.fromEntries(
        (blockSuiteWorkspace.meta.properties.tags?.options ?? []).map(v => [
          v.id,
          v,
        ])
      ),
    [blockSuiteWorkspace.meta.properties.tags?.options]
  );
  const list = useMemo(
    () =>
      pageMetas
        .filter(pageMeta => {
          if (filterMode === 'all') {
            return true;
          }
          if (filterMode === 'edgeless') {
            return isPreferredEdgeless(pageMeta.id);
          }
          if (filterMode === 'page') {
            return !isPreferredEdgeless(pageMeta.id);
          }
          console.error('unknown filter mode', pageMeta, filterMode);
          return true;
        })
        .filter(pageMeta => {
          if (!filter[listType](pageMeta, pageMetas)) {
            return false;
          }
          if (!collection) {
            return true;
          }
          return filterPage(collection, pageMeta);
        }),
    [pageMetas, filterMode, isPreferredEdgeless, listType, collection]
  );

  if (listType === 'trash') {
    const pageList: TrashListData[] = list.map(pageMeta => {
      return {
        icon: isPreferredEdgeless(pageMeta.id) ? (
          <EdgelessIcon />
        ) : (
          <PageIcon />
        ),
        pageId: pageMeta.id,
        title: pageMeta.title,
        preview: (
          <PagePreview workspace={blockSuiteWorkspace} pageId={pageMeta.id} />
        ),
        createDate: new Date(pageMeta.createDate),
        trashDate: pageMeta.trashDate
          ? new Date(pageMeta.trashDate)
          : undefined,
        onClickPage: () => onOpenPage(pageMeta.id),
        onClickRestore: () => {
          restoreFromTrash(pageMeta.id);
        },
        onRestorePage: () => {
          restoreFromTrash(pageMeta.id);
          toast(
            t['com.affine.toastMessage.restored']({
              title: pageMeta.title || 'Untitled',
            })
          );
        },
        onPermanentlyDeletePage: () => {
          permanentlyDeletePage(pageMeta.id);
          toast(t['com.affine.toastMessage.permanentlyDeleted']());
        },
      };
    });
    return (
      <PageListTrashView
        list={pageList}
        fallback={<PageListEmpty listType={listType} />}
      />
    );
  }

  const pageList: ListData[] = list.map(pageMeta => {
    const page = blockSuiteWorkspace.getPage(pageMeta.id);
    return {
      icon: isPreferredEdgeless(pageMeta.id) ? <EdgelessIcon /> : <PageIcon />,
      pageId: pageMeta.id,
      title: pageMeta.title,
      preview: (
        <PagePreview workspace={blockSuiteWorkspace} pageId={pageMeta.id} />
      ),
      tags:
        page?.meta.tags?.map(id => tagOptionMap[id]).filter(v => v != null) ??
        [],
      favorite: !!pageMeta.favorite,
      isPublicPage: !!pageMeta.isPublic,
      createDate: new Date(pageMeta.createDate),
      updatedDate: new Date(pageMeta.updatedDate ?? pageMeta.createDate),
      onClickPage: () => onOpenPage(pageMeta.id),
      onOpenPageInNewTab: () => onOpenPage(pageMeta.id, true),
      onClickRestore: () => {
        restoreFromTrash(pageMeta.id);
      },
      removeToTrash: () => {
        removeToTrash(pageMeta.id);
        toast(t['com.affine.toastMessage.successfullyDeleted']());
      },
      onRestorePage: () => {
        restoreFromTrash(pageMeta.id);
        toast(
          t['com.affine.toastMessage.restored']({
            title: pageMeta.title || 'Untitled',
          })
        );
      },
      bookmarkPage: () => {
        const status = pageMeta.favorite;
        toggleFavorite(pageMeta.id);
        toast(
          status
            ? t['com.affine.toastMessage.removedFavorites']()
            : t['com.affine.toastMessage.addedFavorites']()
        );
      },
      onDisablePublicSharing: () => {
        cancelPublicPage(pageMeta.id);
        toast('Successfully disabled', {
          portal: document.body,
        });
      },
    };
  });

  return (
    <PageList
      collectionsAtom={currentCollectionsAtom}
      propertiesMeta={blockSuiteWorkspace.meta.properties}
      getPageInfo={getPageInfo}
      onCreateNewPage={createPage}
      onCreateNewEdgeless={createEdgeless}
      onImportFile={importFile}
      isPublicWorkspace={isPublic}
      list={pageList}
      fallback={<PageListEmpty createPage={createPage} listType={listType} />}
    />
  );
};
