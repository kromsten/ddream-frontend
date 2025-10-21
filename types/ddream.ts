// ============= Frontend Helper Types =============

export interface GameInfo {
  ticker: string;
  name: string;
  contract: string;
  phase: GamePhase;
  creator: string;
}

export interface StakingInfo {
  stake: string;
  denom: string;
  unbonding: string;
}

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

// ============= Contract Types =============

export type StakingParams = InstantiateMsg;

export interface InstantiateMsg {
  admin?: string;
  decimals?: number;
  denom: string;
  min_bond: string;
  referral_params?: ReferralParams;
  tokens_per_weight?: string;
  unbonding_period: Duration;
  weight_params?: WeightParams;
}

export interface ReferralParams {
  coefficients?: [number, string][];
  max_level?: number;
  pool_total: string;
}

export type CurveType = 
  | { 
      constant: {
        value: string;
        scale: number;
      }; 
    }
  | { 
      linear: {
        slope: string;
        scale: number;
      }; 
    }
  | { 
      square_root: {
        slope: string;
        scale: number;
      }; 
    }
  | { 
      concave_convex: {
        p1: string;
        p1_scale: number;
        p2: string;
        p2_scale: number;
      }; 
    };

export interface FairLaunchParams {
  target_cap: string;
  mint_supply_percent: number;
}

export interface TokenLaunchParams {
  referral_pool: string;
  curve_type: CurveType;
  fair_launch_params: FairLaunchParams;
  token_factory_fee?: Coin;
  stakers_bonus_percent?: number;
}

export interface TrackerConfig {
  code_id: number;
  token_factory_addr?: string;
}

export interface FactoryInitMsg {
  pair_configs: PairConfig[];
  token_code_id: number;
  fee_address?: string;
  generator_address?: string;
  owner: string;
  whitelist_code_id: number;
  coin_registry_address: string;
  tracker_config?: TrackerConfig;
}

export interface Coin {
  denom: string;
  amount: string;
}

export interface ControllerInstantiateMsg {
  admin?: string;
  staking_code_id: number;
  token_code_id: number;
  pair_code_id: number;
  factory_code_id: number;
  factory_init_msg: FactoryInitMsg;
  referral_pool?: string;
  curve_type: CurveType;
  staking_params: StakingParams;
  fair_launch_params: FairLaunchParams;
  token_factory_fee?: Coin;
  stakers_bonus_percent?: number;
  ticket_price: Coin;
}

// ============= Execute Messages =============

export type StakingExecuteMsg = 
  | { 
      bond: { 
        referrer?: string; 
      }; 
    }
  | { 
      unbond: { 
        tokens: string; 
      }; 
    }
  | { 
      claim: {}; 
    }
  | { 
      update_admin: { 
        admin?: string; 
      }; 
    };

export type GameQueryMsg = 
  | { 
      staking: StakingQueryMsg; 
    }
  | { 
      token: TokenQueryMsg; 
    };

export type GameExecuteMsg = 
  | { 
      staking: StakingExecuteMsg; 
    }
  | { 
      token: TokenExecuteMsg; 
    };

export type StakingQueryMsg = 
  | { 
      claims: { 
        address: string; 
      }; 
    }
  | { 
      staked: { 
        address: string; 
      }; 
    }
  | { 
      admin: {}; 
    }
  | { 
      total_weight: {}; 
    }
  | { 
      list_members: { 
        limit?: number; 
        start_after?: string | null; 
      }; 
    }
  | { 
      member: { 
        addr: string; 
      }; 
    };

export type ControllerExecuteMsg = 
  | { 
      update_admin: {
        admin: string;
      };
    }
  | { 
      create_game: {
        ticker: string;
        name: string;
      };
    }
  | { 
      launch_token: {
        ticker: string;
      };
    }
  | { 
      fair_launch: {
        ticker: string;
        amount: string;
      };
    }
  | { 
      execute_factory: {
        msg: FactoryExecuteMsg;
      };
    }
  | { 
      proxy_execute: {
        ticker: string;
        msg: GameExecuteMsg;
      };
    }
  | { 
      update_token_factory_fee: {
        fee?: Coin;
      };
    }
  | { 
      buy_ticket: {
        owner?: string;
      };
    };

export type TokenExecuteMsg = 
  | { 
      buy: {}; 
    }
  | { 
      transfer: { 
        amount: string; 
        recipient: string; 
      }; 
    }
  | { 
      burn: { 
        amount: string; 
      }; 
    }
  | { 
      send: { 
        amount: string; 
        contract: string; 
        msg: string; 
      }; 
    }
  | { 
      increase_allowance: { 
        amount: string; 
        spender: string; 
        expires?: Expiration; 
      }; 
    }
  | { 
      decrease_allowance: { 
        amount: string; 
        spender: string; 
        expires?: Expiration; 
      }; 
    }
  | { 
      transfer_from: { 
        amount: string; 
        owner: string; 
        recipient: string; 
      }; 
    }
  | { 
      send_from: { 
        amount: string; 
        contract: string; 
        msg: string; 
        owner: string; 
      }; 
    }
  | { 
      burn_from: { 
        amount: string; 
        owner: string; 
      }; 
    };

