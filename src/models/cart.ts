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

  async addCart(gameSlug: string, add: Cart): Promise<Cart> {
    const game = await this.collection.findOne({ slug: gameSlug });
    console.log(game);
    if (!game) {
      throw new Error("Game not found");
    }
    if (!game.cart) {
      game.cart = [];
    }
    game.cart.push(add);
    await this.collection.updateOne(
      { _id: game._id },
      { $set: { cart: game.cart } }
    );
    console.log();
    return game;
  }
}
