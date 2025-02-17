import React, { FC, useCallback, useMemo, useReducer } from 'react';

import { t } from 'i18next';

import { SupportedTokens } from '@sovryn/contracts';
import {
  Button,
  ButtonStyle,
  Header as UIHeader,
  Icon,
  IconNames,
  noop,
} from '@sovryn/ui';

import { ConnectWalletButton } from '../../2_molecules';
import { SovrynLogo } from '../../2_molecules/SovrynLogo/SovrynLogo';
import { RSK_FAUCET } from '../../../constants/general';
import { useWalletConnect, useWrongNetworkCheck } from '../../../hooks';
import { useAssetBalance } from '../../../hooks/useAssetBalance';
import { translations } from '../../../locales/i18n';
import { sharedState } from '../../../store/rxjs/shared-state';
import { isMainnet, isTestnetFastBtcEnabled } from '../../../utils/helpers';
import { menuItemsMapping } from './Header.constants';
import { NavItem } from './components/NavItem/NavItem';
import { ProductLinks } from './components/ProductLinks/ProductLinks';

export const Header: FC = () => {
  const [isOpen, toggle] = useReducer(v => !v, false);
  const { connectWallet, disconnectWallet, account, pending } =
    useWalletConnect();
  useWrongNetworkCheck();

  const { balance } = useAssetBalance(SupportedTokens.rbtc);

  const hasRbtcBalance = useMemo(() => Number(balance) !== 0, [balance]);

  const enableFastBtc = useMemo(
    () => isMainnet() || (!isMainnet() && isTestnetFastBtcEnabled()),
    [],
  );

  const handleNavClick = useCallback(() => {
    if (isOpen) {
      toggle();
    }
  }, [isOpen]);

  const handleFastBtcClick = useCallback(
    () => sharedState.actions.openFastBtcDialog(!hasRbtcBalance),
    [hasRbtcBalance],
  );

  return (
    <>
      <UIHeader
        dataAttribute="dapp-header"
        logo={
          <SovrynLogo
            dataAttribute="header-logo"
            link="/"
            onClick={handleNavClick}
          />
        }
        isOpen={isOpen}
        menuIcon={
          <Button
            text={
              <Icon
                icon={isOpen ? IconNames.X_MARK : IconNames.HAMBURGER_MENU}
              />
            }
            style={ButtonStyle.ghost}
            onClick={toggle}
            className="text-white"
          />
        }
        menuItems={
          <ol className="flex flex-col gap-4 lg:flex-row w-full lg:w-auto">
            {menuItemsMapping.map((item, index) => (
              <li key={index}>
                <NavItem item={item} onClick={toggle} />
              </li>
            ))}
            <ProductLinks />
          </ol>
        }
        secondaryContent={
          <div className="relative">
            <ConnectWalletButton
              onConnect={connectWallet}
              onDisconnect={disconnectWallet}
              address={account}
              pending={pending}
              dataAttribute="dapp-header-connect"
            />
          </div>
        }
        extraContent={
          <>
            {account && (
              <>
                <Button
                  text={t(
                    hasRbtcBalance
                      ? translations.header.funding
                      : translations.header.fundWallet,
                  )}
                  style={
                    hasRbtcBalance ? ButtonStyle.secondary : ButtonStyle.primary
                  }
                  dataAttribute="dapp-header-funding"
                  onClick={enableFastBtc ? handleFastBtcClick : noop}
                  href={enableFastBtc ? '' : RSK_FAUCET}
                  hrefExternal={true}
                />
              </>
            )}
          </>
        }
      />
    </>
  );
};
