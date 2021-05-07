import { Collection } from "mongodb";

export type Cart = {
  games: [];
  session: string;
};

export class CartModel {
  private collection: Collection;

  constructor(collection: Collection) {
    this.collection = collection;
  }
  findBySlug(slug: string): Promise<Cart | null> {
    return this.collection.findOne({
      slug: slug,
    });
  }
  // foncion qui recupere id du gars connecter

  // focniton qui recupere le jeu
  // verifie si l'id en cours a deja le jeu
  // si il a le jeu alors on incremente le nombre d'articles
  // sinon on ajoute le jeu
  // si il n'y a pas d'id on cree un nouveau panier
}
