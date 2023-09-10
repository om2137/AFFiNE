import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { Button } from '@toeverything/components/button';
import type { FC } from 'react';
import { useCallback, useState } from 'react';

import { AuthPageContainer } from './auth-page-container';
import { SetPassword } from './set-password';
type User = {
  id: string;
  name: string;
  email: string;
  image: string;
};

export const ChangePasswordPage: FC<{
  user: User;
  onSetPassword: (password: string) => void;
  onOpenAffine: () => void;
}> = ({ user: { email }, onSetPassword: propsOnSetPassword, onOpenAffine }) => {
  const t = useAFFiNEI18N();
  const [hasSetUp, setHasSetUp] = useState(false);

  const onSetPassword = useCallback(
    (passWord: string) => {
      propsOnSetPassword(passWord);
      setHasSetUp(true);
    },
    [propsOnSetPassword]
  );

  return (
    <AuthPageContainer
      title={
        hasSetUp
          ? t['com.affine.auth.reset.password.page.success']()
          : t['com.affine.auth.reset.password.page.title']()
      }
      subtitle={
        hasSetUp ? (
          t['com.affine.auth.sent.reset.password.success.message']()
        ) : (
          <>
            {t['com.affine.auth.page.sent.email.subtitle']()}
            <a href={`mailto:${email}`}>{email}</a>
          </>
        )
      }
    >
      {hasSetUp ? (
        <Button type="primary" size="large" onClick={onOpenAffine}>
          {t['com.affine.auth.open.affine']()}
        </Button>
      ) : (
        <SetPassword onSetPassword={onSetPassword} />
      )}
    </AuthPageContainer>
  );
};
