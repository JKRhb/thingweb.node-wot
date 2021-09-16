import { suite, test } from "@testdeck/mocha";
import * as express from "express";
import { should } from "chai";
import create, { IntrospectionEndpoint, Validator, EndpointValidator } from "../src/oauth-token-validation";
import * as http from "http";
import * as https from "https";
import * as fs from "fs";
import { assert } from "console";
import { promisify } from "util";

should();

describe("OAuth2.0 Validator tests", () => {
    it("should create an introspection validator", () => {
        const config: IntrospectionEndpoint = {
            name: "introspection_endpoint",
            endpoint: "http://localhost:7777",
        };
        create(config).should.be.instanceOf(EndpointValidator);
    });

    it("should throw for invalid method", () => {
        const test = () => create({ name: "unknown" });

        test.should.throw();
    });
    @suite
    class IntrospectProtocolTests {
        private validator: Validator;
        static server: http.Server;
        static before() {
            console.debug = () => {};
            console.warn = () => {};
            console.info = () => {};

            const tokens = ["active", "notActive"];

            const introspectEndpoint: express.Express = express();
            introspectEndpoint.use(express.urlencoded({ extended: true }));

            introspectEndpoint.use("/invalid", (req, res) => {
                return res.status(400).end();
            });

            introspectEndpoint.use("/invalidResponse", (req, res) => {
                return res
                    .status(200)
                    .json({
                        scope: "1 2",
                        client_id: "coolClient",
                    })
                    .end();
            });

            introspectEndpoint.use("/invalidContent", (req, res) => {
                return res.status(200).end();
            });

            introspectEndpoint.use((req, res) => {
                if (req.method !== "POST" || !req.is("application/x-www-form-urlencoded")) {
                    return res.status(400).end();
                }

                const token = req.body.token;

                if (!token) {
                    return res.status(400).end();
                }

                if (token === tokens[0]) {
                    return res
                        .status(200)
                        .json({
                            active: true,
                            scope: "1 2",
                            client_id: "coolClient",
                        })
                        .end();
                } else {
                    return res
                        .status(200)
                        .json({
                            active: false,
                        })
                        .end();
                }
            });

            this.server = introspectEndpoint.listen(7777);
        }

        static after() {
            return promisify(this.server.close.bind(this.server))();
        }

        before() {
            const config: IntrospectionEndpoint = {
                name: "introspection_endpoint",
                endpoint: "http://localhost:7777",
            };
            this.validator = create(config);
        }

        @test async "should validate token from headers"() {
            const req = {
                headers: {
                    authorization: "Bearer active",
                },
                url: "http://test",
            };

            const valid = await this.validator.validate(req as http.IncomingMessage, ["1", "2"], /.*/g);
            valid.should.be.true;
        }

        @test async "should validate token from query string"() {
            const req = {
                headers: {},
                url: "http://test?access_token=active",
            };

            const valid = await this.validator.validate(req as http.IncomingMessage, ["1", "2"], /.*/g);
            valid.should.be.true;
        }

        @test async "should validate a single scope"() {
            const req = {
                headers: {},
                url: "http://test?access_token=active",
            };

            const valid = await this.validator.validate(req as http.IncomingMessage, ["1"], /.*/g);
            valid.should.be.true;
        }

        @test async "should validate a single scope mixed with invalid scopes"() {
            const req = {
                headers: {},
                url: "http://test?access_token=active",
            };

            const valid = await this.validator.validate(req as http.IncomingMessage, ["1", "3", "4"], /.*/g);
            valid.should.be.true;
        }

        @test async "should validate cliedId"() {
            const req = {
                headers: {},
                url: "http://test?access_token=active",
            };

            const valid = await this.validator.validate(req as http.IncomingMessage, ["1", "3", "4"], /coolClient/g);
            valid.should.be.true;
        }

        @test async "should validate cliedId using regex"() {
            const req = {
                headers: {},
                url: "http://test?access_token=active",
            };

            const valid = await this.validator.validate(req as http.IncomingMessage, ["1", "3", "4"], /cool.*/g);
            valid.should.be.true;
        }

        @test async "should reject invalid cliedId"() {
            const req = {
                headers: {},
                url: "http://test?access_token=active",
            };

            const valid = await this.validator.validate(req as http.IncomingMessage, ["1", "3", "4"], /otherClient/g);
            valid.should.be.false;
        }

        @test async "should reject invalid scopes"() {
            const req = {
                headers: {},
                url: "http://test?access_token=active",
            };

            const valid = await this.validator.validate(req as http.IncomingMessage, ["3"], /.*/g);
            valid.should.be.false;
        }

        @test async "should reject invalid token from headers"() {
            const req = {
                headers: {
                    authorization: "Bearer notActive",
                },
                url: "http://test",
            };

            const valid = await this.validator.validate(req as http.IncomingMessage, [], /.*/g);
            valid.should.be.false;
        }

        @test async "should reject invalid token from query string"() {
            const req = {
                headers: {},
                url: "http://test?access_token=notActive",
            };

            const valid = await this.validator.validate(req as http.IncomingMessage, [], /.*/g);
            valid.should.be.false;
        }

        @test async "should throw invalid incoming message"() {
            const req = {
                headers: {},
                url: "http://test",
            };

            try {
                const valid = await this.validator.validate(req as http.IncomingMessage, [], /.*/g);
                assert(false, "method did not throw");
            } catch (error) {
                assert(true);
            }
        }

        @test async "should throw invalid introspection http response"() {
            const config: IntrospectionEndpoint = {
                name: "introspection_endpoint",
                endpoint: "http://localhost:7777/invalid",
            };
            this.validator = create(config);

            const req = {
                headers: {
                    authorization: "Bearer active",
                },
                url: "http://test",
            };

            try {
                const valid = await this.validator.validate(req as http.IncomingMessage, [], /.*/g);
                assert(false, "method did not throw");
            } catch (error) {
                assert(true);
            }
        }

        @test async "should throw invalid introspection token response"() {
            const config: IntrospectionEndpoint = {
                name: "introspection_endpoint",
                endpoint: "http://localhost:7777/invalidResponse",
            };
            this.validator = create(config);

            const req = {
                headers: {
                    authorization: "Bearer active",
                },
                url: "http://test",
            };

            try {
                const valid = await this.validator.validate(req as http.IncomingMessage, [], /.*/g);
                assert(false, "method did not throw");
            } catch (error) {
                assert(true);
            }
        }

        @test async "should throw invalid introspection content type response"() {
            const config: IntrospectionEndpoint = {
                name: "introspection_endpoint",
                endpoint: "http://localhost:7777/invalidContent",
            };
            this.validator = create(config);

            const req = {
                headers: {
                    authorization: "Bearer active",
                },
                url: "http://test",
            };

            try {
                const valid = await this.validator.validate(req as http.IncomingMessage, [], /.*/g);
                assert(false, "method did not throw");
            } catch (error) {
                assert(true);
            }
        }

        @test async "should connect using https"() {
            // Initialize test

            const introspectEndpoint: express.Express = express();
            introspectEndpoint.use(express.urlencoded({ extended: true }));

            introspectEndpoint.use((req, res) => {
                // No validation just testing https connection
                return res
                    .status(200)
                    .json({
                        active: true,
                        scope: "1 2",
                        client_id: "coolClient",
                    })
                    .end();
            });

            const server = https.createServer(
                {
                    key: fs.readFileSync("./test/server.key"),
                    cert: fs.readFileSync("./test/server.cert"),
                },
                introspectEndpoint
            );
            const serverStarted = new Promise<void>((r, e) => {
                server.listen(7778, r); // might need to check if there was an error
            });
            await serverStarted;

            const config: IntrospectionEndpoint = {
                name: "introspection_endpoint",
                endpoint: "https://localhost:7778",
                allowSelfSigned: true,
            };
            this.validator = create(config);

            const req = {
                headers: {
                    authorization: "Bearer active",
                },
                url: "http://test",
            };

            // test
            const valid = await this.validator.validate(req as http.IncomingMessage, ["1"], /.*/g);
            valid.should.be.true;
            await promisify(server.close.bind(server))();
        }
    }
});
