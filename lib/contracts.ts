/**
 * Contract Utilities
 * Following Burnt Labs patterns for contract interactions
 */

import { SigningCosmWasmClient, CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { coins } from '@cosmjs/stargate';

// Contract addresses from deployment
export const CONTRACTS = {
  controller: process.env.NEXT_PUBLIC_CONTROLLER_ADDRESS || 
    'xion19h9yae5vwa5ctwnwr4yxnkj9x6gthtlevqu9che8lqjngt7p72lslt3yuy',
  treasury: process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '',
};

// Network configuration
export const NETWORK = {
  rpc: process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.xion-testnet-2.burnt.com:443',
  rest: process.env.NEXT_PUBLIC_REST_URL || 'https://api.xion-testnet-2.burnt.com',
  chainId: 'xion-testnet-2',
  denom: 'uxion',
  decimals: 6,
};

/**
 * Convert XION to micro units (uxion)
 */
export function xionToMicro(amount: string): string {
  const parts = amount.split('.');
  const whole = parts[0] || '0';
  const fraction = (parts[1] || '').padEnd(NETWORK.decimals, '0').slice(0, NETWORK.decimals);
  return whole + fraction;
}

/**
 * Convert micro units to XION
 */
export function microToXion(amount: string): string {
  const padded = amount.padStart(NETWORK.decimals + 1, '0');
  const whole = padded.slice(0, -NETWORK.decimals) || '0';
  const fraction = padded.slice(-NETWORK.decimals).replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole;
}

/**
 * Format amount for display
 */
export function formatAmount(amount: string, symbol: string = 'XION'): string {
  const value = parseFloat(microToXion(amount));
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${symbol}`;
}

/**
 * Query contract helper
 */
export async function queryContract<T>(
  client: CosmWasmClient | undefined,
  contractAddress: string,
  query: any
): Promise<T | null> {
  if (!client) return null;
  
  try {
    const result = await client.queryContractSmart(contractAddress, query);
    return result as T;
  } catch (error) {
    console.error('Query error:', error);
    return null;
  }
}

/**
 * Execute contract helper
 */
export async function executeContract(
  client: any, // Use any type to accept both SigningCosmWasmClient and GranteeSignerClient
  senderAddress: string,
  contractAddress: string,
  msg: any,
  funds?: { amount: string; denom: string }[]
): Promise<any> {
  try {
    const result = await client.execute(
      senderAddress,
      contractAddress,
      msg,
      'auto',
      undefined,
      funds
    );
    return result;
  } catch (error) {
    console.error('Execute error:', error);
    throw error;
  }
}

/**
 * Create coins for transaction
 */
export function createCoins(amount: string): any[] {
  return coins(xionToMicro(amount), NETWORK.denom);
}

/**
 * Get explorer link for transaction
 */
export function getExplorerTxLink(txHash: string): string {
  return `https://www.mintscan.io/xion-testnet/tx/${txHash}`;
}

/**
 * Get explorer link for contract
 */
export function getExplorerContractLink(address: string): string {
  return `https://www.mintscan.io/xion-testnet/address/${address}`;
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

/**
 * Validate ticker format
 */
export function isValidTicker(ticker: string): boolean {
  return /^[A-Z0-9]{2,10}$/.test(ticker.toUpperCase());
}

/**
 * Validate amount format
 */
export function isValidAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
}

/**
 * Convert blocks to time estimate
 */
export function blocksToTimeEstimate(blocks: number): string {
  const BLOCK_TIME = 6; // 6 seconds per block on XION
  const totalSeconds = blocks * BLOCK_TIME;
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return `${totalSeconds} second${totalSeconds > 1 ? 's' : ''}`;
  }
}

/**
 * Calculate estimated block height from current + blocks
 */
export function estimateBlockHeight(currentHeight: number, blocksToAdd: number): number {
  return currentHeight + blocksToAdd;
}