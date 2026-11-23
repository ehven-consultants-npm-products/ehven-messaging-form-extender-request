import { createIdentityValidator } from '@ehven/messaging-form-core';

export const PROGRAM_LIMIT = 200;
export const REQUEST_REASONS = Object.freeze([
  Object.freeze({value:'already-enrolled',label:"I'm supposed to already have access to this Coachware area",fields:Object.freeze([Object.freeze({name:'current_program',label:'Current class or program'})])}),
  Object.freeze({value:'sample',label:'I already have access to other Coachware, and would like to sample this area as well',fields:Object.freeze([])}),
  Object.freeze({value:'between-sessions',label:"I'm between sessions and would like to prep for the next one",fields:Object.freeze([Object.freeze({name:'recent_program',label:'Current or recent class or program'}),Object.freeze({name:'upcoming_program',label:'Next or upcoming class or program'})])}),
]);
const fieldName = /^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/;
const unsafe = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;
const validText = value => typeof value === 'string' && value.length > 0 && value.length <= 2000 && !unsafe.test(value);

export function createRequestSchema({identity,reasons=REQUEST_REASONS,reasonField='reason',programLimit=PROGRAM_LIMIT,messages={}}={}) {
  if(typeof reasonField!=='string'||!fieldName.test(reasonField)||!Number.isSafeInteger(programLimit)||programLimit<1||programLimit>32768||!Array.isArray(reasons)||reasons.length<1||reasons.length>32)throw new TypeError('Invalid request policy.');
  if(!messages||typeof messages!=='object'||Array.isArray(messages)||Object.keys(messages).some(k=>!['reason','field'].includes(k))||Object.values(messages).some(v=>!validText(v)))throw new TypeError('Invalid request messages.');
  messages={...messages};
  const commonNames=new Set(['first_name','last_name','email','email_confirmation','source','website',...Object.values(identity?.fieldNames??{})]);
  if(commonNames.has(reasonField))throw new TypeError('The reason field must be distinct from identity fields.');
  commonNames.add(reasonField);
  const choices=reasons.map(reason=>{
    if(!reason||typeof reason.value!=='string'||!/^[a-z][a-z0-9-]{0,63}$/.test(reason.value)||!validText(reason.label)||!Array.isArray(reason.fields)||reason.fields.length>16)throw new TypeError('Invalid request reason.');
    const fields=reason.fields.map(field=>{
      const limit=field.limit??programLimit;
      if(!field||typeof field.name!=='string'||!fieldName.test(field.name)||commonNames.has(field.name)||!validText(field.label)||!Number.isSafeInteger(limit)||limit<1||limit>32768||field.required!==undefined&&typeof field.required!=='boolean')throw new TypeError('Invalid conditional field.');
      return Object.freeze({name:field.name,label:field.label,required:field.required!==false,limit});
    });
    if(new Set(fields.map(f=>f.name)).size!==fields.length)throw new TypeError('Duplicate conditional field.');
    return Object.freeze({value:reason.value,label:reason.label,fields:Object.freeze(fields)});
  });
  if(new Set(choices.map(c=>c.value)).size!==choices.length)throw new TypeError('Duplicate request reason.');
  const validateIdentity=createIdentityValidator(identity);
  function validate(values,formData) {
    if(!formData||typeof formData.getAll!=='function')throw new TypeError('FormData is required.');
    const result=validateIdentity(values),errors=[...result.errors],raw=formData.getAll(reasonField);
    const reason=raw.length===1&&typeof raw[0]==='string'?raw[0]:'';
    const choice=choices.find(c=>c.value===reason),details={};
    if(!choice)errors.push({field:reasonField,code:'invalid',message:messages.reason??'Choose why you are requesting access.'});
    for(const field of choice?.fields??[]) {
      const inputs=formData.getAll(field.name),value=inputs.length===1&&typeof inputs[0]==='string'?inputs[0].trim().replace(/\s+/gu,' '):'';
      if(inputs.length>1||inputs.some(v=>typeof v!=='string'||unsafe.test(v))||field.required&&!value||value.length>field.limit)errors.push({field:field.name,code:'invalid',message:messages.field??`Enter a class or program name of up to ${field.limit} characters.`});
      details[field.name]=value;
    }
    return {...result,ok:errors.length===0,errors,data:{...result.data,request:{reason,...details}}};
  }
  function formatMessage(request) {
    const choice=choices.find(c=>c.value===request?.reason);
    if(!choice)throw new TypeError('A validated request reason is required.');
    const lines=choice.fields.map(field=>{
      const value=request[field.name]??'';
      if(typeof value!=='string'||unsafe.test(value)||field.required&&!value||value.length>field.limit)throw new TypeError('Validated conditional fields are required.');
      return value?`${field.label}: ${value}`:'';
    }).filter(Boolean);
    return [choice.label,lines.join('\n')].filter(Boolean).join('\n\n');
  }
  return Object.freeze({reasonField,reasons:Object.freeze(choices),validate,formatMessage});
}

const defaultSchema=createRequestSchema();
export const validateAccessRequest=defaultSchema.validate;
export const requestMessage=defaultSchema.formatMessage;
