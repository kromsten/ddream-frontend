/**
 * DDream TypeScript Types
 * Following Burnt Labs patterns for contract messages
 */

// Game Info stored in contract
export interface GameInfo {
  ticker: string;
  name: string;
  contract: string;
  token_launched: boolean;
}

// Staking Info (from staked query)
export interface StakingInfo {
  stake: string;
  denom: string;
}

// Claims Response (from claims query)
export interface ClaimsResponse {
  claims: Claim[];
}

// Individual Claim/Unbond Info
export interface Claim {
  amount: string;
  release_at: {
    at_height?: number;
    at_time?: string;
    never?: {};
  };
}

// Token Market Info
export interface TokenMarketInfo {
  ticker: string;
  name: string;
  total_supply: string;
  market_cap: string;
  price: string;
  is_launched: boolean;
}

// ============= Contract Execute Messages =============

// Controller Messages
export interface CreateGameMsg {
  create_game: {
    ticker: string;
    name: string;
  };
}

export interface LaunchTokenMsg {
  launch_token: {
    ticker: string;
  };
}

export interface FairLaunchMsg {
  fair_launch: {
    ticker: string;
  };
}

// Staking Messages
export interface BondMsg {
  bond: {
    referrer?: string;
  };
}

export interface UnbondMsg {
  unbond: {
    tokens: string;
  };
}

export interface ClaimMsg {
  claim: {};
}

// Token Messages
export interface BuyMsg {
  buy: {};
}

export interface SellMsg {
  burn: {
    amount: string;
  };
}

// ============= Contract Query Messages =============

export interface GameInfoQuery {
  game_info: {
    ticker: string;
  };
}

export interface StakedQuery {
  staked: {
    address: string;
  };
}

export interface MemberQuery {
  member: {
    addr: string;
  };
}

export interface ClaimsQuery {
  claims: {
    address: string;
  };
}

export interface TokenInfoQuery {
  token_info: {};
}

export interface CurveInfoQuery {
  curve_info: {};
}

export interface BalanceQuery {
  balance: {
    address: string;
  };
}

// ============= Response Types =============

export interface StakedResponse {
  stake: string;
}

export interface MemberResponse {
  weight: string;
  referral_weight?: string;
}

export interface MemberListResponse {
  members: Array<{
    addr: string;
    weight: string;
    ref_weight?: string;
  }>;
}

export interface ClaimsResponse {
  claims: UnbondInfo[];
}

export interface TokenInfoResponse {
  name: string;
  symbol: string;
  decimals: number;
  total_supply: string;
}

export interface CurveInfoResponse {
  reserve: string;
  supply: string;
  spot_price: string;
  reserve_denom: string;
}

export interface BalanceResponse {
  balance: string;
}