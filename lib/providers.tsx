'use client';

import { AbstraxionProvider, Abstraxion, useModal, ContractGrantDescription, SpendLimit } from '@burnt-labs/abstraxion';
import { CONTRACTS, NETWORK } from './contracts';

interface ProvidersProps {
  children: React.ReactNode;
}
interface AbstraxionConfig {
    contracts?: ContractGrantDescription[];
    rpcUrl?: string;
    stake?: boolean;
    bank?: SpendLimit[];
    callbackUrl?: string;
    treasury?: string;
    gasPrice?: string;
}


function AbstraxionWrapper({ children }: ProvidersProps) {
  const [, setShowModal] = useModal();

  return (
    <>
      {children}
      <Abstraxion onClose={() => setShowModal(false)} />
    </>
  );
}

export function Providers({ children }: ProvidersProps) {
  const abstraxionConfig : AbstraxionConfig = {
    treasury: CONTRACTS.treasury,
    contracts: [CONTRACTS.controller],
    rpcUrl: NETWORK.rpc,
  };

  return (
    <AbstraxionProvider config={abstraxionConfig}>
      <AbstraxionWrapper>{children}</AbstraxionWrapper>
    </AbstraxionProvider>
  );
}