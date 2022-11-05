// Copyright (c) 2016-2022 Brandon Lehmann
//
// Please see the included LICENSE file for more information.

import { spawn } from 'child_process';
import { isIP } from 'net';

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
                    return reject(new Error('Error running arp: ' + code + ' ' + errStream));
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
                    return reject(new Error('Error running arp: ' + code + ' ' + errStream));
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
                    return reject(new Error('Error running arp: ' + code + ' ' + errStream));
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
 * @constructor
 */
const ARP = async (ip: string, separator = ':'): Promise<string> => {
    if (isIP(ip) === 0) {
        throw new Error(`${ip} is not a valid IP address`);
    }

    let result: string;

    if (process.platform.includes('linux')) {
        result = await linux(ip);
    } else if (process.platform.includes('win')) {
        result = await windows(ip);
    } else if (process.platform.includes('darwin')) {
        result = await macintosh(ip);
    } else {
        throw new Error('Unknown platform detected');
    }

    return result.split(':')
        .join(separator);
};

export default ARP;
