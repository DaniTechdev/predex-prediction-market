# Predex — Devnet Deployment

## Program

| Field | Value |
| --- | --- |
| Program ID | `C9v9UddDthTPnZRuwmBpkARwJooFrzgGHZ5MzZJYXUGb` |
| Network | devnet |
| Upgrade authority | `6zdMVFZ5xcqQwpyBsNtRdpfQD24cbUvELacCVrarfsx3` (CLI keypair `~/.config/solana/id.json`) |
| ProgramData address | `BGGhNm3LhjSLD93CTaBy3esF4eHEHc1kGMDtCa7UDxou` |
| Bytecode size | 381,944 bytes |
| Deploy slot | 460297103 |
| Deploy tx | `37S3sqvSJMxbmTQqCj5B5jDP39JVG2XG79s2wKfKjYMfoEV3N43epmefUWHjkXyHjuceEY7RQuWFq1CuYSkJmVj1` |
| Deploy date | 2026-05-05 |
| Explorer | https://explorer.solana.com/address/C9v9UddDthTPnZRuwmBpkARwJooFrzgGHZ5MzZJYXUGb?cluster=devnet |

## Mock USDC mint (for testing)

| Field | Value |
| --- | --- |
| Mint | `3VWGZuhBq23QoCvYquJ7JNRC1XfN7b12KLWCWJgiD3My` |
| Decimals | 6 (matches real USDC) |
| Token program | Classic SPL Token (`TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`) |
| Supply minted | 1,000,000 USDC (1e12 raw units) |
| Mint authority | `GzFvV3yb7PhGTgdUqUAHukF4dqCQFtgHQT2MzT233SYd` (Phantom wallet) |
| Freeze authority | `GzFvV3yb7PhGTgdUqUAHukF4dqCQFtgHQT2MzT233SYd` (Phantom wallet) |
| Explorer | https://explorer.solana.com/address/3VWGZuhBq23QoCvYquJ7JNRC1XfN7b12KLWCWJgiD3My?cluster=devnet |

## Wallets

| Role | Address | Notes |
| --- | --- | --- |
| CLI / deployer | `6zdMVFZ5xcqQwpyBsNtRdpfQD24cbUvELacCVrarfsx3` | Holds upgrade authority; key file `~/.config/solana/id.json` (WSL) |
| Phantom / mint owner | `GzFvV3yb7PhGTgdUqUAHukF4dqCQFtgHQT2MzT233SYd` | Owns the mock USDC mint + freeze authority |

## Quick refs

- Devnet RPC: `https://api.devnet.solana.com`
- IDL: `target/idl/predex.json`
- TS types: `target/types/predex.ts`
- Re-deploy after changes: `anchor build && anchor deploy --provider.cluster devnet`
