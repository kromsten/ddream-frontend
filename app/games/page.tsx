/**
 * DDream Games Listing Page
 * Browse and discover all games
 */

"use client";

import { useState, useEffect } from "react";
import { useAbstraxionAccount, useAbstraxionSigningClient, useModal } from "@burnt-labs/abstraxion";
import { Navigation } from "@/components/Navigation";
import Link from "next/link";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { 
  queryContract,
  executeContract, 
  CONTRACTS, 
  NETWORK, 
  formatAmount,
  xionToMicro,
  truncateAddress,
  getExplorerTxLink
} from "@/lib/contracts";
import type { 
  GameInfo, 
  CurveInfoResponse, 
  TokenInfoResponse,
  TokenMarketInfo,
  CreateGameMsg,
  LaunchTokenMsg,
  GameDataResponse
} from "@/types/ddream";

interface GameWithStats extends GameInfo {
  price?: string;
  marketCap?: string;
  totalSupply?: string;
  holders?: number;
}

export default function Games() {
  const { data: account } = useAbstraxionAccount();
  const { client: signingClient } = useAbstraxionSigningClient();
  const [, setShowModal] = useModal();
  
  const [games, setGames] = useState<GameWithStats[]>([]);
  const [filteredGames, setFilteredGames] = useState<GameWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'launched' | 'unlaunched'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'marketCap' | 'price'>('name');
  const [showMyGamesOnly, setShowMyGamesOnly] = useState(false);
  
  // Game creation
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [newGameTicker, setNewGameTicker] = useState("");
  const [newGameName, setNewGameName] = useState("");
  const [creating, setCreating] = useState(false);
  
  // Game management
  const [selectedGame, setSelectedGame] = useState<string>("");
  const [marketInfo, setMarketInfo] = useState<TokenMarketInfo | null>(null);
  const [allGamesData, setAllGamesData] = useState<any>({});
  
  // Manual game addition
  const [showAddGame, setShowAddGame] = useState(false);
  const [manualTicker, setManualTicker] = useState("");
  const [addingGame, setAddingGame] = useState(false);
  const [addGameError, setAddGameError] = useState("");
  
  // UI state
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");
  const [copiedAddress, setCopiedAddress] = useState<string>("");
  
  // Query client
  const [queryClient, setQueryClient] = useState<CosmWasmClient | null>(null);
  
  // Initialize query client
  useEffect(() => {
    CosmWasmClient.connect(NETWORK.rpc).then(setQueryClient).catch(console.error);
  }, []);
  
  // Load all games
  useEffect(() => {
    if (queryClient) {
      loadAllGames();
    }
  }, [queryClient]);
  
  // Load selected game data
  useEffect(() => {
    if (selectedGame && queryClient) {
      loadGameData(selectedGame);
    }
  }, [selectedGame, queryClient, games]);
  
  // Filter and sort games
  useEffect(() => {
    filterAndSortGames();
  }, [games, searchTerm, filterStatus, sortBy, showMyGamesOnly]);
  
  // Copy address to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedAddress(label);
    setTimeout(() => setCopiedAddress(""), 2000);
  };

  // Create new game
  async function handleCreateGame() {
    if (!signingClient || !account || !newGameTicker || !newGameName) return;
    
    setCreating(true);
    setError("");
    setSuccess("");
    
    try {
      const msg: CreateGameMsg = {
        create_game: {
          ticker: newGameTicker.toUpperCase(),
          name: newGameName
        }
      };
      
      const result = await executeContract(
        signingClient,
        account.bech32Address,
        CONTRACTS.controller,
        msg
      );
      
      // Query the game from blockchain to get full info including contract address
      if (queryClient) {
        try {
          const gameInfo = await queryContract<GameInfo>(queryClient, CONTRACTS.controller, {
            game_info: { ticker: newGameTicker.toUpperCase() }
          });
          
          if (gameInfo) {
            // Store the full game info from blockchain
            const storedGames = localStorage.getItem('ddream_games_detailed');
            const gamesMap = storedGames ? JSON.parse(storedGames) : {};
            gamesMap[gameInfo.ticker] = gameInfo;
            localStorage.setItem('ddream_games_detailed', JSON.stringify(gamesMap));
          }
        } catch (err) {
          console.error("Error querying newly created game:", err);
          // Fallback: save basic info if query fails
          const gameData = {
            ticker: newGameTicker.toUpperCase(),
            name: newGameName,
            contract: '',
            token_launched: false
          };
          
          const storedGames = localStorage.getItem('ddream_games_detailed');
          const gamesMap = storedGames ? JSON.parse(storedGames) : {};
          gamesMap[gameData.ticker] = gameData;
          localStorage.setItem('ddream_games_detailed', JSON.stringify(gamesMap));
        }
      }
      
      // Show success
      if (result?.transactionHash) {
        setTxHash(result.transactionHash);
        setSuccess(`Game "${newGameName}" created successfully! TX: ${result.transactionHash.slice(0, 8)}...`);
      } else {
        setSuccess(`Game "${newGameName}" created successfully!`);
      }
      
      // Refresh games list
      await loadAllGames();
      setNewGameTicker("");
      setNewGameName("");
      setShowCreateGame(false);
      setSelectedGame(newGameTicker.toUpperCase());
    } catch (err: any) {
      console.error("Create game error:", err);
      setError(err.message || "Failed to create game");
    } finally {
      setCreating(false);
    }
  }
  
  // Launch token
  async function handleLaunchToken() {
    if (!signingClient || !account || !selectedGame) return;
    
    setLoading(true);
    setError("");
    
    try {
      const msg: LaunchTokenMsg = {
        launch_token: {
          ticker: selectedGame
        }
      };
      
      await executeContract(
        signingClient,
        account.bech32Address,
        CONTRACTS.controller,
        msg
      );
      
      // Refresh game data
      await loadAllGames();
      await loadGameData(selectedGame);
      setSuccess(`Token launched successfully for ${selectedGame}!`);
    } catch (err: any) {
      setError(err.message || "Failed to launch token");
    } finally {
      setLoading(false);
    }
  }
  
  // Load game data
  async function loadGameData(ticker: string) {
    if (!queryClient || !ticker) return;
    
    try {
      // Find the game
      const game = games.find(g => g.ticker === ticker);
      if (!game) return;
      
      // Load market info if token is launched
      if (game?.token_launched && game.contract) {
        try {
          const tokenInfo = await queryContract<any>(queryClient, game.contract, {
            token_info: {}
          });
          
          const curveInfo = await queryContract<any>(queryClient, game.contract, {
            curve_info: {}
          });
          
          if (tokenInfo && curveInfo) {
            setMarketInfo({
              ticker: tokenInfo.symbol,
              name: tokenInfo.name,
              total_supply: tokenInfo.total_supply,
              market_cap: curveInfo.reserve,
              price: curveInfo.spot_price,
              is_launched: true
            });
          }
        } catch (err) {
          console.log("Could not load market info:", err);
          setMarketInfo(null);
        }
      } else {
        setMarketInfo(null);
      }
    } catch (err) {
      console.error("Error loading game data:", err);
    }
  }

  async function loadAllGames() {
    if (!queryClient) return;
    
    setLoading(true);
    try {

      // Get all transactions that create a a name game
      const data = await queryContract<GameDataResponse>(queryClient, CONTRACTS.controller, { game_data: {  with_state: true } });

      // Load games from localStorage (same as dashboard and staking pages)
      const storedGames = localStorage.getItem('ddream_games_detailed');
      const gamesData = storedGames ? JSON.parse(storedGames) : {};
      setAllGamesData(gamesData); // Store for game details display
      
      const gamesList: GameWithStats[] = [];

      for (const { game_info, state } of data!.games) {
        const gameWithStats: GameWithStats = {
          ticker: game_info.symbol,
          name: game_info.name,
          contract: game_info.contract,
          token_launched: game_info.phase != "staking",
        };
        
        if (game_info.phase == "bonding") {
          const { token } = state as { token: CurveInfoResponse};
          gameWithStats.price = token.spot_price;
          gameWithStats.marketCap = (parseInt(token.supply) * parseInt(gameWithStats.price)).toFixed(2);
        }
        gamesList.push(gameWithStats);
      }
  
      setGames(gamesList);
    } catch (err) {
      console.error("Error loading games:", err);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleAddGame() {
    if (!queryClient || !manualTicker) return;
    
    setAddingGame(true);
    setAddGameError("");
    
    try {
      // Query the game from blockchain
      const gameInfo = await queryContract<GameInfo>(queryClient, CONTRACTS.controller, {
        game_info: { ticker: manualTicker }
      });
      
      if (!gameInfo) {
        setAddGameError(`Game "${manualTicker}" not found on blockchain`);
        return;
      }
      
      // Store in localStorage
      const storedGames = localStorage.getItem('ddream_games_detailed');
      const gamesMap = storedGames ? JSON.parse(storedGames) : {};
      gamesMap[gameInfo.ticker] = gameInfo;
      localStorage.setItem('ddream_games_detailed', JSON.stringify(gamesMap));
      
      // Reload games
      await loadAllGames();
      setManualTicker("");
      setShowAddGame(false);
    } catch (err: any) {
      console.error("Error adding game:", err);
      setAddGameError(`Game "${manualTicker}" not found. Make sure the ticker is correct.`);
    } finally {
      setAddingGame(false);
    }
  }
  
  function filterAndSortGames() {
    let filtered = [...games];
    
    // Apply my games filter
    if (showMyGamesOnly && account?.bech32Address) {
      filtered = filtered.filter(game => {
        const gameData = allGamesData[game.ticker];
        return gameData?.creator === account.bech32Address;
      });
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(game => 
        (game.ticker?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (game.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
      );
    }
    
    // Apply status filter
    if (filterStatus === 'launched') {
      filtered = filtered.filter(game => game.token_launched);
    } else if (filterStatus === 'unlaunched') {
      filtered = filtered.filter(game => !game.token_launched);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'marketCap':
          return parseInt(b.marketCap || '0') - parseInt(a.marketCap || '0');
        case 'price':
          return parseInt(b.price || '0') - parseInt(a.price || '0');
        case 'name':
        default:
          // Handle cases where ticker might be undefined
          const tickerA = a.ticker || '';
          const tickerB = b.ticker || '';
          return tickerA.localeCompare(tickerB);
      }
    });
    
    setFilteredGames(filtered);
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Games</h1>
            <p className="mt-2 text-gray-600">Create, manage, and discover games on DDream Protocol</p>
          </div>
          <div className="flex gap-2">
            {account && (
              <button
                onClick={() => setShowCreateGame(!showCreateGame)}
                className="btn-primary"
              >
                {showCreateGame ? "Cancel" : "+ Create Game"}
              </button>
            )}
            <button
              onClick={() => setShowAddGame(!showAddGame)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
            >
              {showAddGame ? "Cancel" : "Add Existing"}
            </button>
          </div>
        </div>
        
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{success}</p>
            {txHash && (
              <a 
                href={getExplorerTxLink(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-800 text-sm mt-1 inline-block"
              >
                View transaction →
              </a>
            )}
          </div>
        )}
        
        {/* Create Game Form */}
        {showCreateGame && account && (
          <div className="card mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <h3 className="text-lg font-semibold mb-4">Create New Game</h3>
            <div className="flex gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Ticker (e.g., MOON)"
                value={newGameTicker}
                onChange={(e) => setNewGameTicker(e.target.value.toUpperCase().slice(0, 10))}
                className="input flex-1 min-w-[150px]"
                disabled={creating}
              />
              <input
                type="text"
                placeholder="Game Name"
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
                className="input flex-1 min-w-[200px]"
                disabled={creating}
              />
              <button
                onClick={handleCreateGame}
                disabled={creating || !newGameTicker || !newGameName}
                className="btn-primary"
              >
                {creating ? "Creating..." : "Create Game"}
              </button>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Create a new game with staking and bonding curve mechanics. Players can stake XION to earn tokens when launched.
            </p>
          </div>
        )}
        
        {/* Manual Game Addition */}
        {showAddGame && (
          <div className="card mb-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold mb-3">Add Existing Game</h3>
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
            {addGameError && (
              <p className="mt-2 text-sm text-red-600">{addGameError}</p>
            )}
            <p className="mt-2 text-xs text-gray-600">
              Know a game ticker that was created on the blockchain? Enter it above to add it to your list.
            </p>
          </div>
        )}
        
        {/* Filters and Search */}
        <div className="card mb-6">
          <div className="flex flex-col gap-4">
            {/* My Games Toggle */}
            {account && (
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showMyGamesOnly}
                    onChange={(e) => setShowMyGamesOnly(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium">Show My Games Only</span>
                </label>
              </div>
            )}
            
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search games by name or ticker..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input w-full"
                />
              </div>
              
              {/* Status Filter */}
              <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'all'
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('launched')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'launched'
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Launched
              </button>
              <button
                onClick={() => setFilterStatus('unlaunched')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'unlaunched'
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Not Launched
              </button>
            </div>
            
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="input"
            >
              <option value="name">Sort by Name</option>
              <option value="marketCap">Sort by Market Cap</option>
              <option value="price">Sort by Price</option>
            </select>
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-600">Total Games</p>
            <p className="text-2xl font-bold">{games.length}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Launched</p>
            <p className="text-2xl font-bold">
              {games.filter(g => g.token_launched).length}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Total Market Cap</p>
            <p className="text-2xl font-bold">
              {formatAmount(
                games.reduce((sum, g) => sum + parseInt(g.marketCap || '0'), 0).toString()
              )}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Active Traders</p>
            <p className="text-2xl font-bold">
              {games.reduce((sum, g) => sum + (g.holders || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>
        
        {/* Games Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="spinner mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading games...</p>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-12 card bg-yellow-50 border-yellow-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Games Yet</h3>
            <p className="text-gray-600 mb-4">
              Get started by creating a game on the Dashboard or adding an existing game using the button above.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  if (account) {
                    setShowCreateGame(true);
                  } else {
                    setShowModal(true);
                  }
                }}
                className="btn-primary"
              >
                Create Game
              </button>
              <button
                onClick={() => setShowAddGame(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
              >
                Add Existing Game
              </button>
            </div>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No games found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map((game) => {
              const gameData = allGamesData[game.ticker];
              const isMyGame = gameData?.creator === account?.bech32Address;
              const isSelected = selectedGame === game.ticker;
              
              return (
              <div 
                key={game.ticker} 
                className={`card hover:shadow-xl transition-all cursor-pointer ${
                  isSelected ? 'ring-2 ring-purple-500 shadow-xl' : ''
                }`}
                onClick={() => setSelectedGame(game.ticker)}
              >
                {/* Game Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {game.name}
                      {isMyGame && <span className="ml-2 text-purple-600">★</span>}
                    </h3>
                    <p className="text-sm text-gray-600 font-mono">{game.ticker}</p>
                  </div>
                  {game.token_launched ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                      Live
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                      Not Launched
                    </span>
                  )}
                </div>
                
                {/* Game Stats */}
                {game.token_launched ? (
                  <>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Price</span>
                        <span className="font-medium">{formatAmount(game.price || "0")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Market Cap</span>
                        <span className="font-medium">{formatAmount(game.marketCap || "0")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Holders</span>
                        <span className="font-medium">{game.holders?.toLocaleString() || "0"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Contract</span>
                        <span className="font-mono text-xs">
                          {truncateAddress(game.contract)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <button
                      onClick={() => setSelectedGame(game.ticker)}
                      className="w-full text-center py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      View Details
                    </button>
                  </>
                ) : (
                  <>
                    <div className="py-8 text-center text-gray-500">
                      <p className="mb-4">Token not launched yet</p>
                      <p className="text-sm">Be the first to launch!</p>
                    </div>
                    <button
                      onClick={() => setSelectedGame(game.ticker)}
                      className="block w-full text-center py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      View Details
                    </button>
                  </>
                )}
              </div>
            );
            })}
          </div>
        )}
        
        {/* Selected Game Details */}
        {selectedGame && allGamesData[selectedGame] && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Game Info */}
            <div className="card bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">Game Details - ${selectedGame}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{games.find(g => g.ticker === selectedGame)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ticker:</span>
                  <span className="font-mono font-medium">${selectedGame}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Creator:</span>
                  <span className="font-mono text-xs">
                    {allGamesData[selectedGame].creator === account?.bech32Address 
                      ? 'You' 
                      : truncateAddress(allGamesData[selectedGame].creator)
                    }
                    <button
                      onClick={() => copyToClipboard(allGamesData[selectedGame].creator, 'creator')}
                      className="ml-2 hover:text-gray-900"
                    >
                      {copiedAddress === 'creator' ? '✓' : '📋'}
                    </button>
                  </span>
                </div>
                {allGamesData[selectedGame].txHash && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Creation TX:</span>
                    <a 
                      href={getExplorerTxLink(allGamesData[selectedGame].txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-xs"
                    >
                      View →
                    </a>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    games.find(g => g.ticker === selectedGame)?.token_launched
                      ? 'text-green-600'
                      : 'text-orange-600'
                  }`}>
                    {games.find(g => g.ticker === selectedGame)?.token_launched
                      ? '✓ Token Launched'
                      : '⏳ Awaiting Launch'
                    }
                  </span>
                </div>
                {games.find(g => g.ticker === selectedGame)?.contract && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Contract:</span>
                    <span className="font-mono text-xs">
                      {truncateAddress(games.find(g => g.ticker === selectedGame)?.contract || '')}
                      <button
                        onClick={() => copyToClipboard(games.find(g => g.ticker === selectedGame)?.contract || '', 'contract')}
                        className="ml-2 hover:text-gray-900"
                      >
                        {copiedAddress === 'contract' ? '✓' : '📋'}
                      </button>
                    </span>
                  </div>
                )}
              </div>
              
              {/* Launch Token Button for Game Creator */}
              {allGamesData[selectedGame].creator === account?.bech32Address && 
               !games.find(g => g.ticker === selectedGame)?.token_launched && (
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={handleLaunchToken}
                    disabled={loading}
                    className="w-full btn-primary"
                  >
                    {loading ? "Launching..." : "Launch Token"}
                  </button>
                  <p className="mt-2 text-xs text-gray-600">
                    Launch the token to enable trading. This action cannot be undone.
                  </p>
                </div>
              )}
            </div>
            
            {/* Market Info */}
            {marketInfo && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Market Info</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatAmount(marketInfo.price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Market Cap</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatAmount(marketInfo.market_cap)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Supply</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatAmount(marketInfo.total_supply, marketInfo.ticker)}
                    </p>
                  </div>
                </div>
                
              </div>
            )}
            
            {/* Staking Link for Non-Launched Games */}
            {!marketInfo && selectedGame && (
              <div className="card bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <h3 className="text-lg font-semibold mb-2">Stake to Earn</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Stake XION now to earn tokens when this game launches
                </p>
                <Link
                  href="/staking"
                  className="block w-full text-center py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Go to Staking →
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}