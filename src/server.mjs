import { handleMessagingRequest } from '@ehven/messaging-form-core/server';
import { createRequestSchema } from './index.mjs';

export function handleAccessRequest(request,env,{schema=createRequestSchema(),successLocations={},defaultSuccessLocation='/',successLocation,fields=[],...options}={}) {
  if(!schema||typeof schema.validate!=='function'||typeof schema.reasonField!=='string')throw new TypeError('A request schema is required.');
  return handleMessagingRequest(request,env,{...options,validate:schema.validate,fields:[schema.reasonField,...fields],successFallback:defaultSuccessLocation,successLocation:successLocation??(source=>Object.hasOwn(successLocations,source)?successLocations[source]:defaultSuccessLocation)});
}
