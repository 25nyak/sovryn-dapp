import React, { FC, useMemo } from 'react';

import { BigNumber } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import { t } from 'i18next';

import { SupportedTokens } from '@sovryn/contracts';
import { Paragraph, Table } from '@sovryn/ui';

import { AmountRenderer } from '../../../../2_molecules/AmountRenderer/AmountRenderer';
import { BTC_RENDER_PRECISION } from '../../../../../constants/currencies';
import { getTokenDisplayName } from '../../../../../constants/tokens';
import { useAccount } from '../../../../../hooks/useAccount';
import { translations } from '../../../../../locales/i18n';
import { decimalic } from '../../../../../utils/math';
import { EarnedFee } from '../../RewardsPage.types';
import { useGetFeesEarned } from '../../hooks/useGetFeesEarned';
import { useGetLiquidSovClaimAmount } from '../../hooks/useGetLiquidSovClaimAmount';
import { columns } from './Staking.constants';
import { WithdrawAllFees } from './components/WithdrawAllFees/WithdrawAllFees';
import { WithdrawLiquidFee } from './components/WithdrawLiquidFee/WithdrawLiquidFee';

export const Staking: FC = () => {
  const { account } = useAccount();
  const { loading, earnedFees, refetch } = useGetFeesEarned();

  const {
    amount: liquidSovClaimAmount,
    lastWithdrawalInterval,
    refetch: refetchLiquidSovClaim,
  } = useGetLiquidSovClaimAmount();

  const hasEarnedFees = useMemo(
    () => earnedFees.some(earnedFee => decimalic(earnedFee.value).gt(0)),
    [earnedFees],
  );

  const hasLiquidSov = useMemo(
    () => decimalic(liquidSovClaimAmount).gt(0),
    [liquidSovClaimAmount],
  );

  const noRewards = useMemo(
    () => (!hasEarnedFees && !hasLiquidSov) || !account,
    [hasEarnedFees, hasLiquidSov, account],
  );

  const earnedFeesSum = useMemo(() => {
    const btcFees = earnedFees.filter(
      earnedFee =>
        earnedFee.token === SupportedTokens.rbtc ||
        earnedFee.token === SupportedTokens.wrbtc,
    );

    if (!btcFees.length) {
      return earnedFees;
    }

    const otherFees = earnedFees.filter(
      earnedFee =>
        earnedFee.token !== SupportedTokens.rbtc &&
        earnedFee.token !== SupportedTokens.wrbtc,
    );

    const btcFeesSum: EarnedFee = {
      token: SupportedTokens.rbtc,
      value: btcFees
        .reduce((sum, fee) => sum.add(fee.value), BigNumber.from(0))
        .toString(),
      contractAddress: '',
      rbtcValue: 0,
    };

    return [btcFeesSum, ...otherFees];
  }, [earnedFees]);

  const rows = useMemo(
    () => [
      ...(hasEarnedFees
        ? [
            {
              type: t(translations.rewardPage.staking.stakingRevenue),
              amount: (
                <div className="flex flex-col gap-1 my-4 text-left">
                  {earnedFeesSum.map(fee => (
                    <AmountRenderer
                      key={fee.token}
                      value={formatUnits(fee.value, 18)}
                      suffix={getTokenDisplayName(fee.token)}
                      precision={BTC_RENDER_PRECISION}
                      dataAttribute={`${fee.token}-rewards-amount`}
                    />
                  ))}
                </div>
              ),
              action: <WithdrawAllFees fees={earnedFees} refetch={refetch} />,
              key: `all-fee`,
            },
          ]
        : []),
      ...(hasLiquidSov
        ? [
            {
              type: t(translations.rewardPage.staking.stakingSubsidies),
              amount: (
                <AmountRenderer
                  value={formatUnits(liquidSovClaimAmount, 18)}
                  suffix={getTokenDisplayName(SupportedTokens.sov)}
                  precision={BTC_RENDER_PRECISION}
                  dataAttribute={`${SupportedTokens.sov}-liquid-amount`}
                />
              ),
              action: (
                <WithdrawLiquidFee
                  amountToClaim={liquidSovClaimAmount}
                  lastWithdrawalInterval={lastWithdrawalInterval}
                  refetch={refetchLiquidSovClaim}
                />
              ),
              key: `${SupportedTokens.sov}-liquid-fee`,
            },
          ]
        : []),
    ],
    [
      hasEarnedFees,
      earnedFeesSum,
      earnedFees,
      refetch,
      hasLiquidSov,
      liquidSovClaimAmount,
      lastWithdrawalInterval,
      refetchLiquidSovClaim,
    ],
  );

  return (
    <div className="flex flex-col items-center w-full gap-y-8">
      <div className="lg:bg-gray-80 lg:py-4 lg:px-4 rounded w-full">
        <Table
          columns={columns}
          rows={noRewards ? [] : rows}
          isLoading={!!account ? loading : false}
          rowKey={row => row.key}
          dataAttribute="staking-rewards-table"
          noData={
            <span className="italic">
              {!!account
                ? t(translations.rewardPage.stabilityPool.noRewards)
                : t(translations.rewardPage.stabilityPool.notConnected)}
            </span>
          }
          loadingData={t(translations.common.tables.loading)}
          rowTitle={row => (
            <div className="flex flex-col items-start gap-1 font-medium">
              <Paragraph className="text-gray-40">{row.type}</Paragraph>
              {row.amount}
            </div>
          )}
          mobileRenderer={row => row.action}
        />
      </div>
    </div>
  );
};
