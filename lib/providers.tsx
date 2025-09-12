'use client';

import { AbstraxionProvider, Abstraxion, useModal } from '@burnt-labs/abstraxion';
import { CONTRACTS, NETWORK } from './contracts';

interface ProvidersProps {
  children: React.ReactNode;
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
  const abstraxionConfig = {
    treasury: CONTRACTS.treasury,
    rpcUrl: NETWORK.rpc,
    restUrl: NETWORK.rest,
  };

  return (
    <AbstraxionProvider config={abstraxionConfig}>
      <AbstraxionWrapper>{children}</AbstraxionWrapper>
    </AbstraxionProvider>
  );
}