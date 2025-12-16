import type Keyv from 'keyv'
import "express-session";
// import RedisClient from "@redis/client/dist/lib/client";
import { Collection } from "discord.js";
declare module "discord.js" {
    interface Client {
        commands: Collection<string, any>;
        message_commands: Collection<string, any>;
        no_pref_commands: Collection<string, any>;
        redis: Keyv;
    }
}


declare module "express-session" {
    interface SessionData {
      user?: {
        id: string;
        username: string;
        avatar: string | null;
        email?: string;
      },
      oauth_redirect: string;
    }
  }