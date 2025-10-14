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
  /** List of active unbonding claims */
  claims: Claim[];
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

export type GamePhase = 
  /** Initial staking phase where users can stake tokens */
  | "staking"
  /** Bonding curve phase where token can be bought/sold */
  | "bonding"
  /** Fair launch phase where liquidity is provided and LP tokens are burned */
  | "trading";


export interface TotalWeightResponse {
  /** Total voting weight of all members */
  weight: number;
  /** Total referral weight accumulated across the entire system */
  ref_weight?: string;
}


export type GameState = 
  /** Staking phase - includes total weight information */
  | { 
      staking: TotalWeightResponse; 
    }
  /** Token phase - includes curve information */
  | { 
      token: CurveInfoResponse; 
    };

/** Information stored about a created game */
export interface StoredGameInfo {
  /** Game name (human readable) */
  name: string;
  /** Game symbol/ticker */
  symbol: string;
  /** The address of the staking contract for this game and then later turned into the token contract */
  contract: string;
  /** Current phase of the game (Staking, Bonding, or Trading) */
  phase: GamePhase;
  /** The owner/creator of the game */
  creator: string;
}


export interface GameDatum {
  /** Game information */
  game_info: StoredGameInfo;
  /** Optional state information depending on game phase */
  state?: GameState;
}

/** Response for game data query */
export interface GameDataResponse {
  /** List of games */
  games: GameDatum[];
}