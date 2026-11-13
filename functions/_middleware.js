// This site's public address is in the NullclineNexus build library. Anyone who
// reaches it at its own *.pages.dev address is sent there, path and all, so every
// link and bookmark uses the library address. The library's router fetches this
// site with an X-NXB-Library header, and those requests pass straight through.
// Preview deployments (<branch>.robochargers-challenge-2027.pages.dev) are left alone.
const PUBLIC = 'https://build.nullclinenexus.com/robochargers-challenge-2027';
const OWN_HOST = 'robochargers-challenge-2027.pages.dev';

export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (url.hostname === OWN_HOST && !request.headers.has('x-nxb-library')) {
    return Response.redirect(PUBLIC + url.pathname + url.search, 302);
  }
  return next();
}