export type TokenQueryMsg = 
  | { 
      curve_info: {}; 
    }
  | { 
      balance: { 
        address: string; 
      }; 
    }
  | { 
      token_info: {}; 
    }
  | { 
      allowance: { 
        owner: string; 
        spender: string; 
      }; 
    };

export type ControllerQueryMsg = 
  | { 
      admin: {}; 
    }
  | { 
      pair_factory: {}; 
    }
  | { 
      config: {}; 
    }
  | { 
      params: {}; 
    }
  | { 
      game_info: {
        ticker: string;
      };
    }
  | { 
      game_data: {
        start_after?: string;
        limit?: number;
        with_state?: boolean;
      };
    }
  | { 
      proxy_query: {
        ticker: string;
        msg: GameQueryMsg;
      };
    }
  | { 
      created_games: {
        owner: string;
      };
    }
  | { 
      ticket_balance: {
        address: string;
      };
    };

// ============= Response Types =============

export interface ControllerAdminResponse {
  admin: string;
}

export interface AddressResponse {
  address: string;
}

export interface ConfigResponse {
  factory_address: string;
  admin: string;
  game_count: number;
  denom: string;
  ticket_price: Coin;
}

export interface ParamsResponse {
  staking_code_id: number;
  token_code_id: number;
  pair_code_id: number;
  staking_params: StakingParams;
  token_params: TokenLaunchParams;
}

export interface GameInfoResponse {
  game_info?: StoredGameInfo;
}

export interface GameDatum {
  game_info: StoredGameInfo;
  state?: GameState;
}

export interface GameDataResponse {
  games: GameDatum[];
}

export interface CreatedGamesResponse {
  games?: string[];
}

export interface TicketBalanceResponse {
  tickets: number;
  games: string[];
}

export type GamePhase = 
  | "staking"
  | "bonding"
  | "trading";

export type GameState = 
  | { 
      staking: TotalWeightResponse; 
    }
  | { 
      token: CurveInfoResponse; 
    };

export interface StoredGameInfo {
  name: string;
  symbol: string;
  contract: string;
  phase: GamePhase;
  creator: string;
}

export type StakingQueryResponse = 
  | { 
      claims: ClaimsResponse; 
    }
  | { 
      staked: StakedResponse; 
    }
  | { 
      admin: AdminResponse; 
    }
  | { 
      total_weight: TotalWeightResponse; 
    }
  | { 
      list_members: MemberListResponse; 
    }
  | { 
      member: MemberResponse; 
    };

export type TokenQueryResponse = 
  | { 
      curve_info: CurveInfoResponse; 
    }
  | { 
      balance: { balance: string }; 
    }
  | { 
      token_info: { 
        name: string; 
        symbol: string; 
        decimals: number; 
        total_supply: string; 
      }; 
    }
  | { 
      allowance: { 
        allowance: string; 
        expires: Expiration; 
      }; 
    };

export type GameQueryResponse = 
  | { 
      staking: StakingQueryResponse; 
    }
  | { 
      token: TokenQueryResponse; 
    };

export interface AdminResponse {
  admin?: string;
}

export type Expiration = 
  | { at_height: number; }
  | { at_time: Timestamp; }
  | { never: {}; };

export type Timestamp = string;

export interface ClaimsResponse {
  claims: Claim[];
}

export interface Claim {
  amount: string;
  release_at: Expiration;
}

export interface MemberListResponse {
  members: Member[];
}

export interface Member {
  addr: string;
  weight: number;
}

export interface MemberResponse {
  weight?: number;
  addr?: string;
  referrer?: string;
  ref_weight?: string;
}

export interface StakedResponse {
  stake: string;
  denom: string;
  unbonding: string;
}

export interface TotalWeightResponse {
  weight: number;
  ref_weight?: string;
}

export type Duration = 
  | { 
      height: number; 
    } 
  | { 
      time: number; 
    };

export type WeightParams = {
  square_root: {};
};

export interface ChainConfig {
  chainId: string;
  chainName: string;
  rpc: string;
  rest: string;
  bech32Prefix: string;
  coinDenom: string;
  coinMinimalDenom: string;
  coinDecimals: number;
}

export interface ContractDeployInfo {
  codeId: number;
  address: string;
}

export type ContractName = 
  | "factory"
  | "controller"
  | "staking"
  | "token"
  | "pair"
  | "registry"
  | "proxy"

export type ContractConfig = Record<ContractName, ContractDeployInfo>;

export interface Account {
  name: string;
  address: string;
  mnemonic: string;
}

export type CurveInfoResponse = {
  reserve: string;
  supply: string;
  spot_price: string;
  reserve_denom: string;
};

