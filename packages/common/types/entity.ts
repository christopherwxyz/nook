import { ObjectId } from "mongodb";

export type FarcasterAccount = {
  fid: string;
  custodyAddress: string;
  username?: string;
  pfp?: string;
  displayName?: string;
  bio?: string;
  url?: string;
  followers?: number;
  following?: number;
};

export type BlockchainAccount = {
  address: string;
  isContract: boolean;
};

export type Entity = {
  /** DB id */
  _id: ObjectId;

  /** Farcaster account */
  farcaster: FarcasterAccount;

  /** Blockchain accounts */
  blockchain: BlockchainAccount[];

  /** Date record was created */
  createdAt: Date;

  /** Date record was updated at */
  updatedAt: Date;
};
