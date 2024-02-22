/********************************************************************************
 * Copyright (c) 2024 Contributors to the Eclipse Foundation
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

import { ProtocolClient, Content, DefaultContent, createLoggers, ContentSerdes } from "@node-wot/core";
import { Form, SecurityScheme } from "@node-wot/td-tools";
import { Subscription } from "rxjs/Subscription";

export default class NdnClient implements ProtocolClient {
    readResource(form: Form): Promise<Content> {
        throw new Error("Method not implemented.");
    }

    writeResource(form: Form, content: Content): Promise<void> {
        throw new Error("Method not implemented.");
    }

    invokeResource(form: Form, content?: Content | undefined): Promise<Content> {
        throw new Error("Method not implemented.");
    }

    unlinkResource(form: Form): Promise<void> {
        throw new Error("Method not implemented.");
    }

    subscribeResource(
        form: Form,
        next: (content: Content) => void,
        error?: ((error: Error) => void) | undefined,
        complete?: (() => void) | undefined
    ): Promise<Subscription> {
        throw new Error("Method not implemented.");
    }

    requestThingDescription(uri: string): Promise<Content> {
        throw new Error("Method not implemented.");
    }

    start(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    stop(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    setSecurity(metadata: SecurityScheme[], credentials?: unknown): boolean {
        throw new Error("Method not implemented.");
    }
}
