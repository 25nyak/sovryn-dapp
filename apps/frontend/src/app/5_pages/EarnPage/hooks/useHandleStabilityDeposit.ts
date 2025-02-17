import { useCallback } from 'react';

import { BigNumberish, ethers } from 'ethers';
import { t } from 'i18next';

import { SupportedTokens } from '@sovryn/contracts';
import { getContract } from '@sovryn/contracts';
import { Decimal } from '@sovryn/utils';

import {
  Transaction,
  TransactionType,
} from '../../../3_organisms/TransactionStepDialog/TransactionStepDialog.types';
import { isTransactionRequest } from '../../../3_organisms/TransactionStepDialog/helpers';
import { GAS_LIMIT } from '../../../../constants/gasLimits';
import { getTokenDisplayName } from '../../../../constants/tokens';
import { useTransactionContext } from '../../../../contexts/TransactionContext';
import { useAccount } from '../../../../hooks/useAccount';
import { translations } from '../../../../locales/i18n';
import { getRskChainId } from '../../../../utils/chain';
import {
  UNSIGNED_PERMIT,
  permitHandler,
  preparePermitTransaction,
} from '../../../../utils/transactions';

export const useHandleStabilityDeposit = (
  token: SupportedTokens,
  amount: Decimal,
  hasRewardsToClaim: boolean,
  isDeposit: boolean,
  onComplete: () => void,
) => {
  const isDllrToken = token === SupportedTokens.dllr;

  const { signer } = useAccount();
  const { setTransactions, setIsOpen, setTitle } = useTransactionContext();

  const getStabilityPoolContract = useCallback(async () => {
    const { address, abi: massetManagerAbi } = await getContract(
      'stabilityPool',
      'zero',
      getRskChainId(),
    );

    return new ethers.Contract(address, massetManagerAbi, signer);
  }, [signer]);

  const withdraw = useCallback(async () => {
    if (!signer) {
      return;
    }
    const stabilityPool = await getStabilityPoolContract();
    let gasLimitToUse: BigNumberish;
    if (isDllrToken) {
      gasLimitToUse = hasRewardsToClaim
        ? GAS_LIMIT.STABILITY_POOL_DLLR_INC_WITHDRAW
        : GAS_LIMIT.STABILITY_POOL_DLLR;
    } else {
      gasLimitToUse = hasRewardsToClaim
        ? GAS_LIMIT.STABILITY_POOL_INC_WITHDRAW
        : GAS_LIMIT.STABILITY_POOL;
    }
    setTransactions([
      {
        title: t(translations.earnPage.txDialog.withdraw, {
          asset: getTokenDisplayName(token),
        }),
        request: {
          type: TransactionType.signTransaction,
          contract: stabilityPool,
          fnName: isDllrToken
            ? 'withdrawFromSpAndConvertToDLLR'
            : 'withdrawFromSP',
          args: [amount.toBigNumber().toString()],
          gasLimit: gasLimitToUse,
        },
        onComplete,
      },
    ]);
    setTitle(
      t(translations.earnPage.txDialog.withdrawTitle, {
        asset: getTokenDisplayName(token),
      }),
    );
    setIsOpen(true);
  }, [
    signer,
    getStabilityPoolContract,
    setTransactions,
    isDllrToken,
    amount,
    onComplete,
    setTitle,
    token,
    hasRewardsToClaim,
    setIsOpen,
  ]);

  const deposit = useCallback(async () => {
    if (!signer) {
      return;
    }
    const stabilityPool = await getStabilityPoolContract();
    const weiAmount = amount.toBigNumber().toString();
    const transactions: Transaction[] = [];
    if (isDllrToken) {
      transactions.push(
        await preparePermitTransaction({
          token: SupportedTokens.dllr,
          signer,
          spender: stabilityPool.address,
          value: weiAmount,
        }),
      );
    }

    transactions.push({
      title: t(translations.earnPage.txDialog.deposit, {
        asset: getTokenDisplayName(token),
      }),
      request: {
        type: TransactionType.signTransaction,
        contract: stabilityPool,
        fnName: isDllrToken ? 'provideToSpFromDLLR' : 'provideToSP',
        args: isDllrToken
          ? [weiAmount, UNSIGNED_PERMIT]
          : [weiAmount, ethers.constants.AddressZero],
        gasLimit: isDllrToken
          ? GAS_LIMIT.STABILITY_POOL_DLLR
          : GAS_LIMIT.STABILITY_POOL,
      },
      onComplete,
      updateHandler: permitHandler((req, res) => {
        if (isTransactionRequest(req) && isDllrToken) {
          req.args[1] = res;
        }
        return req;
      }),
    });

    setTransactions(transactions);
    setTitle(
      t(translations.earnPage.txDialog.depositTitle, {
        asset: getTokenDisplayName(token),
      }),
    );
    setIsOpen(true);
  }, [
    signer,
    getStabilityPoolContract,
    amount,
    isDllrToken,
    token,
    onComplete,
    setTransactions,
    setTitle,
    setIsOpen,
  ]);
  const handleSubmit = useCallback(
    () => (isDeposit ? deposit() : withdraw()),
    [deposit, isDeposit, withdraw],
  );

  return handleSubmit;
};
