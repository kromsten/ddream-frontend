# DDream Frontend

A production-ready Next.js 14 application for the DDream Protocol on XION blockchain, featuring walletless authentication and gasless transactions through XION Abstraxion.

## Features

- 🚀 **Gasless Transactions** - Treasury pays gas fees for users
- 📧 **Email/Social Login** - No wallet setup required via Abstraxion
- 🎮 **Game Creation** - Launch new games with custom tokens
- 📈 **Bonding Curves** - Fair token launches with mathematical pricing
- 💰 **Staking System** - Stake tokens to earn rewards
- 💱 **Token Trading** - Buy/sell tokens on bonding curves
- 📱 **Responsive Design** - Mobile-first approach
- ⚡ **Next.js 14** - App Router with server components

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.5
- **Styling**: Tailwind CSS 3.4
- **Blockchain**: XION (Cosmos SDK)
- **Authentication**: XION Abstraxion
- **Contract Interaction**: CosmJS

## Quick Start

### Prerequisites

- Node.js 18.17 or higher
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ddream/ddream-frontend.git
cd ddream-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Edit `.env.local` with your configuration:
```env
NEXT_PUBLIC_CONTROLLER_ADDRESS=xion19h9yae5vwa5ctwnwr4yxnkj9x6gthtlevqu9che8lqjngt7p72lslt3yuy
NEXT_PUBLIC_TREASURY_ADDRESS=your_treasury_address_here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
ddream-frontend/
├── app/                  # Next.js App Router pages
│   ├── layout.tsx       # Root layout with providers
│   ├── page.tsx         # Home page
│   ├── dashboard/       # Dashboard page
│   ├── trading/         # Trading page
│   ├── games/           # Games listing
│   └── staking/         # Staking page
├── components/          # React components
│   └── Navigation.tsx   # Main navigation
├── lib/                 # Core utilities
│   ├── contracts.ts     # Contract interaction
│   └── providers.tsx    # Abstraxion provider
├── types/               # TypeScript definitions
│   └── ddream.ts        # DDream types
├── public/              # Static assets
└── package.json         # Dependencies
```

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Key Components

#### Navigation
Main navigation bar with wallet connection:
```tsx
import { Navigation } from '@/components/Navigation';
```

#### Contract Interaction
Direct contract execution following Burnt Labs patterns:
```tsx
import { executeContract } from '@/lib/contracts';

await executeContract(
  signingClient,
  senderAddress,
  contractAddress,
  message,
  funds
);
```

#### Abstraxion Provider
Walletless authentication wrapper:
```tsx
import { Providers } from '@/lib/providers';

<Providers>
  {children}
</Providers>
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_CONTROLLER_ADDRESS` | DDream controller contract | Yes |
| `NEXT_PUBLIC_TREASURY_ADDRESS` | Treasury for gasless tx | No |
| `NEXT_PUBLIC_RPC_URL` | XION RPC endpoint | Yes |
| `NEXT_PUBLIC_REST_URL` | XION REST endpoint | Yes |
| `NEXT_PUBLIC_NETWORK` | Network name (testnet/mainnet) | Yes |

### Treasury Setup

For gasless transactions, deploy a treasury contract:

1. Visit [XION Quick Start](https://quickstart.dev.testnet.burnt.com)
2. Deploy contracts (UserMap + Treasury)
3. Copy treasury address to `.env.local`
4. Fund treasury with XION tokens

## Features Overview

### 1. Home Page
- Featured games display
- Protocol statistics
- Quick onboarding flow

### 2. Dashboard
- Create new games
- Manage staking positions
- Launch tokens
- View game statistics

### 3. Trading
- Buy/sell tokens on bonding curves
- Real-time price updates
- Trade history
- Market statistics

### 4. Games Listing
- Browse all available games
- Filter by status
- Quick actions

### 5. Staking
- Stake XION tokens
- Manage unbonding
- Claim rewards
- View APY

## Deployment

### Production Build

```bash
# Build for production
npm run build

# Test production build locally
npm run start
```

### Deploy to Vercel

1. Push to GitHub
2. Import project to Vercel
3. Set environment variables
4. Deploy

### Deploy to Custom Server

```bash
# Build the application
npm run build

# Start with PM2
pm2 start npm --name "ddream-frontend" -- start

# Or with systemd service
sudo systemctl start ddream-frontend
```

## Testing

### Manual Testing Checklist

- [ ] Connect with email/social account
- [ ] Create a new game
- [ ] Launch token for game
- [ ] Buy tokens on bonding curve
- [ ] Sell tokens
- [ ] Stake XION tokens
- [ ] Unstake and claim
- [ ] Check transaction history
- [ ] Test on mobile devices

## Troubleshooting

### Common Issues

#### "Cannot find module '@burnt-labs/abstraxion'"
```bash
npm install @burnt-labs/abstraxion@latest
```

#### "Failed to connect to RPC"
- Check RPC URL in `.env.local`
- Ensure network is accessible
- Try alternative RPC endpoints

#### "Insufficient funds for gas"
- Fund treasury contract
- Check treasury balance
- Ensure fee grants are active

#### "Transaction failed"
- Check wallet connection
- Verify contract addresses
- Review transaction parameters

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## Resources

- [DDream Documentation](https://docs.ddream.io)
- [XION Documentation](https://docs.burnt.com/xion)
- [Abstraxion SDK](https://docs.burnt.com/xion/abstraxion)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Support

- Discord: [DDream Discord](https://discord.gg/ddream)
- Twitter: [@DDreamProtocol](https://twitter.com/ddream)
- Email: support@ddream.io

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- XION team for Abstraxion SDK
- Burnt Labs for pattern examples
- CosmJS for blockchain interaction
- Next.js team for the framework