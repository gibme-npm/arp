# @gibme/arp

A simple, cross-platform ARP helper for Node.js. Give it an IP address on your local network and it'll hand back the MAC address — no native modules, no fuss.

Works on Linux, macOS, and Windows.

## Installation

```bash
yarn add @gibme/arp
# or
npm install @gibme/arp
```

Requires **Node >= 20**.

## Quick Start

```typescript
import ARP from '@gibme/arp';

// Look up a MAC address by IP
const mac = await ARP.lookup('192.168.1.1');
console.log(mac); // e.g. "AA:BB:CC:DD:EE:FF"
```

## API

### `ARP.lookup(ip, separator?)`

Resolves an IP address to a MAC address on your local network. It pings the target first (to make sure it's in the ARP table), then reads the result from the system ARP cache.

- **ip** — the IPv4 or IPv6 address to look up
- **separator** — character between MAC octets (defaults to `:`)
- **returns** — an uppercase MAC string like `AA:BB:CC:DD:EE:FF`
- **throws** — if the IP is invalid or the address isn't found

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

## Documentation

Full generated docs are available at [https://gibme-npm.github.io/arp/](https://gibme-npm.github.io/arp/).
