// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
  }

  namespace Cloudflare {
    interface Env {
      DROPBOX_REFRESH_TOKEN: string;
      DROPBOX_ACCESS_KEY: string;
      DROPBOX_SECRET_KEY: string;
    }
  }
}

export {};
