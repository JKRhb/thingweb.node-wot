/********************************************************************************
 * Copyright (c) 2018 - 2019 Contributors to the Eclipse Foundation
 * 
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 * 
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0, or the W3C Software Notice and
 * Document License (2015-05-13) which is available at
 * https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document.
 * 
 * SPDX-License-Identifier: EPL-2.0 OR W3C-20150513
 ********************************************************************************/

/**
 * Protocol test suite to test protocol implementations
 */

import { suite, test, slow, timeout, skip, only } from "mocha-typescript";
import { expect, should, assert } from "chai";
// should must be called to augment all variables
should();

import { Servient, ExposedThing } from "@node-wot/core";

import MqttBrokerServer from "../dist/mqtt-broker-server";
import MqttClientFactory from "../dist/mqtt-client-factory";

var osToSkip = ["windows-latest", "macos-latest"];

@suite("MQTT implementation")
class MqttClientSubscribeTest {
    @test "should expose via broker"(done: Function) {

        if (osToSkip.includes(process.env.matrix_os)) {
            console.log("Hi!!!!!!!!");
            done(); // TODO: should be replaced with a skip()
        }

        try {
            let servient = new Servient();
            var brokerAddress = process.env.mqtt_broker || "test.mosquitto.org"
            var brokerUri = `mqtt://${brokerAddress}:1883`

            let brokerServer = new MqttBrokerServer(brokerUri);
            servient.addServer(brokerServer);

            servient.addClientFactory(new MqttClientFactory());

            var counter = 0;

            servient.start().then((WoT) => {
                console.log("Hi!!!");
                expect(brokerServer.getPort()).to.equal(1883);
                expect(brokerServer.getAddress()).to.equal(brokerAddress);

                WoT.produce({
                    title: "TestWoTMQTT",
                    events: {
                        event1: { type: "number" },
                    },
                }).then((thing) => {
                    thing.expose().then(() => {
                        console.info(
                            "Exposed",
                            thing.getThingDescription().title
                        );

                        WoT.consume(thing.getThingDescription()).then(
                            (client) => {
                                let check = 0;
                                client
                                    .subscribeEvent("event1", (x) => {
                                        expect(x).to.equal(++check);
                                        console.log("Hi.");
                                        if (check === 3) {
                                            done();
                                        }
                                    })
                                    .then(() => {})
                                    .catch((e) => {
                                        expect(true).to.equal(false);
                                    });

                                var job = setInterval(() => {
                                    ++counter;
                                    thing.emitEvent("event1", counter);
                                    if (counter === 3) {
                                        clearInterval(job);
                                    }
                                }, 100);
                            }
                        );
                    });
                });
            });
        } catch (err) {
            console.error("ERROR", err);
        }
    }
}
