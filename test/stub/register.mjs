import { register } from 'node:module'
register(
	'data:text/javascript,' +
		encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  if (spec === '@companion-module/base') return { url: new URL('./base-stub.js', ${JSON.stringify(import.meta.url)}).href, shortCircuit: true }
  return next(spec, ctx)
}`),
)
