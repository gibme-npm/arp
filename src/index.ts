// Copyright (c) 2016-2025, Brandon Lehmann <brandonlehmann@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { spawn } from 'child_process';
import { isIP } from 'net';

/** @ignore */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const defaultGateway = require('default-gateway');

/** @ignore */
const PROCESS_TIMEOUT = 10_000;

/** @ignore */
const withTimeout = (proc: ReturnType<typeof spawn>, ms: number): NodeJS.Timeout => {
    return setTimeout(() => {
        proc.kill();
    }, ms);
};

/** @ignore */
const linux = async (ip: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const ping = spawn('ping', ['-c', '1', ip]);
        const pingTimer = withTimeout(ping, PROCESS_TIMEOUT);

        let pingErr = '';

        ping.stderr.on('data', data => { pingErr += data; });

        ping.on('close', () => {
            clearTimeout(pingTimer);

            const arp = spawn('arp', ['-n', ip]);
            const arpTimer = withTimeout(arp, PROCESS_TIMEOUT);

            let buffer = '';
            let errStream = '';

            arp.stdout.on('data', data => { buffer += data; });

            arp.stderr.on('data', data => { errStream += data; });

            arp.on('close', code => {
                clearTimeout(arpTimer);

                if (code !== 0) {
                    return reject(new Error(
                        `Error running arp via [${arp.spawnfile} ${arp.spawnargs.join(' ')}]: ` +
                        `Code #${code}` + '\n' + errStream +
                        (pingErr ? '\nping stderr: ' + pingErr : '')));
                }

                const table = buffer.split('\n');

                if (table.length >= 2) {
                    const parts = table[1].split(' ')
                        .filter(String);

                    const mac = (parts.length === 5) ? parts[2] : parts[1];

                    if (mac) {
                        return resolve(mac.toUpperCase());
                    }
                }

                return reject(new Error('Could not find ip in arp table: ' + ip));
            });
        });
    });
};

/** @ignore */
const windows = async (ip: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const ping = spawn('ping', ['-n', '1', ip]);
        const pingTimer = withTimeout(ping, PROCESS_TIMEOUT);

        let pingErr = '';

        ping.stderr.on('data', data => { pingErr += data; });

        ping.on('close', () => {
            clearTimeout(pingTimer);

            const arp = spawn('arp', ['-a', ip]);
            const arpTimer = withTimeout(arp, PROCESS_TIMEOUT);

            let buffer = '';
            let errStream = '';

            arp.stdout.on('data', data => { buffer += data; });

            arp.stderr.on('data', data => { errStream += data; });

            arp.on('close', code => {
                clearTimeout(arpTimer);

                if (code !== 0) {
                    return reject(new Error(
                        `Error running arp via [${arp.spawnfile} ${arp.spawnargs.join(' ')}]: ` +
                        `Code #${code}` + '\n' + errStream +
                        (pingErr ? '\nping stderr: ' + pingErr : '')));
                }

                const table = buffer.split('\r\n');

                for (let i = 3; i < table.length; i++) {
                    const parts = table[i].split(' ')
                        .filter(String);

                    if (parts[0] === ip) {
                        const mac = parts[1].replace(/-/g, ':');

                        return resolve(mac.toUpperCase());
                    }
                }

                return reject(new Error('Could not find ip in arp table: ' + ip));
            });
        });
    });
};

/** @ignore */
const macintosh = async (ip: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const ping = spawn('ping', ['-c', '1', ip]);
        const pingTimer = withTimeout(ping, PROCESS_TIMEOUT);

        let pingErr = '';

        ping.stderr.on('data', data => { pingErr += data; });

        ping.on('close', () => {
            clearTimeout(pingTimer);

            const arp = spawn('arp', ['-n', ip]);
            const arpTimer = withTimeout(arp, PROCESS_TIMEOUT);

            let buffer = '';
            let errStream = '';

            arp.stdout.on('data', data => { buffer += data; });

            arp.stderr.on('data', data => { errStream += data; });

            arp.on('close', code => {
                clearTimeout(arpTimer);

                if (code !== 0 && errStream !== '') {
                    return reject(new Error(
                        `Error running arp via [${arp.spawnfile} ${arp.spawnargs.join(' ')}]: ` +
                        `Code #${code}` + '\n' + errStream +
                        (pingErr ? '\nping stderr: ' + pingErr : '')));
                }

                const parts = buffer.split(' ')
                    .filter(String);

                if (parts[3] !== 'no') {
                    const mac = parts[3].split(':')
                        .map(octet => octet.padStart(2, '0'))
                        .join(':');

                    return resolve(mac.toUpperCase());
                }

                return reject(new Error('Could not find ip in arp table: ' + ip));
            });
        });
    });
};

/**
 * Looks up the MAC address for a device on your local network by its IP address.
 *
 * Works by pinging the target first (to populate the ARP table), then reading
 * the system ARP cache. Supports Linux, macOS, and Windows out of the box.
 *
 * @param ip - the IPv4 or IPv6 address to look up
 * @param separator - the character used between MAC octets (defaults to `:`)
 * @returns the MAC address as an uppercase string (e.g. `AA:BB:CC:DD:EE:FF`)
 * @throws if the IP is invalid or the address can't be found in the ARP table
 */
export const lookup = async (ip: string, separator = ':'): Promise<string> => {
    if (isIP(ip) === 0) {
        throw new Error(`${ip} is not a valid IP address`);
    }

    let result: string;

    if (process.platform.includes('linux')) {
        result = await linux(ip);
    } else if (process.platform.includes('darwin')) {
        result = await macintosh(ip);
    } else if (process.platform.includes('win')) {
        result = await windows(ip);
    } else {
        throw new Error('Unknown platform detected');
    }

    return result.split(':')
        .join(separator);
};

/**
 * Returns your system's default gateway IPv4 address, or `undefined` if one isn't available.
 *
 * Handy for discovering the local router so you can pass it straight into {@link lookup}.
 */
export const get_gateway_ipv4 = async (): Promise<string | undefined> => {
    try {
        return (await defaultGateway.gateway4async()).gateway;
    } catch {
        return undefined;
    }
};

/**
 * Returns your system's default gateway IPv6 address, or `undefined` if one isn't available.
 *
 * Same idea as {@link get_gateway_ipv4}, but for IPv6 networks.
 */
export const get_gateway_ipv6 = async (): Promise<string | undefined> => {
    try {
        return (await defaultGateway.gateway6async()).gateway;
    } catch {
        return undefined;
    }
};

const ARP = {
    lookup,
    get_gateway_ipv4,
    get_gateway_ipv6
};

export default ARP;