export type FactoryExecuteMsg = 
  | { 
      update_config: {
        token_code_id?: number;
        fee_address?: string;
        generator_address?: string;
        whitelist_code_id?: number;
        coin_registry_address?: string;
      };
    }
  | { 
      update_tracker_config: {
        tracker_code_id: number;
        token_factory_addr?: string;
      };
    }
  | { 
      update_pair_config: {
        config: PairConfig;
      };
    }
  | { 
      create_pair: {
        pair_type: PairType;
        asset_infos: AssetInfo[];
        init_params?: string;
      };
    }
  | { 
      deregister: {
        asset_infos: AssetInfo[];
      };
    };

export type AssetInfo = 
  | { 
      token: { 
        contract_addr: string; 
      }; 
    }
  | { 
      native_token: { 
        denom: string; 
      }; 
    };

export interface Asset {
  info: AssetInfo;
  amount: string;
}

export type FactoryQueryMsg =
  | { 
      config: {}; 
    }
  | { 
      pairs: {}; 
    };

export interface FactoryConfigResponse {
  owner: string;
  token_code_id: number;
  pair_configs: PairConfig[];
  fee_address?: string;
  generator_address?: string;
  whitelist_code_id: number;
  coin_registry_address: string;
}

export interface PairConfig {
  code_id: number;
  pair_type: PairType;
  total_fee_bps: number;
  maker_fee_bps: number;
  is_disabled: boolean;
  is_generator_disabled: boolean;
  permissioned: boolean;
}

export type PairType = 
  | { xyk: {} }
  | { stable: {} }
  | { custom: string };

export type PairQueryMsg =
  | { pair: {} }
  | { pool: {} }
  | { config: {} }
  | { 
      share: { 
        amount: string; 
      }; 
    }
  | { 
      simulation: {
        offer_asset: Asset;
        ask_asset_info?: AssetInfo;
      }; 
    }
  | { 
      reverse_simulation: {
        offer_asset_info?: AssetInfo;
        ask_asset: Asset;
      }; 
    }
  | { cumulative_prices: {} }
  | { query_compute_d: {} }
  | { 
      asset_balance_at: {
        asset_info: AssetInfo;
        block_height: string;
      }; 
    }
  | { 
      observe: { 
        seconds_ago: number; 
      }; 
    }
  | { 
      simulate_withdraw: { 
        lp_amount: string; 
      }; 
    }
  | { 
      simulate_provide: {
        assets: Asset[];
        slippage_tolerance?: string;
      }; 
    };

export interface PairInfo {
  asset_infos: AssetInfo[];
  contract_addr: string;
  liquidity_token: string;
  pair_type: PairType;
}

export interface PoolResponse {
  assets: Asset[];
  total_share: string;
}

export interface SimulationResponse {
  return_amount: string;
  spread_amount: string;
  commission_amount: string;
}

export interface ReverseSimulationResponse {
  offer_amount: string;
  spread_amount: string;
  commission_amount: string;
}

export interface CumulativePricesResponse {
  assets: Asset[];
  total_share: string;
  price0_cumulative_last: string;
  price1_cumulative_last: string;
}

export interface OracleObservation {
  timestamp: number;
  price: string;
}

// ============= Registry Types =============

export type RegistryExecuteMsg = 
  | { 
      create_account: {}; 
    }
  | { 
      forward: { 
        msg: string;
      }; 
    };

export type RegistryQueryMsg = 
  | { 
      account: { 
        address: string; 
      }; 
    };

export interface AccountResponse {
  account?: string;
}

// ============= Proxy Types =============

export interface ProxyInstantiateMsg {
  admins: string[];
  mutable: boolean;
}

export type ProxyExecuteMsg = 
  | { 
      game_execute: { 
        contract_addr: string;
        msg: GameExecuteMsg;
      }; 
    }
  | { 
      execute: { 
        msgs: CosmosMsg[];
      }; 
    };

export type ProxyQueryMsg = 
  | { 
      admin_list: {}; 
    };

export interface AdminListResponse {
  admins: string[];
  mutable: boolean;
}

export type CosmosMsg = 
  | { 
      bank: BankMsg; 
    }
  | { 
      staking: StakingMsg; 
    }
  | { 
      wasm: WasmMsg; 
    }
  | { 
      custom: any; 
    };

export type BankMsg = 
  | { 
      send: { 
        to_address: string;
        amount: Coin[];
      }; 
    };

export type StakingMsg = 
  | { 
      delegate: { 
        validator: string;
        amount: Coin;
      }; 
    }
  | { 
      undelegate: { 
        validator: string;
        amount: Coin;
      }; 
    }
  | { 
      redelegate: { 
        src_validator: string;
        dst_validator: string;
        amount: Coin;
      }; 
    };

export type WasmMsg = 
  | { 
      execute: { 
        contract_addr: string;
        msg: any;
        funds: Coin[];
      }; 
    }
  | { 
      instantiate: { 
        code_id: number;
        msg: any;
        funds: Coin[];
        label: string;
        admin?: string;
      }; 
    }
  | { 
      migrate: { 
        contract_addr: string;
        new_code_id: number;
        msg: any;
      }; 
    };