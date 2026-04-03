# @gibme/arp

[![CI/CD](https://github.com/gibme-npm/arp/actions/workflows/ci.yml/badge.svg)](https://github.com/gibme-npm/arp/actions/workflows/ci.yml)
[![NPM](https://img.shields.io/npm/v/@gibme/arp)](https://www.npmjs.com/package/@gibme/arp)
[![License](https://img.shields.io/npm/l/@gibme/arp)](https://github.com/gibme-npm/arp/blob/master/LICENSE)

A simple, cross-platform ARP helper for Node.js. Give it an IP address on your local network and it'll hand back the MAC address — no native modules, no fuss.

Works on **Linux**, **macOS**, and **Windows**.

## Installation

```bash
yarn add @gibme/arp
# or
npm install @gibme/arp
```

Requires **Node >= 22**.

## Quick Start

```typescript
import ARP from '@gibme/arp';

// Look up a MAC address by IP
const mac = await ARP.lookup('192.168.1.1');
console.log(mac); // e.g. "AA:BB:CC:DD:EE:FF"
```

## API

### `ARP.lookup(ip, separator?)`

Resolves an IP address to a MAC address on your local network. It pings the target first (to populate the ARP table), then reads the result from the system ARP cache.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `ip` | `string` | — | The IPv4 or IPv6 address to look up |
| `separator` | `string` | `':'` | Character between MAC octets |

**Returns** an uppercase MAC string (e.g. `AA:BB:CC:DD:EE:FF`).

**Throws** if the IP is invalid, the address isn't found in the ARP table, or the platform is unsupported.

```typescript
await ARP.lookup('192.168.1.1');       // "AA:BB:CC:DD:EE:FF"
await ARP.lookup('192.168.1.1', '-');  // "AA-BB-CC-DD-EE-FF"
await ARP.lookup('192.168.1.1', '');   // "AABBCCDDEEFF"
```

### `ARP.get_gateway_ipv4()`

Returns your default gateway's IPv4 address, or `undefined` if one isn't available. Handy for discovering the local router so you can pass it straight into `lookup()`.

```typescript
const gateway = await ARP.get_gateway_ipv4();
if (gateway) {
    const mac = await ARP.lookup(gateway);
    console.log(`Router MAC: ${mac}`);
}
```

### `ARP.get_gateway_ipv6()`

Same as above, but for IPv6.

## How It Works

Under the hood, `lookup()` spawns two system commands in sequence:

1. **`ping`** — sends a single ICMP packet to ensure the target IP is in the local ARP cache
2. **`arp`** — reads the system ARP table and extracts the MAC address for the given IP

Each spawned process has a 10-second timeout to avoid hanging on unresponsive hosts. Platform-specific flags are handled automatically (`-c 1` on Linux/macOS, `-n 1` on Windows, etc.).

The gateway functions use the [`default-gateway`](https://www.npmjs.com/package/default-gateway) package to query the system routing table.

## Named Exports

In addition to the default export, each function is available as a named export:

```typescript
import { lookup, get_gateway_ipv4, get_gateway_ipv6 } from '@gibme/arp';
```

## Documentation

Full generated API docs are available at [https://gibme-npm.github.io/arp/](https://gibme-npm.github.io/arp/).

## License

[MIT](LICENSE)
