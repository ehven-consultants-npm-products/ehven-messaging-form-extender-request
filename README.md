# Messaging Form Extender: Request

MIT licensed. Adds declarative request reasons, conditional field validation and plain-text request formatting to `@ehven/messaging-form-core`. No course catalog, roster, Astro renderer or provider transport is imported.

## Install

```sh
npm install @ehven/messaging-form-core @ehven/messaging-form-extender-request
```

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

## Compatibility and removal

Requires Node.js 24 or later and Messaging Form Core ^0.1.0. TypeScript declarations are included. Renderer, authorization and live provider behavior depend on the host application.

Remove imports and application composition before uninstalling. Previously accepted provider submissions remain subject to the host’s retention policy.

## Support

Patch releases within 0.1 are intended to be compatible. Future 0.x minor releases may change APIs. Open an issue for bugs and usage questions. For a security concern, use the contact form to request a private reporting channel and keep credentials, tokens and submissions out of the public tracker. [Issues](https://github.com/ehven-consultants-npm-products/ehven-messaging-form-extender-request/issues) · [Contact](https://ehven.com/contact/)
