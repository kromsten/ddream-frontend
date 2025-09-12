# DDream Frontend Quick Start

## 🚀 Get Started in 3 Minutes

### 1. Run Setup (One Time)
```bash
./scripts/setup.sh
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open Browser
Navigate to [http://localhost:3000](http://localhost:3000)

## ✨ What's Configured

- **Controller Contract**: `xion19h9yae5vwa5ctwnwr4yxnkj9x6gthtlevqu9che8lqjngt7p72lslt3yuy`
- **Treasury Contract**: `xion1pgd5dn5m6w2k9hdvvam8790q3x6g2vqsml6kzdfvwl4g7djpuhts6hwq5g`
- **Network**: XION Testnet
- **Features**: Gasless transactions enabled!

## 🎮 Try These Features

1. **Connect Wallet**: Click "Connect Wallet" and use email/social login
2. **Browse Games**: View all available games on the Games page
3. **Stake XION**: Stake tokens to earn rewards on the Staking page

## 📝 Key Pages

- **Home** (`/`) - Landing page with protocol overview
- **Games** (`/games`) - Browse all available games
- **Staking** (`/staking`) - Stake XION for token allocation at launch

## 🛠 Development Commands

```bash
# Development server with hot reload
npm run dev

# Build for production
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

## 🔧 Customization

### Change Treasury Address
Edit `.env.local`:
```env
NEXT_PUBLIC_TREASURY_ADDRESS=your_new_treasury_address
```

### Disable Gasless Transactions
Edit `.env.local`:
```env
NEXT_PUBLIC_ENABLE_GASLESS=false
```

### Change Network (Mainnet)
Edit `.env.local`:
```env
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_RPC_URL=https://rpc.xion.burnt.com:443
NEXT_PUBLIC_REST_URL=https://api.xion.burnt.com:443
```

## 🐛 Troubleshooting

### Port 3000 Already in Use
```bash
# Use a different port
npm run dev -- -p 3001
```

### Module Not Found Errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### Build Errors
```bash
# Check TypeScript errors
npm run type-check

# Check for lint errors
npm run lint
```

## 📚 Learn More

- [DDream Documentation](../README.md)
- [XION Abstraxion Docs](https://docs.burnt.com/xion/abstraxion)
- [Next.js Documentation](https://nextjs.org/docs)

## 🎉 Ready to Build!

You now have a fully functional DDream frontend with:
- ✅ Walletless authentication
- ✅ Gasless transactions
- ✅ Game browsing
- ✅ Staking system with 100 blocks (~10 minutes) unbonding
- ✅ Professional UI/UX

Start building your decentralized gaming empire! 🚀