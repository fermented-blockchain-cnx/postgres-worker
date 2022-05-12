import { Client } from './driver/postgres'
declare global {

  type GS = typeof globalThis & GlobalSecrets

  interface GlobalSecrets {
    CF_CLIENT_ID: string | undefined;
    CF_CLIENT_SECRET: string | undefined;
    USER_PG_HOST: string | undefined;
  }
}
export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    // Add Cloudflare Access Service Token credentials as global variables, used when Worker
    // establishes the connection to Cloudflare Tunnel. This ensures only approved services can
    // connect to your Tunnel.

    // (globalThis as GS).CF_CLIENT_ID = env.CF_CLIENT_ID
    // (globalThis as GS).CF_CLIENT_SECRET = env.CF_CLIENT_SECRET
    // NOTE: You may omit these values, however your Tunnel will accept traffic from _any_ source
    // on the Internet which may result in extra load on your database.
    console.log('USER_PG_HOST', env.USER_PG_HOST)

    try {
      // Configure the database client and create a connection.
      const client = new Client({
        user: 'postgres',
        database: 'outflux',
        // hostname is the full URL to your pre-created Cloudflare Tunnel, see documentation here:
        // https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/create-tunnel
        hostname: `https://${env.USER_PG_HOST}`,
        // password: 'whelm', // use a secret to store passwords
        // port: '6000',
      })

      await client.connect()
      const result: any = await client.queryObject<number>`SELECT t1,temp,humid,time FROM public.model_tdb LIMIT 100;`
      // client.queryArray<number>`SELECT t1,temp,humid,time FROM public.model_tdb LIMIT 100;`
      return new Response(JSON.stringify(result.rows))

    } catch (e) {
      return new Response((e as Error).message)
    }
  },
}
