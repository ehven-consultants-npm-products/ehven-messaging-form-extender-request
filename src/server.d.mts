import type { MessagingRequestOptions } from '@ehven/messaging-form-core/server';
import type { AccessRequest, RequestSchema } from './index.mjs';

export interface AccessRequestOptions<Env> extends Omit<MessagingRequestOptions<Env, AccessRequest>, 'validate' | 'successFallback'> {
  schema?: Pick<RequestSchema, 'reasonField' | 'validate'>;
  successLocations?: Readonly<Record<string, string>>;
  defaultSuccessLocation?: string;
}
export function handleAccessRequest<Env>(request: Request, env: Env, options?: AccessRequestOptions<Env>): Promise<Response>;
