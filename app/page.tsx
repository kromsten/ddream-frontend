/**
 * DDream Home Page
 * Following Burnt Labs patterns
 */

"use client";

import { useState, useEffect } from "react";
import { useAbstraxionAccount, useModal } from "@burnt-labs/abstraxion";
import { Navigation } from "@/components/Navigation";
import Link from "next/link";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { queryContract, CONTRACTS, NETWORK, formatAmount } from "@/lib/contracts";
import type { GameInfo, CurveInfoResponse } from "@/types/ddream";

interface GameStats {
  ticker: string;
  name: string;
  price?: string;
  marketCap?: string;
  volume24h?: string;
  launched: boolean;
}

export default function Home() {
  const { data: account } = useAbstraxionAccount();
  const [, setShowModal] = useModal();
  const [featuredGames, setFeaturedGames] = useState<GameStats[]>([]);
  const [totalValueLocked, setTotalValueLocked] = useState<string>("0");
  const [loading, setLoading] = useState(true);
  
  // Query client
  const [queryClient, setQueryClient] = useState<CosmWasmClient | null>(null);
  
  // Initialize query client
  useEffect(() => {
    CosmWasmClient.connect(NETWORK.rpc).then(setQueryClient).catch(console.error);
  }, []);
  
  // Load featured games
  useEffect(() => {
    if (queryClient) {
      loadFeaturedGames();
    }
  }, [queryClient]);
  
  async function loadFeaturedGames() {
    if (!queryClient) return;
    
    setLoading(true);
    try {
      // Load real games from localStorage
      const storedGames = localStorage.getItem('ddream_games_detailed');
      const gamesData = storedGames ? JSON.parse(storedGames) : {};
      const games: GameStats[] = [];
      let tvl = 0;
      
      // Query each game from blockchain
      const tickers = Object.keys(gamesData).slice(0, 4); // Limit to 4 featured games
      
      for (const ticker of tickers) {
        try {
          // Get stored game data for name (fallback)
          const storedGame = gamesData[ticker];
          
          const gameInfo = await queryContract<GameInfo>(queryClient, CONTRACTS.controller, {
            game_info: { ticker }
          });
          
          console.log(`Query response for ${ticker}:`, gameInfo);
          console.log(`Stored data for ${ticker}:`, storedGame);
          
          if (gameInfo) {
            // Use gameInfo data, but fallback to stored data for name if not present
            const stat: GameStats = {
              ticker: gameInfo.ticker || ticker,
              name: gameInfo.name || storedGame?.name || ticker,
              launched: gameInfo.token_launched || false
            };
            
            // Calculate TVL based on game status
            if (gameInfo.contract) {
              if (!gameInfo.token_launched) {
                // For non-launched games: query total staked amount
                try {
                  // Query all members to get total staked
                  // Note: In production, you'd want to add a total_staked query to the contract
                  // For now, we'll query members and sum their stakes
                  const membersResponse = await queryContract<any>(
                    queryClient,
                    gameInfo.contract,
                    { list_members: { limit: 100 } }
                  );
                  
                  if (membersResponse?.members) {
                    // Sum all stakes from members
                    let totalStaked = 0;
                    for (const member of membersResponse.members) {
                      // Query individual stake
                      try {
                        const stakeResponse = await queryContract<any>(
                          queryClient,
                          gameInfo.contract,
                          { staked: { address: member.addr } }
                        );
                        if (stakeResponse?.stake) {
                          totalStaked += parseInt(stakeResponse.stake);
                        }
                      } catch (err) {
                        console.log(`Could not query stake for ${member.addr}:`, err);
                      }
                    }
                    tvl += totalStaked;
                    console.log(`Game ${ticker} staked amount: ${totalStaked}`);
                  }
                } catch (err) {
                  console.log(`Could not load staking data for ${ticker}:`, err);
                }
              } else {
                // For launched games: get reserve from bonding curve
                try {
                  const curveInfo = await queryContract<CurveInfoResponse>(
                    queryClient, 
                    gameInfo.contract, 
                    { curve_info: {} }
                  );
                  
                  if (curveInfo) {
                    stat.price = curveInfo.spot_price;
                    stat.marketCap = curveInfo.reserve;
                    tvl += parseInt(curveInfo.reserve);
                  }
                } catch (err) {
                  console.log(`Could not load market data for ${ticker}:`, err);
                }
              }
            }
            
            games.push(stat);
          }
        } catch (err) {
          console.log(`Game ${ticker} not found on chain`);
        }
      }
      
      setFeaturedGames(games);
      setTotalValueLocked(tvl.toString());
    } catch (err) {
      console.error("Error loading games:", err);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to <span className="gradient-text">DDream</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              The decentralized gaming protocol on XION. Create games, stake tokens, and trade on bonding curves - all without a crypto wallet!
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              {!account ? (
                <button
                  onClick={() => setShowModal(true)}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity"
                >
                  Get Started with Email
                </button>
              ) : (
                <Link
                  href="/games"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity"
                >
                  🎮 Go to Games
                </Link>
              )}
            </div>
            
            {/* Quick Start Guide for logged-in users */}
            {account && (
              <div className="mt-12 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 max-w-2xl mx-auto border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Start Guide</h3>
                <div className="text-left space-y-2 text-gray-700">
                  <p>1. <Link href="/games" className="text-purple-600 hover:underline font-medium">Go to Games</Link> to create your first game</p>
                  <p>2. Enter a ticker symbol (e.g., MOON) and game name</p>
                  <p>3. Stake XION tokens to earn token allocation before launch</p>
                  <p>4. Launch tokens you create or trade launched tokens</p>
                </div>
                <Link
                  href="/games"
                  className="mt-4 inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Create Your First Game →
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </section>
      
      {/* Stats Section - Only show if we have games */}
      {featuredGames.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center max-w-2xl mx-auto">
              <div>
                <div className="text-4xl font-bold text-gray-900">{featuredGames.length}</div>
                <div className="text-gray-600 mt-2">Active Games</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-gray-900">
                  {formatAmount(totalValueLocked)}
                </div>
                <div className="text-gray-600 mt-2">Total Value Locked</div>
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* Featured Games */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Featured Games</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="spinner mx-auto"></div>
            </div>
          ) : featuredGames.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎮</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Games Yet</h3>
                <p className="text-gray-600 mb-6">
                  Be the first to create a game on DDream Protocol!
                </p>
                {account ? (
                  <Link
                    href="/games"
                    className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                  >
                    Create First Game
                  </Link>
                ) : (
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                  >
                    Connect to Get Started
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredGames.map((game) => (
                <div key={game.ticker} className="card hover:shadow-xl transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{game.ticker}</h3>
                      <p className="text-sm text-gray-600">{game.name}</p>
                    </div>
                    {game.launched && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Live
                      </span>
                    )}
                  </div>
                  
                  {game.launched ? (
                    <>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600 text-sm">Price</span>
                          <span className="font-medium">{formatAmount(game.price || "0")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 text-sm">Market Cap</span>
                          <span className="font-medium">{formatAmount(game.marketCap || "0")}</span>
                        </div>
                      </div>
                      <Link
                        href="/games"
                        className="block w-full text-center py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        View Game
                      </Link>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-3">Not launched yet</p>
                      <Link
                        href="/games"
                        className="block w-full text-center py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Playing?</h2>
            <p className="text-lg mb-8 opacity-90">
              Join the decentralized gaming revolution on XION
            </p>
            {!account ? (
              <button
                onClick={() => setShowModal(true)}
                className="px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Connect Now
              </button>
            ) : (
              <Link
                href="/games"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Go to Games
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}