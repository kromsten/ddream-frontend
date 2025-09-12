/**
 * DDream Constants
 * Centralized configuration values
 */

// Network configurations
export const NETWORKS = {
  testnet: {
    chainId: 'xion-testnet-1',
    chainName: 'XION Testnet',
    rpc: 'https://rpc.xion-testnet-1.burnt.com:443',
    rest: 'https://api.xion-testnet-1.burnt.com:443',
    explorer: 'https://explorer.burnt.com/xion-testnet-1',
    denom: 'uxion',
    decimals: 6,
    prefix: 'xion'
  },
  mainnet: {
    chainId: 'xion-1',
    chainName: 'XION',
    rpc: 'https://rpc.xion.burnt.com:443',
    rest: 'https://api.xion.burnt.com:443',
    explorer: 'https://explorer.burnt.com/xion',
    denom: 'uxion',
    decimals: 6,
    prefix: 'xion'
  }
};

// Get current network from environment
export const CURRENT_NETWORK = NETWORKS[process.env.NEXT_PUBLIC_NETWORK as keyof typeof NETWORKS] || NETWORKS.testnet;

// Time constants
export const UNBONDING_PERIOD_BLOCKS = 100; // 100 blocks as configured in contract
export const BLOCK_TIME_SECONDS = 6;
export const UNBONDING_PERIOD_MINUTES = Math.round((UNBONDING_PERIOD_BLOCKS * BLOCK_TIME_SECONDS) / 60); // ~10 minutes

// Transaction constants
export const DEFAULT_GAS_PRICE = '0.025uxion';
export const DEFAULT_GAS_LIMIT = 200000;

// UI constants
export const ITEMS_PER_PAGE = 20;
export const REFRESH_INTERVAL = 10000; // 10 seconds
export const TOAST_DURATION = 5000; // 5 seconds

// Validation constants
export const MIN_TICKER_LENGTH = 2;
export const MAX_TICKER_LENGTH = 10;
export const MIN_NAME_LENGTH = 3;
export const MAX_NAME_LENGTH = 50;
export const MIN_STAKE_AMOUNT = '0.1'; // Minimum 0.1 XION

// Feature flags
export const FEATURES = {
  GASLESS: process.env.NEXT_PUBLIC_ENABLE_GASLESS === 'true',
  TRADING: process.env.NEXT_PUBLIC_ENABLE_TRADING === 'true',
  STAKING: process.env.NEXT_PUBLIC_ENABLE_STAKING === 'true',
  REFERRALS: true,
  FAIR_LAUNCH: true
};

// Default values
export const DEFAULTS = {
  SLIPPAGE: 0.05, // 5%
  DEADLINE: 20, // 20 minutes
  APY: 12.5, // Default APY for display
  REFERRAL_BONUS: 0.1 // 10% referral bonus
};