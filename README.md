# Messaging Form Extender: Request

Development candidate `0.1.0-dev.0`; not published. MIT licensed. Adds declarative request reasons, conditional field validation and plain-text request formatting to `@ehven/messaging-form-core`. No course catalog, roster, Astro renderer or provider transport is imported.

## Request schema

```js
import {createRequestSchema} from '@ehven/messaging-form-extender-request';

const schema = createRequestSchema({
  identity: {allowedSources:['quote']},
  reasons: [
    {value:'estimate', label:'Request an estimate', fields:[
      {name:'budget',label:'Budget',required:false,limit:100},
    ]},
    {value:'callback',label:'Request a callback',fields:[]},
  ],
});
```

The schema exposes frozen `reasons`, `reasonField` (default `reason`), `validate(values,formData)` and `formatMessage(validatedRequest)`. Each reason has a unique value, label and fields. A field has name, label, required (true default) and limit (200 default). `programLimit` changes the default; `messages.reason` and `messages.field` change validation copy. Identity uses core's declarative options. Reasons and fields are bounded and validated; names cannot replace identity fields. Limits use UTF-16 code units.

Validation accepts exactly one known reason. Only the selected reason's fields are required, normalized and retained; inactive fields are discarded, including duplicate inactive program values. Active duplicate, non-string, empty-required, oversize or disallowed-control inputs fail. This is server enforcement; browser visibility does not establish validity or authorization.

Defaults preserve the existing three Coachware reasons: `already-enrolled` requires `current_program`; `sample` needs no extra program field; `between-sessions` requires `recent_program` and `upcoming_program`. `REQUEST_REASONS`, `PROGRAM_LIMIT`, `validateAccessRequest` and `requestMessage` provide compatibility conveniences. These defaults are a workflow preset, not the only supported application. Plain-text formatting preserves the existing class-detail wording; host rendering must escape text appropriately when used in HTML.

## Server composition

```js
import {handleAccessRequest} from '@ehven/messaging-form-extender-request/server';

export function processRequest(request, env, {verifyHuman,deliver}) {
  // Authorize the requester and selected resource, then rate-limit in the host.
  return handleAccessRequest(request, env, {
    schema, verifyHuman, deliver,
    successLocations: {quote:'/request-received/'},
  });
}
```

Core owns method/media/body limits, honeypot handling, verification and delivery boundaries, safe native redirects, no-store responses and honest simulated outcomes. The extender supplies its schema and reason field. The redirect fallback is `/`; pass application routes as data. Inactive conditional fields intentionally do not become strict scalar fields in core's outer parser; their selected-reason validation remains in this schema. Unknown file uploads are still rejected by core.

Render the reason selector and conditional inputs in your host adapter. Disable inactive controls and make only active required fields required; validate again on the server. Full browser conditional-field integration remains adapter acceptance work. A request never grants enrollment or other access. The host owns resource identifiers, permissions, privacy disclosures, credentials, provider mapping, retention and delivery policy. No raw message or token logging is supplied.

## Installation and compatibility

The core peer requirement is `@ehven/messaging-form-core@^0.1.0-dev.0`. Tests exercise the existing preset plus an independent estimate/callback fixture against an installed core tarball. A fresh offline installed-package test is part of the coordinated family verification; it is not evidence of a second live site. Neither package is published yet. There are no install hooks or additional runtime dependencies. Node 24 verification does not establish browser, WordPress PHP, real Worker or provider compatibility.

Uninstall by removing schema/handler composition and then the package. Remote submissions or access grants managed by the host remain subject to its own recovery/deletion policy. Public support/security routes will be defined before release; no service SLA is promised for this candidate.
