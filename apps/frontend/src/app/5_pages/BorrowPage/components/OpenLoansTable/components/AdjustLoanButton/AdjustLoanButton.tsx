import React, { FC, useCallback } from 'react';

import { t } from 'i18next';

import { Button, ButtonStyle } from '@sovryn/ui';

import { useAccount } from '../../../../../../../hooks/useAccount';
import { translations } from '../../../../../../../locales/i18n';
import { LoanItem } from '../../OpenLoansTable.types';

type AdjustLoanButtonProps = {
  loan: LoanItem;
  onClick: (id: string) => void;
};

export const AdjustLoanButton: FC<AdjustLoanButtonProps> = ({
  loan,
  onClick,
}) => {
  const { account } = useAccount();

  const onAdjust = useCallback(() => onClick(loan.id), [loan, onClick]);

  return (
    <Button
      text={t(translations.fixedInterestPage.openLoansTable.actions.adjust)}
      style={ButtonStyle.primary}
      onClick={onAdjust}
      disabled={!account}
      dataAttribute="adjust-loan-button"
    />
  );
};
