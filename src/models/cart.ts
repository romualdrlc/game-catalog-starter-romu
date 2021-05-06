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

  async addCart(gameSlug: Cart): Promise<Cart> {
    const game = {
      name: gameSlug.name,
      price: gameSlug.body.price,
      iduser: gameSlug.body.idUser,
      cover: gameSlug.body.cover_url,
    };
    console.log(game);
    return game;
  }
}
