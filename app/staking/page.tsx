/**
 * DDream Staking Page
 * Dedicated staking interface for XION tokens
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAbstraxionAccount, useAbstraxionSigningClient, useModal } from "@burnt-labs/abstraxion";
import { Navigation } from "@/components/Navigation";
import { 
  queryContract, 
  executeContract, 
  formatAmount,
  xionToMicro,
  microToXion,
  CONTRACTS,
  NETWORK
} from "@/lib/contracts";
import type { 
  GameInfo,
  StakingInfo,
  ClaimsResponse,
  Claim,
  BondMsg,
  UnbondMsg,
  ClaimMsg,
  MemberResponse,
  MemberListResponse
} from "@/types/ddream";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

interface StakingStats {
  totalStaked: string;
  totalStakers: number;
  apy: number;
  yourWeight: string;
  referralWeight: string;
}

interface Member {
  addr: string;
  weight: string;
  ref_weight?: string;
}

export default function Staking() {
  const { data: account } = useAbstraxionAccount();
  const { client: signingClient } = useAbstraxionSigningClient();
  const [, setShowModal] = useModal();
  
  // State
  const [games, setGames] = useState<GameInfo[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>("");
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [stakingStats, setStakingStats] = useState<StakingStats>({
    totalStaked: "0",
    totalStakers: 0,
    apy: 0, // APY will be set when reward system is implemented
    yourWeight: "0",
    referralWeight: "0"
  });
  const [xionBalance, setXionBalance] = useState<string>("0");
  const [topStakers, setTopStakers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPosition, setLoadingPosition] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  
  // Form state
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referrerInfo, setReferrerInfo] = useState<MemberResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake' | 'rewards'>('stake');
  
  // Manual game addition
  const [showAddGame, setShowAddGame] = useState(false);
  const [manualTicker, setManualTicker] = useState("");
  const [addingGame, setAddingGame] = useState(false);
  
  // Query client
  const [queryClient, setQueryClient] = useState<CosmWasmClient | null>(null);
  const isLoadingRef = useRef(false);
  
  // Define callback functions before useEffect hooks
  const loadGames = useCallback(async () => {
    if (!queryClient) return;
    
    try {
      const gameList: GameInfo[] = [];
      
      // Load games from localStorage
      const storedGames = localStorage.getItem('ddream_games_detailed');
      const gamesData = storedGames ? JSON.parse(storedGames) : {};
      
      // Query each game from blockchain
      for (const ticker of Object.keys(gamesData)) {
        try {
          const result = await queryContract<any>(queryClient, CONTRACTS.controller, {
            game_info: { ticker }
          });
          
          if (result?.game_info) {
            gameList.push({
              ticker: result.game_info.symbol || ticker,
              name: result.game_info.name,
              contract: result.game_info.contract,
              token_launched: result.game_info.token_launched
            });
          }
        } catch (err) {
          console.log(`Game ${ticker} not found on chain`);
        }
      }
      
      setGames(gameList);
      if (gameList.length > 0 && !selectedGame) {
        setSelectedGame(gameList[0].ticker);
      }
    } catch (err) {
      console.error("Error loading games:", err);
    }
  }, [queryClient]);
  
  const loadStakingData = useCallback(async () => {
    if (!queryClient || !account?.bech32Address || !selectedGame) {
      console.log("Skipping staking data load:", { 
        queryClient: !!queryClient, 
        account: !!account?.bech32Address, 
        selectedGame 
      });
      return;
    }
    
    // Prevent concurrent calls
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    
    setLoadingPosition(true);
    try {
      // Find the game contract
      const game = games.find(g => g.ticker === selectedGame);
      if (!game || !game.contract) {
        console.error("Game contract not found for staking query");
        return;
      }
      
      console.log("Loading staking data from game:", game.ticker, "contract:", game.contract);
      
      // First, check if this is actually a staking contract by trying to query it
      // If it fails with specific errors, it might have been migrated
      let isStakingContract = true;
      
      try {
        // Try a staking-specific query to see if contract supports it
        await queryContract<any>(queryClient, game.contract, {
          total_weight: {}
        });
      } catch (err: any) {
        const errMsg = err.message || err.toString();
        // If we get an "unknown variant" or similar error, it's likely migrated
        if (errMsg.includes('unknown variant') || errMsg.includes('unrecognized') || errMsg.includes('unauthorized')) {
          console.log("Contract appears to be migrated to token contract");
          isStakingContract = false;
          
          // Update local storage to reflect the actual state
          const storedGames = localStorage.getItem('ddream_games_detailed');
          if (storedGames) {
            const gamesData = JSON.parse(storedGames);
            if (gamesData[game.ticker]) {
              gamesData[game.ticker].token_launched = true;
              localStorage.setItem('ddream_games_detailed', JSON.stringify(gamesData));
            }
          }
        }
      }
      
      // If it's not a staking contract or token is launched, show appropriate message
      if (!isStakingContract || game.token_launched) {
        console.log("Token already launched or contract migrated, staking not available");
        setStakingInfo(null);
        setError("This game's token has been launched. Staking is no longer available.");
        return;
      }
      
      // Try to query staking info from game contract
      try {
        const staking = await queryContract<StakingInfo>(queryClient, game.contract, {
          staked: { address: account.bech32Address }
        });
        setStakingInfo(staking);
        setError(""); // Clear any previous errors
      } catch (queryErr: any) {
        console.error("Failed to query staking info:", queryErr);
        console.error("Query details:", {
          contract: game.contract,
          address: account.bech32Address,
          error: queryErr.message
        });
        
        // Check if error is because user has no stake (normal case)
        // The contract returns stake: "0" for users who haven't staked
        // But if there's an actual query error, we still want to handle it
        const errorMessage = queryErr.message || queryErr.toString();
        
        // If the query failed but it's not a critical error, assume no stake
        // Common error patterns for "no stake" or similar non-critical cases
        if (errorMessage.includes('not found') || 
            errorMessage.includes('does not exist') ||
            errorMessage.includes('No stake')) {
          // User has no stake yet, show as 0
          setStakingInfo({
            stake: "0",
            denom: NETWORK.denom
          });
        } else {
          // Actual error, set to null which will show "No staking position yet"
          // But actually, let's try to always show something
          // Even on error, show 0 stake so UI is consistent
          setStakingInfo({
            stake: "0",
            denom: NETWORK.denom
          });
        }
      }
      
      // Query claims/unbondings separately
      try {
        const claimsResponse = await queryContract<ClaimsResponse>(queryClient, game.contract, {
          claims: { address: account.bech32Address }
        });
        setClaims(claimsResponse?.claims || []);
      } catch (claimsErr: any) {
        console.log("No claims found or error querying claims:", claimsErr);
        setClaims([]);
      }
      
      // Try to load member info for weights from game contract
      try {
        const member = await queryContract<MemberResponse>(queryClient, game.contract, {
          member: { addr: account.bech32Address }
        });
        
        if (member) {
          setStakingStats(prev => ({
            ...prev,
            yourWeight: member.weight,
            referralWeight: member.referral_weight || "0"
          }));
        }
      } catch (err) {
        console.log("Could not load member info:", err);
      }
      
      // Load XION balance
      if (account?.bech32Address) {
        try {
          const balance = await queryClient.getBalance(account.bech32Address, NETWORK.denom);
          setXionBalance(balance?.amount || "0");
        } catch (err) {
          console.log("Could not load balance:", err);
          setXionBalance("0");
        }
      }
      
      // Load top stakers from game contract
      try {
        const memberList = await queryContract<MemberListResponse>(queryClient, game.contract, {
          list_members: { limit: 10 }
        });
        
        if (memberList?.members) {
          // Sort by weight descending and take top 10
          const sorted = memberList.members
            .sort((a, b) => parseInt(b.weight) - parseInt(a.weight))
            .slice(0, 10);
          setTopStakers(sorted);
          
          // Update total stakers count
          setStakingStats(prev => ({
            ...prev,
            totalStakers: memberList.members.length
          }));
        }
      } catch (err) {
        console.log("Could not load member list:", err);
      }
      
      // Load total weight for stats from game contract
      try {
        const totalWeight = await queryContract<any>(queryClient, game.contract, {
          total_weight: {}
        });
        
        if (totalWeight) {
          setStakingStats(prev => ({
            ...prev,
            totalStaked: totalWeight.weight || "0"
          }));
        }
      } catch (err) {
        console.log("Could not load total weight:", err);
      }
    } catch (err) {
      console.error("Error loading staking data:", err);
    } finally {
      setLoadingPosition(false);
      isLoadingRef.current = false;
    }
  }, [queryClient, account, selectedGame, games]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Initialize query client
  useEffect(() => {
    CosmWasmClient.connect(NETWORK.rpc).then(setQueryClient).catch(console.error);
  }, []);
  
  // Load games on mount
  useEffect(() => {
    if (queryClient) {
      loadGames();
    }
  }, [queryClient, loadGames]);
  
  // Load staking data when game is selected
  useEffect(() => {
    if (queryClient && account?.bech32Address && selectedGame) {
      loadStakingData();
    }
  }, [queryClient, account?.bech32Address, selectedGame]); // Use account.bech32Address instead of account object
  
  // Calculate estimated rewards
  function calculateEstimatedRewards(): string {
    // Rewards calculation will be implemented when reward system is configured
    return "TBD";
  }
  
  // Stake tokens
  async function handleStake() {
    if (!signingClient || !account || !stakeAmount || !selectedGame) return;
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      // Find the game contract
      const game = games.find(g => g.ticker === selectedGame);
      if (!game || !game.contract) {
        setError("Game contract not found");
        return;
      }
      
      // Check if token has been launched (contract migrated)
      if (game.token_launched) {
        setError("Cannot stake: This game's token has been launched. Staking is no longer available.");
        return;
      }
      
      // Validate minimum stake amount (10 XION)
      const MIN_STAKE = 10;
      if (parseFloat(stakeAmount) < MIN_STAKE) {
        setError(`Minimum stake amount is ${MIN_STAKE} XION`);
        return;
      }
      
      console.log("Staking to game contract:", game.contract);
      console.log("Token launched:", game.token_launched);
      console.log("Staking amount:", stakeAmount, "XION");
      console.log("Amount in micro:", xionToMicro(stakeAmount));
      
      const msg: BondMsg = {
        bond: {
          ...(referralCode && { referrer: referralCode })
        }
      };
      
      await executeContract(
        signingClient,
        account.bech32Address,
        game.contract,
        msg,
        [{ amount: xionToMicro(stakeAmount), denom: NETWORK.denom }]
      );
      
      setSuccess(`Successfully staked ${stakeAmount} XION!`);
      await loadStakingData();
      setStakeAmount("");
      setReferralCode("");
    } catch (err: any) {
      console.error("Staking error:", err);
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        details: err.details,
        logs: err.logs,
        rawLog: err.rawLog
      });
      
      // Check if this is an "unauthorized" error indicating a migrated contract
      if (err.message?.includes('unauthorized')) {
        setError("This contract appears to have been migrated. Please refresh the page and try a different game.");
        
        // Update local storage to mark as launched
        const storedGames = localStorage.getItem('ddream_games_detailed');
        if (storedGames) {
          const gamesData = JSON.parse(storedGames);
          if (gamesData[selectedGame]) {
            gamesData[selectedGame].token_launched = true;
            localStorage.setItem('ddream_games_detailed', JSON.stringify(gamesData));
          }
        }
        
        // Reload games to reflect the change
        await loadGames();
      } else {
        setError(err.message || "Failed to stake");
      }
    } finally {
      setLoading(false);
    }
  }
  
  // Unstake tokens
  async function handleUnstake() {
    if (!signingClient || !account || !unstakeAmount || !selectedGame) return;
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      // Find the game contract
      const game = games.find(g => g.ticker === selectedGame);
      if (!game || !game.contract) {
        setError("Game contract not found");
        return;
      }
      
      console.log("Unstaking from game contract:", game.contract);
      
      const msg: UnbondMsg = {
        unbond: {
          tokens: xionToMicro(unstakeAmount)
        }
      };
      
      await executeContract(
        signingClient,
        account.bech32Address,
        game.contract,
        msg
      );
      
      setSuccess(`Successfully initiated unstaking of ${unstakeAmount} XION!`);
      await loadStakingData();
      setUnstakeAmount("");
    } catch (err: any) {
      setError(err.message || "Failed to unstake");
    } finally {
      setLoading(false);
    }
  }
  
  // Claim unbonded tokens
  async function handleClaim() {
    if (!signingClient || !account || !selectedGame) return;
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      // Find the game contract
      const game = games.find(g => g.ticker === selectedGame);
      if (!game || !game.contract) {
        setError("Game contract not found");
        return;
      }
      
      console.log("Claiming from game contract:", game.contract);
      
      const msg: ClaimMsg = {
        claim: {}
      };
      
      await executeContract(
        signingClient,
        account.bech32Address,
        game.contract,
        msg
      );
      
      setSuccess("Successfully claimed unbonded tokens!");
      await loadStakingData();
    } catch (err: any) {
      setError(err.message || "Failed to claim");
    } finally {
      setLoading(false);
    }
  }
  
  // Handle manual game addition
  async function handleAddGame() {
    if (!queryClient || !manualTicker) return;
    
    setAddingGame(true);
    setError("");
    
    try {
      // Query the game from the controller
      const result = await queryContract<any>(queryClient, CONTRACTS.controller, {
        game_info: { ticker: manualTicker.toUpperCase() }
      });
      
      if (!result?.game_info) {
        setError(`Game "${manualTicker}" not found on chain`);
        return;
      }
      
      // Create game data structure
      const gameData = {
        ticker: result.game_info.symbol || manualTicker.toUpperCase(),
        name: result.game_info.name,
        contract: result.game_info.contract,
        token_launched: result.game_info.token_launched,
        creator: "unknown", // We don't know the creator from the query
        createdAt: Date.now(),
        manually_added: true
      };
      
      // Store in localStorage
      const storedGames = localStorage.getItem('ddream_games_detailed');
      const gamesMap = storedGames ? JSON.parse(storedGames) : {};
      gamesMap[gameData.ticker] = gameData;
      localStorage.setItem('ddream_games_detailed', JSON.stringify(gamesMap));
      
      // Reload games
      await loadGames();
      setSelectedGame(gameData.ticker);
      setSuccess(`Game "${gameData.ticker}" added successfully!`);
      setManualTicker("");
      setShowAddGame(false);
    } catch (err: any) {
      console.error("Error adding game:", err);
      setError(`Failed to add game: ${err.message || "Unknown error"}`);
    } finally {
      setAddingGame(false);
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Staking</h1>
          <p className="mt-2 text-gray-600">Stake XION tokens to earn rewards and support the protocol</p>
        </div>
        
        {/* Game Selector */}
        {games.length > 0 && (
          <div className="card mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Select Game to Stake In</h2>
              <button
                onClick={() => setShowAddGame(!showAddGame)}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                + Add Game Manually
              </button>
            </div>
            
            {/* Manual Game Addition Form */}
            {showAddGame && (
              <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualTicker}
                    onChange={(e) => setManualTicker(e.target.value.toUpperCase())}
                    placeholder="Enter game ticker (e.g., TEST)"
                    className="flex-1 px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={addingGame}
                  />
                  <button
                    onClick={handleAddGame}
                    disabled={addingGame || !manualTicker}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingGame ? "Adding..." : "Add Game"}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddGame(false);
                      setManualTicker("");
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
                <p className="mt-2 text-xs text-purple-700">
                  Enter the ticker symbol of a game created on the blockchain to add it to your list
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {games.map((game) => (
                <button
                  key={game.ticker}
                  onClick={() => setSelectedGame(game.ticker)}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    selectedGame === game.ticker
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  ${game.ticker}
                  {game.token_launched ? (
                    <span className="block text-xs opacity-75 mt-1 text-orange-400">Launched</span>
                  ) : (
                    <span className="block text-xs opacity-75 mt-1 text-green-400">Stakeable</span>
                  )}
                </button>
              ))}
            </div>
            {selectedGame && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  {games.find(g => g.ticker === selectedGame)?.token_launched ? (
                  <>
                    <span className="text-orange-600 font-semibold">
                      ⚠️ {games.find(g => g.ticker === selectedGame)?.name} (${selectedGame})
                    </span>
                    <span className="text-orange-600"> - Token launched, staking unavailable</span>
                  </>
                ) : (
                  <>
                    Staking in: <span className="font-semibold text-gray-900">
                      {games.find(g => g.ticker === selectedGame)?.name} (${selectedGame})
                    </span>
                  </>
                )}
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* No Games Message */}
        {games.length === 0 && (
          <div className="card mb-6 bg-yellow-50 border-yellow-200">
            <p className="text-yellow-800 mb-3">
              No games available for staking. Create a game first from the Dashboard or add an existing game manually.
            </p>
            
            {/* Manual Game Addition Form for empty state */}
            <div className="mt-4 p-4 bg-white rounded-lg border border-yellow-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">Add Existing Game</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualTicker}
                  onChange={(e) => setManualTicker(e.target.value.toUpperCase())}
                  placeholder="Enter game ticker (e.g., TEST)"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={addingGame}
                />
                <button
                  onClick={handleAddGame}
                  disabled={addingGame || !manualTicker}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingGame ? "Adding..." : "Add Game"}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-600">
                If you know a game ticker that was created on the blockchain, enter it above to add it to your list
              </p>
            </div>
          </div>
        )}
        
        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{success}</p>
          </div>
        )}
        
        {/* Staking Stats - Only show for non-launched games */}
        {selectedGame && !games.find(g => g.ticker === selectedGame)?.token_launched && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <p className="text-sm text-gray-600">Total Weight</p>
              <p className="text-2xl font-bold">{stakingStats.totalStaked}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Total Stakers</p>
              <p className="text-2xl font-bold">{stakingStats.totalStakers.toLocaleString()}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Token Launch</p>
              <p className="text-2xl font-bold text-blue-600">Pending</p>
              <p className="text-xs text-gray-500">One-time distribution</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Your Weight</p>
              <p className="text-2xl font-bold">{stakingStats.yourWeight}</p>
            </div>
          </div>
        )}
        
        {account && selectedGame ? (
          games.find(g => g.ticker === selectedGame)?.token_launched ? (
            // Token has been launched - show migration notice
            <div className="card bg-orange-50 border-orange-200">
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-2xl font-bold text-orange-900 mb-2">
                  Token Launched!
                </h3>
                <p className="text-orange-700 mb-6">
                  The ${selectedGame} token has been launched and migrated to a trading contract.
                  Staking is no longer available for this game.
                </p>
                <p className="text-sm text-gray-600 mt-4">
                  The token for ${selectedGame} has been launched and is now a tradable asset.
                </p>
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Your Position */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Your Position</h2>
                {loadingPosition ? (
                  <div className="space-y-3">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                    </div>
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ) : stakingInfo ? (
                  stakingInfo.stake === "0" ? (
                    <div className="space-y-3">
                      <p className="text-gray-500">No staking position yet</p>
                      <p className="text-sm text-gray-400">
                        Stake XION to earn weight and receive tokens at launch
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Staked Amount</p>
                        <p className="text-2xl font-bold">{formatAmount(stakingInfo.stake)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Your Weight</p>
                        <p className="text-lg font-semibold">{stakingStats.yourWeight}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Referral Weight</p>
                        <p className="text-lg font-semibold">
                          {stakingStats.referralWeight}
                        </p>
                      </div>
                      <div className="pt-3 border-t">
                        <p className="text-sm text-gray-600">Token Allocation</p>
                        <p className="text-lg font-semibold text-blue-600">
                          At Launch
                        </p>
                        <p className="text-xs text-gray-500">Proportional to stake</p>
                      </div>
                    </div>
                  )
                ) : (
                  <p className="text-gray-500">Connect wallet to view position</p>
                )}
              </div>
              
              {/* Pending Unbonds */}
              {claims.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold mb-3">Pending Unbonds ({claims.length})</h3>
                  <div className="space-y-2">
                    {claims.map((claim, i) => {
                      const isReady = claim.release_at.at_time ? 
                        Date.now() > parseInt(claim.release_at.at_time) / 1000000 :
                        claim.release_at.at_height ? true : false;
                      
                      return (
                        <div key={i} className={`p-3 rounded-lg ${isReady ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{formatAmount(claim.amount)}</p>
                              <p className="text-sm text-gray-600">
                                {claim.release_at.at_time ? 
                                  `${isReady ? '✅ Ready' : '⏳ Ready'}: ${new Date(parseInt(claim.release_at.at_time) / 1000000).toLocaleDateString()}` :
                                  claim.release_at.at_height ?
                                  `At block: ${claim.release_at.at_height} (~10 minutes from unstake)` :
                                  'Never expires'
                                }
                              </p>
                            </div>
                            <span className="text-xs text-gray-500">#{i + 1}</span>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Total unbonding amount */}
                    <div className="pt-2 mt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold">Total Unbonding:</span>
                        <span className="font-bold">
                          {formatAmount(claims.reduce((sum, c) => sum + BigInt(c.amount), 0n).toString())}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleClaim}
                      disabled={loading}
                      className="w-full btn-primary"
                    >
                      {loading ? "Claiming..." : "Claim All Ready"}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Top Stakers Leaderboard */}
              {topStakers.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold mb-3">Top Stakers</h3>
                  <div className="space-y-2">
                    {topStakers.map((member, index) => (
                      <div key={member.addr} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${
                            index === 0 ? 'text-yellow-500' :
                            index === 1 ? 'text-gray-400' :
                            index === 2 ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            #{index + 1}
                          </span>
                          <span className="text-sm font-mono">
                            {member.addr === account?.bech32Address 
                              ? 'You' 
                              : `${member.addr.slice(0, 8)}...${member.addr.slice(-6)}`
                            }
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{member.weight}</p>
                          {member.ref_weight && parseInt(member.ref_weight) > 0 && (
                            <p className="text-xs text-gray-500">+{member.ref_weight} ref</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Staking Interface */}
            <div className="lg:col-span-2">
              <div className="card">
                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setActiveTab('stake')}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'stake'
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Stake
                  </button>
                  <button
                    onClick={() => setActiveTab('unstake')}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'unstake'
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Unstake
                  </button>
                  <button
                    onClick={() => setActiveTab('rewards')}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'rewards'
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Rewards
                  </button>
                </div>
                
                {/* Tab Content */}
                {activeTab === 'stake' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Stake XION</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amount to Stake
                        </label>
                        <input
                          type="number"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          placeholder="0.0"
                          className="input w-full"
                          disabled={loading}
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Available: {formatAmount(xionBalance)}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Referral Code (Optional)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={referralCode}
                            onChange={async (e) => {
                              const value = e.target.value;
                              setReferralCode(value);
                              
                              // Validate referrer if it's a valid address format
                              if (value.startsWith('xion') && value.length > 40) {
                                try {
                                  const game = games.find(g => g.ticker === selectedGame);
                                  if (game?.contract && queryClient) {
                                    const member = await queryContract<MemberResponse>(
                                      queryClient, 
                                      game.contract, 
                                      { member: { addr: value } }
                                    );
                                    setReferrerInfo(member);
                                  }
                                } catch (err) {
                                  setReferrerInfo(null);
                                }
                              } else {
                                setReferrerInfo(null);
                              }
                            }}
                            placeholder="Enter referrer's address (xion...)"
                            className="input w-full pr-10"
                            disabled={loading}
                          />
                          {referrerInfo && referrerInfo.weight && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500">
                              ✓
                            </span>
                          )}
                        </div>
                        {referrerInfo && referrerInfo.weight ? (
                          <p className="mt-1 text-sm text-green-600">
                            Valid referrer (Weight: {referrerInfo.weight})
                          </p>
                        ) : referralCode && referralCode.startsWith('xion') ? (
                          <p className="mt-1 text-sm text-red-600">
                            Invalid referrer address or not staking
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-gray-500">
                            Add a referrer to earn them rewards at token launch
                          </p>
                        )}
                      </div>
                      
                      <button
                        onClick={handleStake}
                        disabled={loading || !stakeAmount || parseFloat(stakeAmount) <= 0}
                        className="w-full btn-primary"
                      >
                        {loading ? "Staking..." : "Stake XION"}
                      </button>
                    </div>
                  </div>
                )}
                
                {activeTab === 'unstake' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Unstake XION</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amount to Unstake
                        </label>
                        <input
                          type="number"
                          value={unstakeAmount}
                          onChange={(e) => setUnstakeAmount(e.target.value)}
                          placeholder="0.0"
                          className="input w-full"
                          disabled={loading}
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Staked: {stakingInfo ? formatAmount(stakingInfo.stake) : "0 XION"}
                        </p>
                      </div>
                      
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Note:</strong> Unstaking has a 100 blocks (~10 minutes) unbonding period. 
                          You will not earn rewards during this time.
                        </p>
                      </div>
                      
                      <button
                        onClick={handleUnstake}
                        disabled={loading || !unstakeAmount || parseFloat(unstakeAmount) <= 0}
                        className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Unstaking..." : "Unstake XION"}
                      </button>
                    </div>
                  </div>
                )}
                
                {activeTab === 'rewards' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Token Allocation at Launch</h3>
                    <div className="space-y-4">
                      {/* Token Allocation Calculator */}
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-3">Your Estimated Token Allocation</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Your Stake:</span>
                            <span className="font-semibold">{stakingInfo ? formatAmount(stakingInfo.stake) : "0 XION"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Staked:</span>
                            <span className="font-semibold">{stakingStats.totalStaked > 0 ? `${stakingStats.totalStaked} weight` : "0"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Your Share:</span>
                            <span className="font-semibold text-blue-600">
                              {stakingInfo && stakingStats.totalStaked > 0 ? 
                                `${((parseFloat(stakingInfo.stake) / parseFloat(stakingStats.totalStaked)) * 100).toFixed(2)}%` : 
                                "0%"}
                            </span>
                          </div>
                          <div className="pt-2 mt-2 border-t border-blue-200">
                            <p className="text-xs text-blue-800">
                              You'll receive tokens proportional to your stake when the token launches.
                              The exact amount depends on the total supply calculated by the bonding curve.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <h4 className="font-semibold text-purple-900 mb-2">Referral System (Active)</h4>
                          <ul className="text-sm text-purple-800 space-y-1">
                            <li>• <strong>2-level deep</strong> - Your referrer and their referrer both earn</li>
                            <li>• <strong>1M token pool</strong> - Distributed proportionally at launch</li>
                            <li>• <strong>Share your address</strong> - Earn when others use you as referrer</li>
                            <li>• <strong>Automatic distribution</strong> - Paid out at token launch</li>
                          </ul>
                          <div className="mt-3 p-3 bg-purple-100 rounded">
                            <p className="text-xs font-semibold text-purple-900 mb-1">Your Referral Address:</p>
                            <code className="text-xs text-purple-700 break-all">
                              {account?.bech32Address || "Connect wallet to see address"}
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          )
        ) : !account ? (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Wallet Connection Required</h3>
            <p className="text-gray-600 mb-6">Connect your wallet to start staking XION tokens</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Connect with Email or Social
            </button>
          </div>
        ) : (
          <div className="card text-center text-gray-500">
            <p>Please select a game above to start staking</p>
          </div>
        )}
      </main>
    </div>
  );
}