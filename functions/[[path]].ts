/// <reference path="../node_modules/@cloudflare/workers-types/index.d.ts" />

type Env = Record<'API_TOKEN', string>;
type Data = Record<string, unknown>;
type PgFunction = PagesFunction<Env, 'path', Data>;
type Context = EventContext<Env, 'path', Data>;

export const onRequest: PgFunction = async function (context) {
  const { request, params, env } = context;
  const response = await env.ASSETS.fetch(request);
  const cf = (request as any).cf;
  const url = new URL(request.url);
  const queryParams = url.searchParams;
  const path = params.path;
  const [version, resource] = path || [null, 'sandbox-index'];

  context.data = {
    url: request.url,
    path: params.path,
    version,
    resource,
    method: request.method,
    date: String(new Date()),

    colo: cf?.colo,
    country: cf?.country,
    httpProtocol: cf?.httpProtocol,
    city: cf?.city,
    continent: cf?.continent,
    region: cf?.region,
    regionCode: cf?.regionCode,
    timezone: cf?.timezone,

    accept: request.headers.get('accept'),
    'accept-encoding': request.headers.get('accept-encoding'),
    'accept-language': request.headers.get('accept-language'),
    referer: request.headers.get('referer'),
    'sec-ch-ua': request.headers.get('sec-ch-ua'),
    'sec-ch-ua-mobile': request.headers.get('sec-ch-ua-mobile'),
    'sec-ch-ua-platform': request.headers.get('sec-ch-ua-platform'),
    'sec-fetch-dest': request.headers.get('sec-fetch-dest'),
    'sec-fetch-mode': request.headers.get('sec-fetch-mode'),
    'sec-fetch-site': request.headers.get('sec-fetch-site'),
    'user-agent': request.headers.get('user-agent'),

    ok: response.ok,
    'content-encoding': response.headers.get('content-encoding'),
    'content-type': response.headers.get('content-type'),
    status: response.status,
    statusText: response.statusText,

    'livecodes-markup': queryParams.get('markup'),
    'livecodes-style': queryParams.get('style'),
    'livecodes-script': queryParams.get('script'),
    'livecodes-isEmbed': queryParams.get('isEmbed'),
    'livecodes-isLoggedIn': queryParams.get('isLoggedIn'),
  };

  context.waitUntil(logToAPI(context));

  return response;
};

const logToAPI = (context: Context) => {
  const { data, env } = context;
  return fetch('https://api2.livecodes.io/log', {
    method: 'POST',
    headers: {
      'API-Token': env.API_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'analytics',
      data,
    }),
  });
};
