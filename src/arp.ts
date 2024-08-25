// Copyright (c) 2016-2023, Brandon Lehmann <brandonlehmann@gmail.com>
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
const defaultGateway = require('default-gateway');

/** @ignore */
const linux = async (ip: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const ping = spawn('ping', ['-c', '1', ip]);

        ping.on('close', () => {
            const arp = spawn('arp', ['-n', ip]);

            let buffer = '';
            let errStream = '';

            arp.stdout.on('data', data => { buffer += data; });

            arp.stderr.on('data', data => { errStream += data; });

            arp.on('close', code => {
                if (code !== 0) {
                    return reject(new Error(
                        `Error running arp via [${arp.spawnfile} ${arp.spawnargs.join(' ')}]: ` +
                        `Code #${code}` + '\n' + errStream));
                }

                const table = buffer.split('\n');

                if (table.length >= 2) {
                    const parts = table[1].split(' ')
                        .filter(String);

                    const mac = (parts.length === 5) ? parts[2] : parts[1];

                    return resolve(mac.toUpperCase());
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

        ping.on('close', () => {
            const arp = spawn('arp', ['-a', ip]);

            let buffer = '';
            let errStream = '';

            arp.stdout.on('data', data => { buffer += data; });

            arp.stderr.on('data', data => { errStream += data; });

            arp.on('close', code => {
                if (code !== 0) {
                    return reject(new Error(
                        `Error running arp via [${arp.spawnfile} ${arp.spawnargs.join(' ')}]: ` +
                        `Code #${code}` + '\n' + errStream));
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

        ping.on('close', () => {
            const arp = spawn('arp', ['-n', ip]);

            let buffer = '';
            let errStream = '';

            arp.stdout.on('data', data => { buffer += data; });

            arp.stderr.on('data', data => { errStream += data; });

            arp.on('close', code => {
                if (code !== 0 && errStream !== '') {
                    return reject(new Error(
                        `Error running arp via [${arp.spawnfile} ${arp.spawnargs.join(' ')}]: ` +
                        `Code #${code}` + '\n' + errStream));
                }

                const parts = buffer.split(' ')
                    .filter(String);

                if (parts[3] !== 'no') {
                    const mac = parts[3].replace(/^0:/g, '00:')
                        .replace(/:0:/g, ':00:')
                        .replace(/:0$/g, ':00')
                        .replace(/:([^:]{1}):/g, ':0$1:');

                    return resolve(mac.toUpperCase());
                }

                return reject(new Error('Could not find ip in arp table: ' + ip));
            });
        });
    });
};

/**
 * Retrieves the MAC address of the directly connected device at the specified IP address
 *
 * @param ip
 * @param separator
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
 * Retrieves the system gateway (default route) ipv4 address
 */
export const get_gateway_ipv4 = async (): Promise<string | undefined> => {
    return (await defaultGateway.v4()).gateway;
};

/**
 * Retrieves the system gateway (default route) ipv6 address
 */
export const get_gateway_ipv6 = async (): Promise<string | undefined> => {
    return (await defaultGateway.v6()).gateway;
};

const ARP = {
    lookup,
    get_gateway_ipv4,
    get_gateway_ipv6
};

export default ARP;
