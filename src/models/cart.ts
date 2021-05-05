import { Collection } from "mongodb";

export type Cart = {
  name: string;
  price: number;
  [key: string]: any;
};

export class CartModel {
  private collection: Collection;

  constructor(collection: Collection) {
    this.collection = collection;
  }

  async addCart(gameSlug: string): Promise<string> {
    console.log(gameSlug);
    return gameSlug;
  }
}
