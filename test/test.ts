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

import * as assert from 'assert';
import { it, describe } from 'mocha';
import ARP from '../src/arp';
describe('ARP Tests', () => {
    let gatewayv4: string | undefined;
    let gatewayv6: string | undefined;

    before(async () => {
        try {
            gatewayv4 = await ARP.get_gateway_ipv4();
        } catch {}

        try {
            gatewayv6 = await ARP.get_gateway_ipv6();
        } catch {}
    });

    it('Get Gateway IPv4', async function () {
        if (!gatewayv4) {
            return this.skip();
        }

        const check = await ARP.get_gateway_ipv4();

        assert.equal(gatewayv4, check);
    });

    it('Get Gateway IPv6', async function () {
        if (!gatewayv6) {
            return this.skip();
        }

        const check = await ARP.get_gateway_ipv6();

        assert.equal(gatewayv6, check);
    });

    it('Lookup IPv4 Gateway', async function () {
        if (!gatewayv4) {
            return this.skip();
        }

        const check = await ARP.lookup(gatewayv4);

        assert.notEqual(check.length, 0);
    });

    it('Lookup IPv6 Gateway', async function () {
        if (!gatewayv6) {
            return this.skip();
        }

        // TODO: implement code

        this.skip();
    });

    it('Lookup 8.8.8.8 [fails]', async () => {
        ARP.lookup('8.8.8.8')
            .then(() => assert.fail());
    });

    it('Lookup 1.1.1.1 [fails]', async () => {
        ARP.lookup('1.1.1.1')
            .then(() => assert.fail());
    });
});
